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
 * │   │  server/            │   │   │  peer/              │     │
 * │   │  ApplicationHandler │   │   │  Peer               │     │
 * │   └─────────────────────┘   │   │  (upstream +        │     │
 * │   ┌─────────────────────┐   │   │   downstream)       │     │
 * │   │  client/            │   │   └─────────────────────┘     │
 * │   │  ApplicationClient  │   │                               │
 * │   └─────────────────────┘   │                               │
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
 * - Peer: Bidirectional node that can connect upstream and serve downstream
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
