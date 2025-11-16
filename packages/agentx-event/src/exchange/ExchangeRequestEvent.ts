/**
 * Exchange Request Event (L4: Exchange Layer)
 *
 * Emitted when a user request initiates a new exchange.
 * Marks the start of a request-response cycle.
 *
 * Contains the user's request and metadata about the exchange.
 */

import type { ExchangeEvent } from "./ExchangeEvent";
import type { UserMessage } from "@deepractice-ai/agentx-types";

export interface ExchangeRequestEvent extends ExchangeEvent {
  type: "exchange_request";

  /**
   * Event data
   */
  data: {
    /**
     * User's request message
     */
    userMessage: UserMessage;

    /**
     * Request timestamp
     */
    requestedAt: number;
  };
}
