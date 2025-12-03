/**
 * Network Module - Communication infrastructure for all layers
 *
 * ## Architecture
 *
 * Network layer serves both Application and Ecosystem layers:
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Network Layer                            │
 * ├─────────────────────────────┬───────────────────────────────┤
 * │   network/application/      │   network/ecosystem/          │
 * │   (HTTP for Application)    │   (WebSocket for Ecosystem)   │
 * │                             │                               │
 * │   ┌─────────────────────┐   │   ┌─────────────────────┐     │
 * │   │  server/            │   │   │  server/            │     │
 * │   │  ApplicationHandler │   │   │  ChannelServer      │     │
 * │   └─────────────────────┘   │   └─────────────────────┘     │
 * │   ┌─────────────────────┐   │   ┌─────────────────────┐     │
 * │   │  client/            │   │   │  channel/           │     │
 * │   │  ApplicationClient  │   │   │  Channel            │     │
 * │   └─────────────────────┘   │   └─────────────────────┘     │
 * │   ┌─────────────────────┐   │                               │
 * │   │  endpoint/          │   │                               │
 * │   │  HTTP contracts     │   │                               │
 * │   └─────────────────────┘   │                               │
 * └─────────────────────────────┴───────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * **Application (HTTP)**:
 * - Server: `ApplicationHandler` for handling HTTP requests
 * - Client: `ApplicationClient` for making HTTP requests
 * - Contracts: `Endpoint` types for type-safe API definitions
 *
 * **Ecosystem (WebSocket)**:
 * - Server: `ChannelServer` for accepting WebSocket connections
 * - Client: `Channel` for bidirectional event streaming
 *
 * @see issues/026-three-layer-architecture.md
 * @packageDocumentation
 */

// ============================================================================
// Application (HTTP)
// ============================================================================

export * from "./application";

// ============================================================================
// Ecosystem (WebSocket)
// ============================================================================

export * from "./ecosystem";
