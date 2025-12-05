/**
 * BusDriver - AgentDriver implementation that communicates via SystemBus
 *
 * Acts as the isolation layer between Agent and Ecosystem.
 * - Sends user messages to bus (Effector picks them up)
 * - Receives DriveableEvents from bus (Receptor emits them)
 *
 * Flow:
 * ```
 * Agent.receive(message)
 *   → BusDriver.receive(message)
 *     → bus.emit({ type: "user_message", data: message })
 *       → Effector → Claude SDK → Receptor
 *         → bus.emit(DriveableEvent)
 *           → BusDriver yields to Agent
 * ```
 */

import type { AgentDriver, UserMessage } from "@agentxjs/types/agent";
import type { SystemBus } from "@agentxjs/types/runtime/internal";
import type { DriveableEvent } from "@agentxjs/types/runtime";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ecosystem/BusDriver");

/**
 * BusDriver configuration
 */
export interface BusDriverConfig {
  /**
   * Agent ID for filtering events
   */
  agentId: string;

  /**
   * Turn ID generator (optional)
   * If not provided, generates based on timestamp
   */
  generateTurnId?: () => string;
}

/**
 * BusDriver - Communicates with Ecosystem via SystemBus
 */
export class BusDriver implements AgentDriver {
  readonly name = "BusDriver";
  readonly description = "Driver that communicates via SystemBus";

  private readonly bus: SystemBus;
  private readonly config: BusDriverConfig;
  private currentTurnId: string | null = null;
  private aborted = false;

  constructor(bus: SystemBus, config: BusDriverConfig) {
    this.bus = bus;
    this.config = config;
  }

  /**
   * Receive a user message and yield DriveableEvents from bus
   */
  async *receive(message: UserMessage): AsyncIterable<DriveableEvent> {
    this.aborted = false;

    // Generate turn ID for this conversation turn
    this.currentTurnId = this.config.generateTurnId?.() ?? this.generateTurnId();

    logger.debug("BusDriver receiving message", {
      agentId: this.config.agentId,
      turnId: this.currentTurnId,
      messageId: message.id,
    });

    // Create a promise-based event collector
    const events: DriveableEvent[] = [];
    let resolveNext: ((value: IteratorResult<DriveableEvent>) => void) | null = null;
    let done = false;

    // Subscribe to DriveableEvents on the bus
    const unsubscribe = this.bus.onAny((event) => {
      // Filter for DriveableEvents
      if (!this.isDriveableEvent(event)) return;

      // TODO: Filter by turnId when turnId tracking is implemented
      // if (event.turnId !== this.currentTurnId) return;

      if (this.aborted) {
        done = true;
        if (resolveNext) {
          resolveNext({ done: true, value: undefined as any });
        }
        return;
      }

      // Check for end of stream
      if (event.type === "message_stop" || event.type === "interrupted") {
        events.push(event);
        done = true;
      } else {
        events.push(event);
      }

      // If someone is waiting, resolve immediately
      if (resolveNext) {
        const e = events.shift();
        if (e) {
          resolveNext({ done: false, value: e });
          resolveNext = null;
        } else if (done) {
          resolveNext({ done: true, value: undefined as any });
          resolveNext = null;
        }
      }
    });

    try {
      // Emit user message to bus (Effector will pick it up)
      this.bus.emit({
        type: "user_message",
        data: message,
      } as any);

      // Yield events as they arrive
      while (!done || events.length > 0) {
        if (events.length > 0) {
          const event = events.shift()!;
          yield event;

          // Check if this was the last event
          if (event.type === "message_stop" || event.type === "interrupted") {
            break;
          }
        } else if (!done) {
          // Wait for next event
          await new Promise<IteratorResult<DriveableEvent>>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      unsubscribe();
      this.currentTurnId = null;
      logger.debug("BusDriver finished", { agentId: this.config.agentId });
    }
  }

  /**
   * Interrupt current operation
   */
  interrupt(): void {
    logger.debug("BusDriver interrupt requested", { agentId: this.config.agentId });
    this.aborted = true;

    // Emit interrupt event to bus (Effector will handle it)
    this.bus.emit({
      type: "interrupt",
      agentId: this.config.agentId,
    } as any);
  }

  /**
   * Generate a turn ID
   */
  private generateTurnId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `turn_${timestamp}_${random}`;
  }

  /**
   * Check if event is a DriveableEvent
   */
  private isDriveableEvent(event: any): event is DriveableEvent {
    const driveableTypes = [
      "message_start",
      "message_delta",
      "message_stop",
      "text_content_block_start",
      "text_delta",
      "text_content_block_stop",
      "tool_use_content_block_start",
      "input_json_delta",
      "tool_use_content_block_stop",
      "tool_call",
      "tool_result",
      "interrupted",
    ];
    return event && typeof event.type === "string" && driveableTypes.includes(event.type);
  }
}
