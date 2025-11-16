/**
 * Bind Stream Reactor
 *
 * Automatically binds a StreamReactor implementation to an EventConsumer.
 * Ensures all stream events are properly subscribed.
 */

import type { EventConsumer, Unsubscribe } from "../bus/EventConsumer";
import type { StreamReactor, PartialStreamReactor } from "../stream/StreamReactor";

/**
 * Bind a complete StreamReactor to EventConsumer
 *
 * @param consumer - EventConsumer instance
 * @param reactor - StreamReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * class MyStreamHandler implements StreamReactor {
 *   onMessageStart(event) { console.log("Start:", event.data.message.id); }
 *   onTextDelta(event) { process.stdout.write(event.data.text); }
 *   // ... implement all methods
 * }
 *
 * const handler = new MyStreamHandler();
 * const unbind = bindStreamReactor(consumer, handler);
 *
 * // Later: unbind all subscriptions
 * unbind();
 * ```
 */
export function bindStreamReactor(
  consumer: EventConsumer,
  reactor: StreamReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  // Message lifecycle
  unsubscribers.push(consumer.consumeByType("message_start", reactor.onMessageStart.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("message_delta", reactor.onMessageDelta.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("message_stop", reactor.onMessageStop.bind(reactor)));

  // Text content block
  unsubscribers.push(
    consumer.consumeByType("text_content_block_start", reactor.onTextContentBlockStart.bind(reactor))
  );
  unsubscribers.push(consumer.consumeByType("text_delta", reactor.onTextDelta.bind(reactor)));
  unsubscribers.push(
    consumer.consumeByType("text_content_block_stop", reactor.onTextContentBlockStop.bind(reactor))
  );

  // Tool use content block
  unsubscribers.push(
    consumer.consumeByType("tool_use_content_block_start", reactor.onToolUseContentBlockStart.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("input_json_delta", reactor.onInputJsonDelta.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("tool_use_content_block_stop", reactor.onToolUseContentBlockStop.bind(reactor))
  );

  // Return combined unsubscribe function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Bind a partial StreamReactor to EventConsumer
 *
 * Only subscribes to methods that are implemented.
 * Useful when you only care about specific stream events.
 *
 * @param consumer - EventConsumer instance
 * @param reactor - Partial StreamReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * const partialHandler: PartialStreamReactor = {
 *   onTextDelta(event) {
 *     process.stdout.write(event.data.text);
 *   },
 *   onMessageStop(event) {
 *     console.log("\nDone!");
 *   }
 * };
 *
 * const unbind = bindPartialStreamReactor(consumer, partialHandler);
 * ```
 */
export function bindPartialStreamReactor(
  consumer: EventConsumer,
  reactor: PartialStreamReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  // Only bind implemented methods
  if (reactor.onMessageStart) {
    unsubscribers.push(consumer.consumeByType("message_start", reactor.onMessageStart.bind(reactor)));
  }
  if (reactor.onMessageDelta) {
    unsubscribers.push(consumer.consumeByType("message_delta", reactor.onMessageDelta.bind(reactor)));
  }
  if (reactor.onMessageStop) {
    unsubscribers.push(consumer.consumeByType("message_stop", reactor.onMessageStop.bind(reactor)));
  }
  if (reactor.onTextContentBlockStart) {
    unsubscribers.push(
      consumer.consumeByType("text_content_block_start", reactor.onTextContentBlockStart.bind(reactor))
    );
  }
  if (reactor.onTextDelta) {
    unsubscribers.push(consumer.consumeByType("text_delta", reactor.onTextDelta.bind(reactor)));
  }
  if (reactor.onTextContentBlockStop) {
    unsubscribers.push(
      consumer.consumeByType("text_content_block_stop", reactor.onTextContentBlockStop.bind(reactor))
    );
  }
  if (reactor.onToolUseContentBlockStart) {
    unsubscribers.push(
      consumer.consumeByType("tool_use_content_block_start", reactor.onToolUseContentBlockStart.bind(reactor))
    );
  }
  if (reactor.onInputJsonDelta) {
    unsubscribers.push(consumer.consumeByType("input_json_delta", reactor.onInputJsonDelta.bind(reactor)));
  }
  if (reactor.onToolUseContentBlockStop) {
    unsubscribers.push(
      consumer.consumeByType("tool_use_content_block_stop", reactor.onToolUseContentBlockStop.bind(reactor))
    );
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
