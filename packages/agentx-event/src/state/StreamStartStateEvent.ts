/**
 * Stream Start State Event (L2: State Layer)
 *
 * State transition: NotStreaming → Streaming
 *
 * Emitted when a stream (text or tool input) begins.
 * Represents the start of incremental data flow.
 *
 * After this event, expect L1 delta events (TextDelta, InputJsonDelta, etc.).
 */

import type { StateEvent } from "./StateEvent";

export interface StreamStartStateEvent extends StateEvent {
  type: "stream_start";

  /**
   * Event data (empty - state transition only)
   */
  data: Record<string, never>;
}
