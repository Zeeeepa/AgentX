/**
 * Exchange Event (L4: Exchange Layer - Base)
 *
 * Base class for request-response exchange events.
 * An exchange represents a complete request-response cycle.
 *
 * Exchange = Request + Processing + Response
 *
 * Technical layer perspective:
 * - L1: Stream (incremental data)
 * - L2: State (state transitions)
 * - L3: Message (complete messages)
 * - L4: Exchange (request-response pairs)
 */

import type { AgentEvent } from "../base/AgentEvent";

/**
 * ExchangeEvent
 *
 * Base for all exchange events in L4 layer.
 */
export interface ExchangeEvent extends AgentEvent {
  /**
   * Unique exchange identifier
   * Links request and response events
   */
  exchangeId: string;

  /**
   * Exchange sequence number (for ordering)
   */
  exchangeNumber?: number;
}
