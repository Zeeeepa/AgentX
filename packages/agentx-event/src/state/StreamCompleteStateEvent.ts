/**
 * Stream Complete State Event (L2: State Layer)
 *
 * State transition: Streaming → StreamComplete
 *
 * Emitted when a stream (text or tool input) completes.
 * Represents the end of incremental data flow.
 *
 * Marks the completion of L1 delta events for this stream.
 */

import type { StateEvent } from "./StateEvent";

export interface StreamCompleteStateEvent extends StateEvent {
  type: "stream_complete";

  /**
   * Event data (empty - state transition only)
   */
  data: Record<string, never>;
}
