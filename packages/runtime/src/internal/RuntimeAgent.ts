/**
 * RuntimeAgent - Full Agent implementation
 *
 * Combines:
 * - Engine: Event processing (from @agentxjs/agent)
 * - Driver: Bus communication
 * - Sandbox: Workdir, MCP
 * - Session: Message persistence
 */

import type { Agent as RuntimeAgentInterface, AgentLifecycle, AgentConfig, SystemEvent, EventCategory } from "@agentxjs/types/runtime";
import type { AgentEngine, AgentPresenter, AgentOutput, Message } from "@agentxjs/types/agent";
import type { SystemBus, SystemBusProducer, Sandbox, Session } from "@agentxjs/types/runtime/internal";
import { createAgent } from "@agentxjs/agent";
import { createLogger } from "@agentxjs/common";
import { BusDriver } from "./BusDriver";

const logger = createLogger("runtime/RuntimeAgent");

/**
 * RuntimeAgent configuration
 */
export interface RuntimeAgentConfig {
  agentId: string;
  imageId: string;
  containerId: string;
  config: AgentConfig;
  bus: SystemBus;
  sandbox: Sandbox;
  session: Session;
}

/**
 * BusPresenter - Forwards AgentOutput to SystemBus as proper SystemEvent
 *
 * Converts lightweight EngineEvent (type, timestamp, data) to full SystemEvent
 * by adding source, category, intent, and context.
 *
 * Uses SystemBusProducer (write-only) because Presenter only emits events.
 */
class BusPresenter implements AgentPresenter {
  readonly name = "BusPresenter";
  readonly description = "Forwards AgentOutput to SystemBus and collects messages";

  constructor(
    private readonly producer: SystemBusProducer,
    private readonly session: Session,
    private readonly agentId: string,
    private readonly imageId: string,
    private readonly containerId: string
  ) {}

  present(_agentId: string, output: AgentOutput): void {
    // Convert EngineEvent to SystemEvent
    const systemEvent: SystemEvent = {
      type: output.type,
      timestamp: output.timestamp,
      data: output.data,
      source: "agent",
      category: this.getCategoryForOutput(output),
      intent: "notification",
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    };

    this.producer.emit(systemEvent);

    // Collect message events to session (fire-and-forget with error logging)
    if (this.isMessageEvent(output)) {
      this.session.addMessage(output.data as Message).catch((err) => {
        // Log error but don't block - persistence failure shouldn't stop the agent
        logger.error("Failed to persist message", { error: err, messageType: output.type });
      });
    }
  }

  /**
   * Determine event category from output type
   */
  private getCategoryForOutput(output: AgentOutput): EventCategory {
    const type = output.type;

    // Stream events
    if (
      type === "message_start" ||
      type === "message_delta" ||
      type === "message_stop" ||
      type === "text_delta" ||
      type === "tool_use_start" ||
      type === "input_json_delta" ||
      type === "tool_use_stop" ||
      type === "tool_result"
    ) {
      return "stream";
    }

    // Message events
    if (
      type === "user_message" ||
      type === "assistant_message" ||
      type === "tool_call_message" ||
      type === "tool_result_message"
    ) {
      return "message";
    }

    // Turn events
    if (type === "turn_request" || type === "turn_response") {
      return "turn";
    }

    // State events (default)
    return "state";
  }

  private isMessageEvent(output: AgentOutput): boolean {
    return (
      output.type === "user_message" ||
      output.type === "assistant_message" ||
      output.type === "tool_call_message" ||
      output.type === "tool_result_message"
    );
  }
}

/**
 * RuntimeAgent - Full Agent with Engine + Sandbox + Session
 */
export class RuntimeAgent implements RuntimeAgentInterface {
  readonly agentId: string;
  readonly imageId: string;
  readonly name: string;
  readonly containerId: string;
  readonly createdAt: number;

  private _lifecycle: AgentLifecycle = "running";
  private readonly engine: AgentEngine;
  private readonly driver: BusDriver;
  private readonly producer: SystemBusProducer;
  readonly session: Session;
  readonly config: AgentConfig;

  constructor(config: RuntimeAgentConfig) {
    this.agentId = config.agentId;
    this.imageId = config.imageId;
    this.name = config.config.name ?? `agent-${config.agentId}`;
    this.containerId = config.containerId;
    this.createdAt = Date.now();
    this.producer = config.bus.asProducer();
    this.session = config.session;
    this.config = config.config;
    // Note: sandbox is stored in config but not directly on this instance
    // It's used during agent creation but not needed after

    // Create Driver (needs both consumer and producer for bidirectional communication)
    this.driver = new BusDriver(
      config.bus.asConsumer(),
      config.bus.asProducer(),
      { agentId: this.agentId }
    );

    // Create Presenter (forwards to bus + collects to session)
    const presenter = new BusPresenter(
      this.producer,
      config.session,
      this.agentId,
      this.imageId,
      this.containerId
    );

    // Create Engine (from @agentxjs/agent)
    this.engine = createAgent({
      driver: this.driver,
      presenter,
    });
  }

  get lifecycle(): AgentLifecycle {
    return this._lifecycle;
  }

  async receive(message: string): Promise<void> {
    logger.debug("RuntimeAgent.receive called", { agentId: this.agentId, messagePreview: message.substring(0, 50) });
    if (this._lifecycle !== "running") {
      throw new Error(`Cannot send message to ${this._lifecycle} agent`);
    }
    logger.debug("Calling engine.receive", { agentId: this.agentId });
    await this.engine.receive(message);
    logger.debug("engine.receive completed", { agentId: this.agentId });
  }

  interrupt(): void {
    this.engine.interrupt();

    // Emit interrupted event
    this.producer.emit({
      type: "interrupted",
      timestamp: Date.now(),
      source: "agent",
      category: "lifecycle",
      intent: "notification",
      data: {
        agentId: this.agentId,
        containerId: this.containerId,
      },
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    });
  }

  async stop(): Promise<void> {
    if (this._lifecycle === "destroyed") {
      throw new Error("Cannot stop destroyed agent");
    }
    this._lifecycle = "stopped";
  }

  async resume(): Promise<void> {
    if (this._lifecycle === "destroyed") {
      throw new Error("Cannot resume destroyed agent");
    }
    this._lifecycle = "running";

    // Emit session_resumed event
    this.producer.emit({
      type: "session_resumed",
      timestamp: Date.now(),
      source: "session",
      category: "lifecycle",
      intent: "notification",
      data: {
        sessionId: this.session.sessionId,
        agentId: this.agentId,
        containerId: this.containerId,
      },
      context: {
        containerId: this.containerId,
        imageId: this.imageId,
        agentId: this.agentId,
        sessionId: this.session.sessionId,
      },
    });
  }

  async destroy(): Promise<void> {
    if (this._lifecycle !== "destroyed") {
      await this.engine.destroy();
      this._lifecycle = "destroyed";

      // Emit session_destroyed event
      this.producer.emit({
        type: "session_destroyed",
        timestamp: Date.now(),
        source: "session",
        category: "lifecycle",
        intent: "notification",
        data: {
          sessionId: this.session.sessionId,
          agentId: this.agentId,
          containerId: this.containerId,
        },
        context: {
          containerId: this.containerId,
          imageId: this.imageId,
          agentId: this.agentId,
          sessionId: this.session.sessionId,
        },
      });
    }
  }
}
