import type { Receptor } from "~/ecosystem/Receptor";
import type {
  MessageStartEnvEvent,
  MessageStopEnvEvent,
  TextDeltaEnvEvent,
  ToolCallEnvEvent,
  ToolResultEnvEvent,
  InterruptedEnvEvent,
} from "../event";

/**
 * Runtime stream events union type.
 */
export type RuntimeStreamEvent =
  | MessageStartEnvEvent
  | MessageStopEnvEvent
  | TextDeltaEnvEvent
  | ToolCallEnvEvent
  | ToolResultEnvEvent
  | InterruptedEnvEvent;

/**
 * StreamReceptor - Senses stream events from agent output.
 *
 * Responsible for detecting:
 * - message_start: New message stream started
 * - message_stop: Message stream ended
 * - text_delta: Incremental text output
 * - tool_call: Tool invocation requested
 * - tool_result: Tool execution result
 * - interrupted: Stream was interrupted
 */
export interface StreamReceptor extends Receptor<RuntimeStreamEvent> {}
