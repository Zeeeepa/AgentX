/**
 * Bind Message Reactor
 *
 * Automatically binds a MessageReactor implementation to an EventConsumer.
 * Ensures all message events are properly subscribed.
 */

import type { EventConsumer, Unsubscribe } from "../bus/EventConsumer";
import type { MessageReactor, PartialMessageReactor } from "../message/MessageReactor";

/**
 * Bind a complete MessageReactor to EventConsumer
 *
 * @param consumer - EventConsumer instance
 * @param reactor - MessageReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * class ChatHistory implements MessageReactor {
 *   onUserMessage(event) { this.messages.push(event.data); }
 *   onAssistantMessage(event) { this.messages.push(event.data); }
 *   onToolUseMessage(event) { this.messages.push(event.data); }
 *   onErrorMessage(event) { this.errors.push(event.data); }
 * }
 *
 * const history = new ChatHistory();
 * const unbind = bindMessageReactor(consumer, history);
 * ```
 */
export function bindMessageReactor(
  consumer: EventConsumer,
  reactor: MessageReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(consumer.consumeByType("user_message", reactor.onUserMessage.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("assistant_message", reactor.onAssistantMessage.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("tool_use_message", reactor.onToolUseMessage.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("error_message", reactor.onErrorMessage.bind(reactor)));

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Bind a partial MessageReactor to EventConsumer
 *
 * Only subscribes to methods that are implemented.
 *
 * @param consumer - EventConsumer instance
 * @param reactor - Partial MessageReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * const partialHandler: PartialMessageReactor = {
 *   onUserMessage(event) {
 *     console.log("User:", event.data.content);
 *   },
 *   onAssistantMessage(event) {
 *     console.log("Assistant:", event.data.content);
 *   }
 * };
 *
 * const unbind = bindPartialMessageReactor(consumer, partialHandler);
 * ```
 */
export function bindPartialMessageReactor(
  consumer: EventConsumer,
  reactor: PartialMessageReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  if (reactor.onUserMessage) {
    unsubscribers.push(consumer.consumeByType("user_message", reactor.onUserMessage.bind(reactor)));
  }
  if (reactor.onAssistantMessage) {
    unsubscribers.push(consumer.consumeByType("assistant_message", reactor.onAssistantMessage.bind(reactor)));
  }
  if (reactor.onToolUseMessage) {
    unsubscribers.push(consumer.consumeByType("tool_use_message", reactor.onToolUseMessage.bind(reactor)));
  }
  if (reactor.onErrorMessage) {
    unsubscribers.push(consumer.consumeByType("error_message", reactor.onErrorMessage.bind(reactor)));
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
