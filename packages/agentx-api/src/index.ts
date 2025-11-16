/**
 * AgentX API
 *
 * Public API for the AgentX ecosystem.
 * Provides configuration types, interfaces, events, and factory functions.
 *
 * @packageDocumentation
 */

// === Config ===
export type {
  ApiConfig,
  LLMConfig,
  McpConfig,
  McpServerConfig,
  McpTransportConfig,
  AgentConfig,
} from "./config";

// === Interfaces ===
export type { Agent } from "./interfaces";

// === Events ===
export type {
  AgentEvent,
  EventType,
  EventPayload,
  RequestEvent,
  ResponseEvent,
  UserMessageEvent,
  AssistantMessageEvent,
  StreamDeltaEvent,
  ResultEvent,
  SystemInitEvent,
  ErrorEvent,
  ErrorSeverity,
  ErrorSubtype,
  ToolUseEvent,
  ToolUseData,
  ToolResultEvent,
  ToolResultData,
} from "./events";

export { ALL_EVENT_TYPES, REQUEST_EVENT_TYPES, RESPONSE_EVENT_TYPES } from "./events";

// === Handlers ===
export type { EventHandler } from "./handlers";
export { EventHandlerChain } from "./handlers";

// === Errors ===
export { AgentConfigError, AgentAbortError } from "./errors";

// === Functions ===
export { createAgent } from "./functions";
