/**
 * AgentX Types - Type definitions for AI Agent ecosystem
 *
 * ## Three-Layer Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Application Layer                        │
 * │   (AgentX API, Definition, Image, User)                     │
 * │   Protocol: HTTP (static resource CRUD)                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Network Layer                            │
 * │   (Server, Client, Channel, Endpoints)                      │
 * │   Protocol: HTTP + WebSocket                                │
 * ├─────────────────────────────────────────────────────────────┤
 * │                    Ecosystem Layer                          │
 * │   (Runtime, Container, Session, Agent)                      │
 * │   Protocol: WebSocket Events                                │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Module Structure
 *
 * | Layer       | Module           | Protocol   | Purpose                     |
 * |-------------|------------------|------------|-----------------------------|
 * | Application | application/     | HTTP       | Static resources + API      |
 * |             | └ spec/          | -          | Definition, Image           |
 * |             | └ agentx/        | -          | Managers                    |
 * |             | └ user/          | -          | User types                  |
 * |             | └ common/        | -          | Utilities                   |
 * |             | └ error/         | -          | Error types                 |
 * |             | └ guards/        | -          | Type guards                 |
 * | Network     | network/         | HTTP/WS    | Server, Client, Channel     |
 * |             | └ server/        | WS         | Listen for connections      |
 * |             | └ client/        | WS         | Connect to server           |
 * |             | └ channel/       | WS         | Bidirectional communication |
 * |             | └ endpoint/      | HTTP       | Static resource CRUD        |
 * | Ecosystem   | ecosystem/       | WS Event   | Runtime environment         |
 * |             | └ agent/         | -          | Agent types and events      |
 * |             | └ session/       | -          | Session management          |
 * |             | └ container/     | -          | Container, Sandbox          |
 * |             | └ repository/    | -          | Storage abstraction         |
 *
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
// Ecosystem Layer (WebSocket Events)
// ============================================================================

export * from "./ecosystem";
