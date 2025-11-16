/**
 * Event Producer Interface
 *
 * Produces events to the EventBus.
 * Any component (Agent, Provider, UI) can be a producer.
 */

import type { AgentEvent } from "../base/AgentEvent";

export interface EventProducer {
  /**
   * Produce an event to the bus
   *
   * @param event - The event to produce
   * @throws Error if the bus is closed
   */
  produce(event: AgentEvent): void;

  /**
   * Check if the producer is still active
   */
  isActive(): boolean;
}
