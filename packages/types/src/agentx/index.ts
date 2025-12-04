/**
 * AgentX - Unified API Layer
 *
 * Central entry point for all agent operations.
 *
 * ## API Structure
 *
 * ```text
 * agentx
 * ├── .definitions.*   Definition registry (Application API)
 * ├── .images.*        Image management (Application API)
 * └── .runtime.*       Runtime operations + events (Runtime API)
 *     ├── .on()              Global event subscription
 *     ├── .createContainer() Container lifecycle
 *     ├── .createSession()   Session lifecycle
 *     └── .getAgent()        Agent query
 * ```
 *
 * @packageDocumentation
 */

// Main platform interface
export type { AgentX } from "./AgentX";

// Factory functions
export { createAgentX, createMirror } from "./createAgentX";
export type { MirrorOptions } from "./createAgentX";

// defineAgent
export type { DefineAgentInput } from "./defineAgent";
export { defineAgent } from "./defineAgent";

// Application API (static resources)
export * from "./application";

// Runtime API (dynamic instances + events)
export * from "./runtime";
