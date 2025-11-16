/**
 * Message Delta Event (L1: Stream Layer)
 *
 * Emitted for message-level metadata updates during streaming.
 * Contains information like stop reason and stop sequence.
 */

import type { StreamEvent } from "./StreamEvent";

export interface MessageDeltaEvent extends StreamEvent {
  type: "message_delta";

  /**
   * Event data
   */
  data: {
    /**
     * Message-level delta (metadata updates)
     */
    delta: {
      /**
       * Reason why the message stopped
       */
      stopReason?: string;

      /**
       * Stop sequence that triggered message stop
       */
      stopSequence?: string;
    };
  };
}
