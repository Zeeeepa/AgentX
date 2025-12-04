/**
 * @agentxjs/types - Type definitions for AgentX AI Agent platform
 *
 * ## Six-Layer Architecture
 *
 * | Layer       | Serves         | Content                          |
 * |-------------|----------------|----------------------------------|
 * | common      | Platform devs  | Logger, Utils (internal tools)   |
 * | agentx      | API consumers  | Unified API entry point          |
 * | application | App developers | Static resources (Definition, Image) |
 * | persistence | Storage        | Repository interfaces, Records   |
 * | network     | Communication  | Server, Client, Channel          |
 * | runtime     | Agents         | Container, Session, Agent, Events |
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Common Layer                             │
 * │   Internal tools for platform developers                    │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    AgentX Layer                             │
 * │   Unified API - AgentX, APIs                                │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Application Layer                        │
 * │   Static resources - Definition, Image, User                │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Persistence Layer                        │
 * │   Storage abstraction - Repository, Records                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Network Layer                            │
 * │   Communication infrastructure                              │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Runtime Layer                            │
 * │   Dynamic instances - Container, Session, Agent             │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// Common Layer (Internal Platform Tools)
// ============================================================================

export * from "./common";

// ============================================================================
// AgentX Layer (Unified API)
// ============================================================================

export * from "./agentx";

// ============================================================================
// Application Layer (Static Resources)
// ============================================================================

export * from "./application";

// ============================================================================
// Persistence Layer (Storage Abstraction)
// ============================================================================

export * from "./persistence";

// ============================================================================
// Network Layer (Communication)
// ============================================================================

export * from "./network";

// ============================================================================
// Runtime Layer (Dynamic Instances)
// ============================================================================

export * from "./runtime";
