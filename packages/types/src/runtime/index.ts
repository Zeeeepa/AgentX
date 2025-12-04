/**
 * Runtime Module - Execution environment for AI Agents
 *
 * ## Event Architecture (Simplified)
 *
 * Two types of events:
 * 1. **EnvironmentEvent** - External raw materials (text_chunk, stream_start, etc.)
 * 2. **AgentEvent** - Agent internal events (assembled by Mealy Machine)
 *
 * EnvironmentEvent + context flows on SystemBus directly.
 *
 * @see issues/029-simplified-event-architecture.md
 * @packageDocumentation
 */

// ============================================================================
// Pure Abstractions (Systems Theory)
// ============================================================================

export type { Runtime, RuntimeEventHandler } from "./Runtime";
export type { Environment } from "./Environment";
export type { Effector } from "./Effector";
export type {
  SystemBus,
  BusEvent,
  BusEventHandler,
  SubscribeOptions,
  Unsubscribe,
} from "./SystemBus";

// Receptor (external world perception)
export type { Receptor } from "./Receptor";

// ============================================================================
// Environment Events
// ============================================================================

export * from "./event";

// ============================================================================
// Container Layer
// ============================================================================

// Container, Sandbox, and LLM
export * from "./container";
export * from "./container/sandbox";
export * from "./container/llm";

// Session
export * from "./session";

// Repository
export * from "./repository";

// ============================================================================
// Agent Layer
// ============================================================================

export * from "./agent";
export * from "./agent/message";
