/**
 * Tool Use Event
 *
 * Emitted when AI decides to call a tool.
 * This is a real-time event that fires as soon as the tool call is detected in the stream.
 *
 * Philosophy:
 * - Tools are third-party executors (even though initiated by AI)
 * - Independent event flow for better UI responsiveness
 * - Aligned with Claude SDK's tool_use content block
 */

import type { BaseAgentEvent } from "./BaseAgentEvent";

/**
 * Tool use data structure
 * Matches Claude SDK's tool_use content block format
 */
export interface ToolUseData {
  /** Unique identifier for this tool call */
  id: string;

  /** Tool name */
  name: string;

  /** Tool input parameters (JSON object) */
  input: Record<string, unknown>;
}

export interface ToolUseEvent extends BaseAgentEvent {
  type: "tool_use";

  /** Tool use details */
  toolUse: ToolUseData;
}
