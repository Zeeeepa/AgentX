/**
 * @deepractice-ai/agentx-event
 *
 * Complete event system for AgentX.
 * Organized by layers: Stream → State → Message → Exchange
 */

// ===== Base Layer =====
export type { AgentEvent, AgentEventType } from "./base";

// ===== Bus Layer =====
export type { EventBus, EventProducer, EventConsumer, Unsubscribe } from "./bus";

// ===== Stream Layer =====
export type {
  StreamEventType,
  MessageStartEvent,
  MessageDeltaEvent,
  MessageStopEvent,
  ContentBlockStartEvent,
  ContentBlockDeltaEvent,
  ContentBlockStopEvent,
  TextContentBlockStartEvent,
  TextContentBlockDeltaEvent,
  TextContentBlockStopEvent,
  ThinkingContentBlockStartEvent,
  ThinkingContentBlockDeltaEvent,
  ThinkingContentBlockStopEvent,
  ToolUseContentBlockStartEvent,
  ToolUseContentBlockStopEvent,
} from "./stream";

// ===== State Layer =====
export type {
  StateEventType,
  AgentInitializingStateEvent,
  AgentReadyStateEvent,
  AgentDestroyedStateEvent,
  ConversationStartStateEvent,
  ConversationEndStateEvent,
  ToolPlannedStateEvent,
  ToolCompletedStateEvent,
  ErrorOccurredStateEvent,
} from "./state";

// ===== Message Layer =====
export type {
  MessageEventType,
  UserMessageEvent,
  AssistantMessageEvent,
  ToolUseMessageEvent,
  ErrorMessageEvent,
} from "./message";

// ===== Exchange Layer =====
export type {
  ExchangeEventType,
  ExchangeRequestEvent,
  ExchangeResponseEvent,
} from "./exchange";

// ===== Reactors =====
export type {
  StreamReactor,
  PartialStreamReactor,
  StateReactor,
  PartialStateReactor,
  MessageReactor,
  PartialMessageReactor,
  ExchangeReactor,
  PartialExchangeReactor,
} from "./reactors";
export {
  bindStreamReactor,
  bindPartialStreamReactor,
  bindStateReactor,
  bindPartialStateReactor,
  bindMessageReactor,
  bindPartialMessageReactor,
  bindExchangeReactor,
  bindPartialExchangeReactor,
} from "./reactors";
