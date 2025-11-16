/**
 * Tool Result Event
 *
 * Emitted when a tool execution completes and returns a result.
 * This event carries the tool's output back to the AI.
 *
 * Philosophy:
 * - Tools are third-party executors
 * - Tool results are system events, not user messages
 * - Aligned with Claude SDK's tool_result content block
 */

import type { BaseAgentEvent } from "./BaseAgentEvent";

/**
 * Tool result data structure
 * Matches Claude SDK's tool_result content block format
 */
export interface ToolResultData {
  /** Tool call ID this result corresponds to */
  tool_use_id: string;

  /** Tool execution result content */
  content: string | Array<{ type: "text"; text: string } | { type: "image"; source: unknown }>;

  /** Whether the tool execution succeeded */
  is_error?: boolean;
}

export interface ToolResultEvent extends BaseAgentEvent {
  type: "tool_result";

  /** Tool result details */
  toolResult: ToolResultData;
}
