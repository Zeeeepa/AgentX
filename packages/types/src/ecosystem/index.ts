/**
 * Ecosystem Module - Runtime environment for AI Agents
 *
 * Three-layer Ecosystem architecture:
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Network Ecosystem                        │
 * │   (Server/Client, Channel - see network/)                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Runtime Ecosystem                        │
 * │   (Container, Session, Repository)                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Agent Ecosystem                          │
 * │   (Agent, Message, Events)                                  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Pure Abstractions (from systems theory)
 * - Ecosystem: Event bus interface
 * - Receptor: Senses external signals (input boundary)
 * - Effector: Transmits events (output boundary)
 *
 * ## Runtime Layer
 * - Runtime: Infrastructure interface
 * - Container: Agent isolation boundary
 * - Session: User conversation context
 * - Repository: Storage abstraction
 *
 * ## Agent Layer
 * - Agent: AI agent interface
 * - Message: Conversation messages
 * - Events: Stream, State, Message, Turn events
 *
 * @packageDocumentation
 */

// ============================================================================
// Pure Abstractions (Systems Theory)
// ============================================================================

export type { Ecosystem, EcosystemEventHandler } from "./Ecosystem";
export type { EcosystemEvent } from "./EcosystemEvent";
export type { Receptor } from "./Receptor";
export type { Effector } from "./Effector";

// ============================================================================
// Runtime Layer
// ============================================================================

// Runtime interface
export type { Runtime, AgentIdResolver } from "./Runtime";

// RuntimeDriver - Driver + Sandbox combination
export type { RuntimeDriver } from "./container/driver/RuntimeDriver";

// Container and Sandbox
export * from "./container";
export * from "./container/sandbox";

// Session
export * from "./session";

// Repository
export * from "./repository";

// Receptors
export * from "./receptors";

// Runtime Events
export * from "./event";

// ============================================================================
// Agent Layer
// ============================================================================

export * from "./agent";
export * from "./agent/message";
export * from "./agent/event";
