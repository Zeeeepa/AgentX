/**
 * Bind Exchange Reactor
 *
 * Automatically binds an ExchangeReactor implementation to an EventConsumer.
 * Ensures all exchange events are properly subscribed.
 */

import type { EventConsumer, Unsubscribe } from "../bus/EventConsumer";
import type { ExchangeReactor, PartialExchangeReactor } from "../exchange/ExchangeReactor";

/**
 * Bind a complete ExchangeReactor to EventConsumer
 *
 * @param consumer - EventConsumer instance
 * @param reactor - ExchangeReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * class Analytics implements ExchangeReactor {
 *   onExchangeRequest(event) {
 *     this.trackRequest(event.data.userMessage);
 *   }
 *   onExchangeResponse(event) {
 *     this.trackCost(event.data.cost);
 *     this.trackDuration(event.data.duration);
 *   }
 * }
 *
 * const analytics = new Analytics();
 * const unbind = bindExchangeReactor(consumer, analytics);
 * ```
 */
export function bindExchangeReactor(
  consumer: EventConsumer,
  reactor: ExchangeReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    consumer.consumeByType("exchange_request", reactor.onExchangeRequest.bind(reactor))
  );
  unsubscribers.push(
    consumer.consumeByType("exchange_response", reactor.onExchangeResponse.bind(reactor))
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Bind a partial ExchangeReactor to EventConsumer
 *
 * Only subscribes to methods that are implemented.
 *
 * @param consumer - EventConsumer instance
 * @param reactor - Partial ExchangeReactor implementation
 * @returns Unsubscribe function that removes all bindings
 *
 * @example
 * ```typescript
 * const partialHandler: PartialExchangeReactor = {
 *   onExchangeResponse(event) {
 *     console.log(`Exchange completed in ${event.data.duration}ms`);
 *     console.log(`Cost: $${event.data.cost}`);
 *   }
 * };
 *
 * const unbind = bindPartialExchangeReactor(consumer, partialHandler);
 * ```
 */
export function bindPartialExchangeReactor(
  consumer: EventConsumer,
  reactor: PartialExchangeReactor
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  if (reactor.onExchangeRequest) {
    unsubscribers.push(
      consumer.consumeByType("exchange_request", reactor.onExchangeRequest.bind(reactor))
    );
  }
  if (reactor.onExchangeResponse) {
    unsubscribers.push(
      consumer.consumeByType("exchange_response", reactor.onExchangeResponse.bind(reactor))
    );
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
