/**
 * AgentOutput - Union of all possible agent output events
 *
 * Includes all event layers:
 * - Stream: DriveableEvent (pass-through from Environment)
 * - State: State machine transitions
 * - Message: Assembled messages
 * - Turn: Turn analytics
 * - Error: Agent error events
 */

import type { DriveableEvent } from "~/runtime/event/environment/DriveableEvent";
import type { AgentStateEvent } from "~/runtime/event/runtime/agent/state";
import type { AgentMessageEvent } from "~/runtime/event/runtime/agent/message";
import type { AgentTurnEvent } from "~/runtime/event/runtime/agent/turn";
import type { AllAgentErrorEvent } from "~/runtime/event/runtime/agent/error";

/**
 * All possible output types from Agent
 */
export type AgentOutput =
  | DriveableEvent
  | AgentStateEvent
  | AgentMessageEvent
  | AgentTurnEvent
  | AllAgentErrorEvent;
