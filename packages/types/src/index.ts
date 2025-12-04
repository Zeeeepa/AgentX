/**
 * @agentxjs/types - Type definitions for AgentX AI Agent platform
 *
 * ## ADR: Three-Layer Architecture (Ontological Foundation)
 *
 * Based on three fundamental ontological categories (issue #026):
 *
 * | Layer       | Ontology  | Protocol    | Content                          |
 * |-------------|-----------|-------------|----------------------------------|
 * | Application | Structure | HTTP        | Definition, Image, User          |
 * | Network     | Relation  | HTTP + WS   | Server, Client, Channel          |
 * | Runtime     | Process   | WS Events   | Container, Session, Agent        |
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Application Layer                        │
 * │   Static structures - "what exists"                         │
 * │   Protocol: HTTP (CRUD operations)                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Network Layer                            │
 * │   Connections and relations - "how things connect"          │
 * │   Protocol: HTTP + WebSocket                                │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Runtime Layer                            │
 * │   Dynamic processes - "what happens"                        │
 * │   Protocol: WebSocket Events                                │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## ADR: Why This Separation?
 *
 * 1. **Protocol Alignment**: Each layer uses the protocol that fits its nature
 *    - Static resources → HTTP (RESTful CRUD)
 *    - Dynamic events → WebSocket (real-time bidirectional)
 *
 * 2. **Responsibility Isolation**: Clear boundaries prevent coupling
 *    - Application: Data models and API contracts
 *    - Network: Communication infrastructure
 *    - Runtime: Execution behavior
 *
 * 3. **Isomorphic Design**: Same types work in Node.js and Browser
 *    - Browser: Uses Network layer to connect to server
 *    - Server: Uses Runtime layer directly
 *
 * ## Module Structure
 *
 * | Layer       | Module           | Protocol   | Purpose                     |
 * |-------------|------------------|------------|-----------------------------|
 * | Application | application/     | HTTP       | Static resources + API      |
 * |             | └ spec/          | -          | Definition, Image           |
 * |             | └ agentx/        | -          | Platform Managers           |
 * |             | └ user/          | -          | User identity               |
 * |             | └ common/        | -          | Logger, utilities           |
 * |             | └ error/         | -          | Error type system           |
 * |             | └ guards/        | -          | Runtime type guards         |
 * | Network     | network/         | HTTP/WS    | Communication layer         |
 * |             | └ server/        | WS         | Accept connections          |
 * |             | └ channel/       | WS         | Bidirectional transport     |
 * |             | └ endpoint/      | HTTP       | REST API contracts          |
 * | Runtime     | runtime/         | WS Event   | Execution environment       |
 * |             | └ agent/         | -          | Agent, Message, Events      |
 * |             | └ session/       | -          | Session management          |
 * |             | └ container/     | -          | Container, Sandbox, LLM     |
 * |             | └ repository/    | -          | Storage abstraction         |
 *
 * @see issues/026-three-layer-architecture.md
 * @see issues/025-ecosystem-channel-architecture.md
 * @packageDocumentation
 */

// ============================================================================
// Application Layer (HTTP - Static Resources)
// ============================================================================

export * from "./application";

// ============================================================================
// Network Layer (HTTP + WebSocket)
// ============================================================================

export * from "./network";

// ============================================================================
// Runtime Layer (WebSocket Events)
// ============================================================================

export * from "./runtime";
