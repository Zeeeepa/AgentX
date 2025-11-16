/**
 * Agent Event
 *
 * Union of all agent event types.
 * Aligned with: SDKMessage from @anthropic-ai/claude-agent-sdk
 */

import type { UserMessageEvent } from "./UserMessageEvent";
import type { AssistantMessageEvent } from "./AssistantMessageEvent";
import type { StreamDeltaEvent } from "./StreamDeltaEvent";
import type { ResultEvent } from "./ResultEvent";
import type { SystemInitEvent } from "./SystemInitEvent";
import type { ErrorEvent } from "./ErrorEvent";
import type { ToolUseEvent } from "./ToolUseEvent";
import type { ToolResultEvent } from "./ToolResultEvent";

/**
 * Request events (Client → Server)
 * Events sent from client to initiate actions
 */
export type RequestEvent = UserMessageEvent | ToolResultEvent;

/**
 * Response events (Server → Client)
 * Events sent from server as responses
 */
export type ResponseEvent =
  | AssistantMessageEvent
  | StreamDeltaEvent
  | ResultEvent
  | SystemInitEvent
  | ErrorEvent
  | ToolUseEvent;

/**
 * Union of all agent events
 */
export type AgentEvent = RequestEvent | ResponseEvent;

/**
 * Event type discriminator
 */
export type EventType = AgentEvent["type"];

/**
 * Request event types (Client → Server only)
 */
export const REQUEST_EVENT_TYPES = [
  "user",
  "tool_result",
] as const satisfies readonly RequestEvent["type"][];

/**
 * Response event types (Server → Client only)
 */
export const RESPONSE_EVENT_TYPES = [
  "assistant",
  "stream_event",
  "result",
  "system",
  "error",
  "tool_use",
] as const satisfies readonly ResponseEvent["type"][];

/**
 * All event types as a runtime constant array
 *
 * Single source of truth for all event types.
 * TypeScript will enforce this matches EventType.
 */
export const ALL_EVENT_TYPES = [
  ...REQUEST_EVENT_TYPES,
  ...RESPONSE_EVENT_TYPES,
] as const satisfies readonly EventType[];

/**
 * Get event payload type by event type
 *
 * @example
 * type AssistantPayload = EventPayload<'assistant'>
 * // → AssistantMessageEvent
 */
export type EventPayload<T extends EventType> = Extract<AgentEvent, { type: T }>;
