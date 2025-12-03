// Base runtime event type
export type { RuntimeEvent, RuntimeEventType } from "./RuntimeEvent";

// Transport events
export type {
  HeartbeatEvent,
  HeartbeatEventData,
  ConnectionEstablishedEvent,
  ConnectionEstablishedEventData,
} from "./transport";

// Session events
export type {
  SessionCreatedEvent,
  SessionCreatedEventData,
  SessionResumedEvent,
  SessionResumedEventData,
} from "./session";

// Agent lifecycle events
export type {
  AgentStartedEvent,
  AgentStartedEventData,
  AgentReadyEvent,
  AgentReadyEventData,
  AgentDestroyedEvent,
  AgentDestroyedEventData,
} from "./agent";

// Conversation events
export type {
  ConversationQueuedEvent,
  ConversationQueuedEventData,
  ConversationStartEvent,
  ConversationStartEventData,
  ConversationThinkingEvent,
  ConversationThinkingEventData,
  ConversationRespondingEvent,
  ConversationRespondingEventData,
  ConversationEndEvent,
  ConversationEndEventData,
  ConversationInterruptedEvent,
  ConversationInterruptedEventData,
} from "./conversation";

// Stream events
export type {
  MessageStartEnvEvent,
  MessageStartEnvEventData,
  MessageStopEnvEvent,
  MessageStopEnvEventData,
  TextDeltaEnvEvent,
  TextDeltaEnvEventData,
  ToolCallEnvEvent,
  ToolCallEnvEventData,
  ToolResultEnvEvent,
  ToolResultEnvEventData,
  InterruptedEnvEvent,
  InterruptedEnvEventData,
} from "./stream";

// Tool events
export type {
  ToolPlannedEnvEvent,
  ToolPlannedEnvEventData,
  ToolExecutingEnvEvent,
  ToolExecutingEnvEventData,
  ToolCompletedEnvEvent,
  ToolCompletedEnvEventData,
  ToolFailedEnvEvent,
  ToolFailedEnvEventData,
} from "./tool";

// Error events
export type { ErrorEnvEvent, ErrorEnvEventData } from "./error";

// Union type of all Runtime Events
import type { HeartbeatEvent, ConnectionEstablishedEvent } from "./transport";
import type { SessionCreatedEvent, SessionResumedEvent } from "./session";
import type { AgentStartedEvent, AgentReadyEvent, AgentDestroyedEvent } from "./agent";
import type {
  ConversationQueuedEvent,
  ConversationStartEvent,
  ConversationThinkingEvent,
  ConversationRespondingEvent,
  ConversationEndEvent,
  ConversationInterruptedEvent,
} from "./conversation";
import type {
  MessageStartEnvEvent,
  MessageStopEnvEvent,
  TextDeltaEnvEvent,
  ToolCallEnvEvent,
  ToolResultEnvEvent,
  InterruptedEnvEvent,
} from "./stream";
import type {
  ToolPlannedEnvEvent,
  ToolExecutingEnvEvent,
  ToolCompletedEnvEvent,
  ToolFailedEnvEvent,
} from "./tool";
import type { ErrorEnvEvent } from "./error";

/**
 * Union type of all possible Runtime Events.
 */
export type AnyRuntimeEvent =
  // Transport
  | HeartbeatEvent
  | ConnectionEstablishedEvent
  // Session
  | SessionCreatedEvent
  | SessionResumedEvent
  // Agent lifecycle
  | AgentStartedEvent
  | AgentReadyEvent
  | AgentDestroyedEvent
  // Conversation
  | ConversationQueuedEvent
  | ConversationStartEvent
  | ConversationThinkingEvent
  | ConversationRespondingEvent
  | ConversationEndEvent
  | ConversationInterruptedEvent
  // Stream
  | MessageStartEnvEvent
  | MessageStopEnvEvent
  | TextDeltaEnvEvent
  | ToolCallEnvEvent
  | ToolResultEnvEvent
  | InterruptedEnvEvent
  // Tool
  | ToolPlannedEnvEvent
  | ToolExecutingEnvEvent
  | ToolCompletedEnvEvent
  | ToolFailedEnvEvent
  // Error
  | ErrorEnvEvent;

// Backward compatibility alias
export type AnyEcosystemEvent = AnyRuntimeEvent;
