/**
 * AgentDriverBridge
 *
 * Internal Reactor that connects AgentDriver to the EventBus.
 *
 * Responsibilities:
 * 1. Subscribe to user_message events from EventBus
 * 2. Call driver.sendMessage() and iterate through Stream events
 * 3. Forward all events to EventBus (no transformation needed)
 *
 * This is an internal implementation detail.
 * Users only interact with AgentDriver interface.
 */

import type { AgentReactor, AgentReactorContext } from "~/interfaces/AgentReactor";
import type { AgentDriver } from "~/interfaces/AgentDriver";
import type { UserMessageEvent, ErrorMessageEvent } from "@deepractice-ai/agentx-event";
import type { ErrorMessage } from "@deepractice-ai/agentx-types";

/**
 * AgentDriverBridge
 *
 * Bridges AgentDriver to EventBus using Reactor pattern.
 */
export class AgentDriverBridge implements AgentReactor {
  readonly id = "driver";
  readonly name = "AgentDriverBridge";

  private context: AgentReactorContext | null = null;
  private abortController: AbortController | null = null;

  constructor(private driver: AgentDriver) {}

  async initialize(context: AgentReactorContext): Promise<void> {
    this.context = context;

    console.log("[AgentDriverBridge] ========== INITIALIZING ==========");
    console.log("[AgentDriverBridge] About to subscribe to user_message events");

    // Subscribe to user_message events
    context.consumer.consumeByType("user_message", this.handleUserMessage.bind(this));

    console.log("[AgentDriverBridge] Successfully subscribed to user_message");
  }

  async destroy(): Promise<void> {
    // Abort any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.driver.abort();

    // Destroy driver
    await this.driver.destroy();

    this.context = null;
  }

  /**
   * Handle user message event
   *
   * Calls driver.sendMessage() and forwards all Stream events to EventBus.
   */
  private async handleUserMessage(event: UserMessageEvent): Promise<void> {
    console.log("[AgentDriverBridge] ========== HANDLING USER MESSAGE ==========");
    console.log("[AgentDriverBridge] Event UUID:", event.uuid);
    console.log("[AgentDriverBridge] Message ID:", event.data.id);
    console.log("[AgentDriverBridge] Message content:", event.data.content);

    if (!this.context) {
      console.error("[AgentDriverBridge] ERROR: No context available");
      return;
    }

    // Save context reference (might become null during async operations)
    const context = this.context;

    // Create new AbortController for this request
    this.abortController = new AbortController();

    try {
      console.log("[AgentDriverBridge] About to call driver.sendMessage()");
      console.log("[AgentDriverBridge] Driver type:", this.driver.constructor.name);

      // Iterate through Stream events from driver
      let eventCount = 0;
      for await (const streamEvent of this.driver.sendMessage(event.data)) {
        eventCount++;

        // Log tool-related events and message_delta with full data
        if (streamEvent.type.includes('tool') || streamEvent.type.includes('json') || streamEvent.type === 'message_delta') {
          console.log(`[AgentDriverBridge] Received stream event #${eventCount}:`, streamEvent.type, streamEvent);
        } else {
          console.log(`[AgentDriverBridge] Received stream event #${eventCount}:`, streamEvent.type);
        }

        // Check if aborted (null-safe check)
        if (this.abortController?.signal.aborted) {
          break;
        }

        // Forward event to EventBus (no transformation needed)
        context.producer.produce(streamEvent);
      }
    } catch (error) {
      console.error("[AgentDriverBridge] Error processing stream:", error);

      // Create and emit ErrorMessageEvent
      const errorMessage: ErrorMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        role: "error",
        subtype: "llm",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
        code: "DRIVER_ERROR",
        recoverable: true,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now(),
      };

      const errorEvent: ErrorMessageEvent = {
        type: "error_message",
        data: errorMessage,
        uuid: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        agentId: context.agentId,
        timestamp: Date.now(),
      };

      context.producer.produce(errorEvent);
    } finally {
      this.abortController = null;
    }
  }
}
