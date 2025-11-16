/**
 * Bind State Reactor
 *
 * Automatically binds a StateReactor implementation to an EventConsumer.
 * Ensures all state transition events are properly subscribed.
 */

import type { EventConsumer, Unsubscribe } from "../bus/EventConsumer";
import type { StateReactor, PartialStateReactor } from "../state/StateReactor";

/**
 * Bind a complete StateReactor to EventConsumer
 *
 * @param consumer - EventConsumer instance
 * @param reactor - StateReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * class StateMachine implements StateReactor {
 *   onAgentReady(event) { this.state = "ready"; }
 *   onToolPlanned(event) { this.state = "tool_planned"; }
 *   // ... implement all methods
 * }
 *
 * const machine = new StateMachine();
 * const unbind = bindStateReactor(consumer, machine);
 * ```
 */
export function bindStateReactor(
  consumer: EventConsumer,
  reactor: StateReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  // Agent lifecycle
  unsubscribers.push(
    consumer.consumeByType("agent_initializing", reactor.onAgentInitializing.bind(reactor))
  );
  unsubscribers.push(consumer.consumeByType("agent_ready", reactor.onAgentReady.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("agent_destroyed", reactor.onAgentDestroyed.bind(reactor)));

  // Conversation lifecycle
  unsubscribers.push(
    consumer.consumeByType("conversation_start", reactor.onConversationStart.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("conversation_thinking", reactor.onConversationThinking.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("conversation_responding", reactor.onConversationResponding.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("conversation_end", reactor.onConversationEnd.bind(reactor))
  );

  // Tool lifecycle
  unsubscribers.push(consumer.consumeByType("tool_planned", reactor.onToolPlanned.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("tool_executing", reactor.onToolExecuting.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("tool_completed", reactor.onToolCompleted.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("tool_failed", reactor.onToolFailed.bind(reactor)));

  // Stream lifecycle
  unsubscribers.push(consumer.consumeByType("stream_start", reactor.onStreamStart.bind(reactor)));
  unsubscribers.push(consumer.consumeByType("stream_complete", reactor.onStreamComplete.bind(reactor)));

  // Error handling
  unsubscribers.push(consumer.consumeByType("error_occurred", reactor.onErrorOccurred.bind(reactor)));

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Bind a partial StateReactor to EventConsumer
 *
 * Only subscribes to methods that are implemented.
 *
 * @param consumer - EventConsumer instance
 * @param reactor - Partial StateReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * const partialHandler: PartialStateReactor = {
 *   onToolPlanned(event) {
 *     console.log(`Planning to use: ${event.data.toolUse.name}`);
 *   },
 *   onToolCompleted(event) {
 *     console.log(`Completed: ${event.data.toolResult.name}`);
 *   }
 * };
 *
 * const unbind = bindPartialStateReactor(consumer, partialHandler);
 * ```
 */
export function bindPartialStateReactor(
  consumer: EventConsumer,
  reactor: PartialStateReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  // Agent lifecycle
  if (reactor.onAgentInitializing) {
    unsubscribers.push(
      consumer.consumeByType("agent_initializing", reactor.onAgentInitializing.bind(reactor))
    );
  }
  if (reactor.onAgentReady) {
    unsubscribers.push(consumer.consumeByType("agent_ready", reactor.onAgentReady.bind(reactor)));
  }
  if (reactor.onAgentDestroyed) {
    unsubscribers.push(consumer.consumeByType("agent_destroyed", reactor.onAgentDestroyed.bind(reactor)));
  }

  // Conversation lifecycle
  if (reactor.onConversationStart) {
    unsubscribers.push(
      consumer.consumeByType("conversation_start", reactor.onConversationStart.bind(reactor))
    );
  }
  if (reactor.onConversationThinking) {
    unsubscribers.push(
      consumer.consumeByType("conversation_thinking", reactor.onConversationThinking.bind(reactor))
    );
  }
  if (reactor.onConversationResponding) {
    unsubscribers.push(
      consumer.consumeByType("conversation_responding", reactor.onConversationResponding.bind(reactor))
    );
  }
  if (reactor.onConversationEnd) {
    unsubscribers.push(
      consumer.consumeByType("conversation_end", reactor.onConversationEnd.bind(reactor))
    );
  }

  // Tool lifecycle
  if (reactor.onToolPlanned) {
    unsubscribers.push(consumer.consumeByType("tool_planned", reactor.onToolPlanned.bind(reactor)));
  }
  if (reactor.onToolExecuting) {
    unsubscribers.push(consumer.consumeByType("tool_executing", reactor.onToolExecuting.bind(reactor)));
  }
  if (reactor.onToolCompleted) {
    unsubscribers.push(consumer.consumeByType("tool_completed", reactor.onToolCompleted.bind(reactor)));
  }
  if (reactor.onToolFailed) {
    unsubscribers.push(consumer.consumeByType("tool_failed", reactor.onToolFailed.bind(reactor)));
  }

  // Stream lifecycle
  if (reactor.onStreamStart) {
    unsubscribers.push(consumer.consumeByType("stream_start", reactor.onStreamStart.bind(reactor)));
  }
  if (reactor.onStreamComplete) {
    unsubscribers.push(consumer.consumeByType("stream_complete", reactor.onStreamComplete.bind(reactor)));
  }

  // Error handling
  if (reactor.onErrorOccurred) {
    unsubscribers.push(consumer.consumeByType("error_occurred", reactor.onErrorOccurred.bind(reactor)));
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
