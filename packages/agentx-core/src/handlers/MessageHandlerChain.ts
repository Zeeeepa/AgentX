/**
 * MessageHandlerChain
 *
 * Responsibility Chain implementation for MessageHandlers.
 * Processes external messages through a sequence of handlers.
 *
 * Features:
 * - Multiple handlers can process the same message
 * - Handlers are executed in registration order
 * - Collects all events produced by handlers
 * - Type-safe with generic input type
 *
 * @example
 * ```typescript
 * const chain = new MessageHandlerChain<SDKMessage>()
 *   .addHandler(new UserSDKHandler(sessionId))
 *   .addHandler(new AssistantSDKHandler(sessionId))
 *   .addHandler(new ToolUseSDKHandler(sessionId));
 *
 * for await (const sdkMessage of stream) {
 *   const events = chain.process(sdkMessage);
 *   events.forEach(event => eventBus.emit(event));
 * }
 * ```
 */

import type { AgentEvent } from "@deepractice-ai/agentx-api";
import type { MessageHandler } from "./MessageHandler";

/**
 * MessageHandlerChain class
 *
 * Manages a chain of MessageHandlers and processes messages through them.
 *
 * @template TInput - External message type
 */
export class MessageHandlerChain<TInput> {
  private handlers: MessageHandler<TInput, any>[] = [];

  /**
   * Add a handler to the chain
   *
   * @param handler - MessageHandler to add
   * @returns this (for method chaining)
   */
  addHandler(handler: MessageHandler<TInput, any>): this {
    this.handlers.push(handler);
    return this;
  }

  /**
   * Process a message through all handlers
   *
   * @param message - External message to process
   * @returns Array of AgentEvents produced by handlers
   *
   * @remarks
   * - All handlers get a chance to process the message
   * - Handlers can return null, single event, or multiple events
   * - Results are collected and flattened
   */
  process(message: TInput): AgentEvent[] {
    const events: AgentEvent[] = [];

    for (const handler of this.handlers) {
      if (handler.canHandle(message)) {
        const result = handler.handle(message);
        if (result) {
          events.push(...(Array.isArray(result) ? result : [result]));
        }
      }
    }

    return events;
  }

  /**
   * Get number of registered handlers
   */
  get size(): number {
    return this.handlers.length;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers = [];
  }
}
