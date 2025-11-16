/**
 * EventHandlerChain
 *
 * Responsibility Chain implementation for EventHandlers.
 * Processes AgentEvents through a sequence of handlers to produce application models.
 *
 * Features:
 * - Multiple handlers can process the same event
 * - Handlers are executed in registration order
 * - Collects all models produced by handlers
 * - Type-safe with generic output type
 *
 * @example
 * ```typescript
 * const chain = new EventHandlerChain<Message>()
 *   .addHandler(new UserEventHandler())
 *   .addHandler(new AssistantEventHandler())
 *   .addHandler(new ToolUseEventHandler());
 *
 * agent.on('*', (event) => {
 *   const messages = chain.process(event);
 *   setMessages(prev => [...prev, ...messages]);
 * });
 * ```
 */

import type { AgentEvent } from "../events";
import type { EventHandler } from "./EventHandler";

/**
 * EventHandlerChain class
 *
 * Manages a chain of EventHandlers and processes events through them.
 *
 * @template TOutput - Application model type (Message, DBRecord, etc.)
 */
export class EventHandlerChain<TOutput> {
  private handlers: EventHandler<any, TOutput>[] = [];

  /**
   * Add a handler to the chain
   *
   * @param handler - EventHandler to add
   * @returns this (for method chaining)
   */
  addHandler(handler: EventHandler<any, TOutput>): this {
    this.handlers.push(handler);
    return this;
  }

  /**
   * Process an event through all handlers
   *
   * @param event - AgentEvent to process
   * @returns Array of application models produced by handlers
   *
   * @remarks
   * - All handlers get a chance to process the event
   * - Handlers can return null, single model, or multiple models
   * - Results are collected and flattened
   */
  process(event: AgentEvent): TOutput[] {
    const results: TOutput[] = [];

    for (const handler of this.handlers) {
      if (handler.canHandle(event)) {
        const output = handler.handle(event);
        if (output) {
          results.push(...(Array.isArray(output) ? output : [output]));
        }
      }
    }

    return results;
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
