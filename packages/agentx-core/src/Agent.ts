/**
 * Agent
 *
 * Core Agent implementation - provider-agnostic.
 * Provider is injected and handles all platform-specific logic.
 */

import type {
  Agent as IAgent,
  AgentConfig,
  EventType,
  EventPayload,
  AgentEvent,
} from "@deepractice-ai/agentx-api";
import { AgentAbortError } from "@deepractice-ai/agentx-api";
import type { Message } from "@deepractice-ai/agentx-types";
import type { AgentProvider } from "./AgentProvider";
import type { LoggerProvider } from "./LoggerProvider";
import { LogFormatter } from "./LoggerProvider";

export class Agent implements IAgent {
  readonly id: string;
  readonly sessionId: string;

  private _messages: Message[] = [];
  private eventHandlers: Map<EventType, Set<(payload: any) => void>> = new Map();
  private provider: AgentProvider;
  private logger?: LoggerProvider;

  constructor(config: AgentConfig, provider: AgentProvider, logger?: LoggerProvider) {
    // Validate config
    provider.validateConfig(config);

    this.provider = provider;
    this.logger = logger;
    this.id = this.generateId();
    this.sessionId = provider.sessionId;

    // Log agent creation
    this.logger?.info(
      LogFormatter.agentLifecycle("created", this.id),
      {
        agentId: this.id,
        sessionId: this.sessionId,
        providerSessionId: provider.providerSessionId,
      }
    );
  }

  get messages(): ReadonlyArray<Message> {
    return this._messages;
  }

  async send(message: string): Promise<void> {
    // Log user message
    this.logger?.debug(
      LogFormatter.messageFlow("user", message),
      {
        agentId: this.id,
        sessionId: this.sessionId,
        messageLength: message.length,
      }
    );

    // Add user message to history
    const userMessage: Message = {
      id: this.generateId(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    this._messages.push(userMessage);

    // Emit user message event
    this.emitEvent({
      type: "user",
      uuid: this.generateId(),
      sessionId: this.sessionId,
      message: {
        id: this.generateId(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });

    try {
      this.logger?.debug(
        "Starting provider message stream",
        {
          agentId: this.id,
          sessionId: this.sessionId,
          historyLength: this._messages.length,
        }
      );

      // Provider yields AgentEvent directly (already transformed)
      let eventCount = 0;
      for await (const agentEvent of this.provider.send(message, this._messages)) {
        eventCount++;
        const eventSubtype = "subtype" in agentEvent ? agentEvent.subtype : undefined;

        this.logger?.debug(
          `Received event from provider: ${agentEvent.type}${eventSubtype ? `/${eventSubtype}` : ""}`,
          {
            agentId: this.id,
            sessionId: this.sessionId,
            eventType: agentEvent.type,
            eventSubtype,
            eventNumber: eventCount,
          }
        );

        this.emitEvent(agentEvent);

        // Update messages on assistant response
        if (agentEvent.type === "assistant") {
          this._messages.push({
            id: agentEvent.message.id,
            role: "assistant",
            content: agentEvent.message.content,
            timestamp: agentEvent.message.timestamp,
          });

          this.logger?.debug(
            LogFormatter.messageFlow("assistant",
              typeof agentEvent.message.content === "string"
                ? agentEvent.message.content
                : JSON.stringify(agentEvent.message.content)
            ),
            {
              agentId: this.id,
              sessionId: this.sessionId,
              messageId: agentEvent.message.id,
            }
          );
        }
      }

      this.logger?.debug(
        "Provider message stream completed",
        {
          agentId: this.id,
          sessionId: this.sessionId,
          totalEvents: eventCount,
          finalHistoryLength: this._messages.length,
        }
      );
    } catch (error) {
      // Handle errors
      if (error instanceof Error) {
        this.logger?.error(
          LogFormatter.error("Failed to process message", error),
          {
            agentId: this.id,
            sessionId: this.sessionId,
            errorName: error.name,
            errorMessage: error.message,
            error,
          }
        );

        if (error.name === "AbortError") {
          throw new AgentAbortError(error.message);
        }

        // Emit error result event
        this.emitEvent({
          uuid: this.generateId(),
          type: "result",
          subtype: "error_during_execution",
          sessionId: this.sessionId,
          durationMs: 0,
          durationApiMs: 0,
          numTurns: 0,
          totalCostUsd: 0,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
          },
          error,
          timestamp: Date.now(),
        });
      }
      throw error;
    }
  }

  on<T extends EventType>(event: T, handler: (payload: EventPayload<T>) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    this.logger?.debug(
      `Event handler registered: ${event}`,
      {
        agentId: this.id,
        sessionId: this.sessionId,
        eventType: event,
        totalHandlers: this.eventHandlers.get(event)!.size,
      }
    );

    // Return unregister function
    return () => {
      this.off(event, handler);
    };
  }

  off<T extends EventType>(event: T, handler: (payload: EventPayload<T>) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      this.logger?.debug(
        `Event handler unregistered: ${event}`,
        {
          agentId: this.id,
          sessionId: this.sessionId,
          eventType: event,
          remainingHandlers: handlers.size,
        }
      );
    }
  }

  clear(): void {
    this.logger?.info(
      "Clearing agent messages and aborting current operation",
      {
        agentId: this.id,
        sessionId: this.sessionId,
        clearedMessages: this._messages.length,
      }
    );

    this._messages = [];
    this.provider.abort();
  }

  destroy(): void {
    this.logger?.info(
      LogFormatter.agentLifecycle("destroying", this.id),
      {
        agentId: this.id,
        sessionId: this.sessionId,
        registeredHandlers: this.eventHandlers.size,
        messageHistory: this._messages.length,
      }
    );

    this.clear();
    this.eventHandlers.clear();
    this.provider.destroy();

    this.logger?.info(
      LogFormatter.agentLifecycle("destroyed", this.id),
      {
        agentId: this.id,
        sessionId: this.sessionId,
      }
    );
  }

  private emitEvent(event: AgentEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    const subtype = "subtype" in event ? event.subtype : undefined;

    this.logger?.debug(
      LogFormatter.eventEmission(
        subtype ? `${event.type}/${subtype}` : event.type,
        this.sessionId
      ),
      {
        agentId: this.id,
        sessionId: this.sessionId,
        eventType: event.type,
        eventSubtype: subtype,
        handlerCount: handlers?.size ?? 0,
      }
    );

    if (handlers) {
      handlers.forEach((handler, index) => {
        try {
          handler(event);
        } catch (error) {
          this.logger?.error(
            `Event handler execution failed for ${event.type}`,
            {
              agentId: this.id,
              sessionId: this.sessionId,
              eventType: event.type,
              eventSubtype: subtype,
              handlerIndex: index,
              error: error instanceof Error ? error : new Error(String(error)),
            }
          );
        }
      });
    }
  }

  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
