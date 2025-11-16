/**
 * Exchange Response Event (L4: Exchange Layer)
 *
 * Emitted when assistant completes response for an exchange.
 * Marks the end of a request-response cycle.
 *
 * Contains the assistant's response and exchange statistics.
 */

import type { ExchangeEvent } from "./ExchangeEvent";
import type { AssistantMessage } from "@deepractice-ai/agentx-types";

export interface ExchangeResponseEvent extends ExchangeEvent {
  type: "exchange_response";

  /**
   * Event data
   */
  data: {
    /**
     * Assistant's response message
     */
    assistantMessage: AssistantMessage;

    /**
     * Response timestamp
     */
    respondedAt: number;

    /**
     * Exchange duration (milliseconds)
     */
    durationMs: number;

    /**
     * Token usage for this exchange
     */
    usage?: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
    };

    /**
     * Cost for this exchange (USD)
     */
    costUsd?: number;
  };
}
