import type { Receptor } from "~/ecosystem/Receptor";
import type {
  ToolPlannedEnvEvent,
  ToolExecutingEnvEvent,
  ToolCompletedEnvEvent,
  ToolFailedEnvEvent,
} from "../event";

/**
 * Tool state events union type.
 */
export type ToolStateEvent =
  | ToolPlannedEnvEvent
  | ToolExecutingEnvEvent
  | ToolCompletedEnvEvent
  | ToolFailedEnvEvent;

/**
 * ToolReceptor - Senses tool execution state events.
 *
 * Responsible for detecting:
 * - tool_planned: Tool execution planned
 * - tool_executing: Tool is being executed
 * - tool_completed: Tool execution completed successfully
 * - tool_failed: Tool execution failed
 */
export interface ToolReceptor extends Receptor<ToolStateEvent> {}
