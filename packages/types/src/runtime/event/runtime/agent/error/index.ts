/**
 * Agent Error Events
 *
 * Error events for agent operations.
 * Separate from state events for special handling (SSE transport, UI display).
 *
 * TODO: Integrate with unified error system when designed
 */

import type { RuntimeEvent } from "../../RuntimeEvent";

/**
 * Error severity level
 */
export type ErrorSeverity = "fatal" | "error" | "warning";

/**
 * Error code for agent errors
 */
export type AgentErrorCode = string;

/**
 * Base ErrorEvent
 */
export interface AgentErrorEvent<T extends string = string, D = unknown>
  extends RuntimeEvent<T, D> {
  source: "agent";
  category: "error";
  intent: "notification";
}

// ============================================================================
// Error Events
// ============================================================================

/**
 * AgentError - Agent-level error
 */
export interface AgentErrorOccurredEvent extends AgentErrorEvent<"agent_error"> {
  data: {
    code: AgentErrorCode;
    message: string;
    severity: ErrorSeverity;
    recoverable: boolean;
    details?: Record<string, unknown>;
    stack?: string;
  };
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * AllAgentErrorEvents - All agent error events
 */
export type AllAgentErrorEvent = AgentErrorOccurredEvent;

/**
 * Type guard: is this an error event?
 */
export function isErrorEvent(event: RuntimeEvent): event is AllAgentErrorEvent {
  return event.source === "agent" && event.category === "error";
}
