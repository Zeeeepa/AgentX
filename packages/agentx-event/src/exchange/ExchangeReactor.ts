/**
 * Exchange Reactor
 *
 * Type-safe contract for handling all Exchange layer events.
 * Implementing this interface ensures you handle every exchange event.
 *
 * Usage:
 * ```typescript
 * class AnalyticsDashboard implements ExchangeReactor {
 *   onExchangeRequest(event: ExchangeRequestEvent) {
 *     this.activeExchanges.set(event.uuid, {
 *       startTime: event.data.requestedAt,
 *       userMessage: event.data.userMessage
 *     });
 *   }
 *
 *   onExchangeResponse(event: ExchangeResponseEvent) {
 *     const exchange = this.activeExchanges.get(event.data.exchangeId);
 *     this.totalCost += event.data.cost || 0;
 *     this.totalTokens += event.data.tokens?.total || 0;
 *     this.avgDuration = calculateAverage(event.data.duration);
 *   }
 * }
 *
 * const analytics = new AnalyticsDashboard();
 * bindExchangeReactor(consumer, analytics);
 * ```
 */

import type { ExchangeRequestEvent } from "./ExchangeRequestEvent";
import type { ExchangeResponseEvent } from "./ExchangeResponseEvent";

/**
 * ExchangeReactor - Complete contract
 *
 * Forces implementation of ALL exchange event handlers.
 * Compile-time guarantee that no exchange event is missed.
 */
export interface ExchangeReactor {
  /**
   * Handle exchange request
   * Emitted when user initiates a request
   */
  onExchangeRequest(event: ExchangeRequestEvent): void | Promise<void>;

  /**
   * Handle exchange response
   * Emitted when agent completes a response
   */
  onExchangeResponse(event: ExchangeResponseEvent): void | Promise<void>;
}

/**
 * PartialExchangeReactor - Partial implementation
 *
 * Allows implementing only the exchange events you care about.
 * Use when you don't need to handle all exchange events.
 */
export type PartialExchangeReactor = Partial<ExchangeReactor>;
