/**
 * @agentxjs/network - Network layer for AgentX
 *
 * Provides communication infrastructure for both Application and Ecosystem layers.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    @agentxjs/network                        │
 * ├─────────────────────────────┬───────────────────────────────┤
 * │   application/              │   ecosystem/                  │
 * │   (HTTP for Application)    │   (WebSocket for Ecosystem)   │
 * │                             │                               │
 * │   ┌─────────────────────┐   │   ┌─────────────────────────┐ │
 * │   │  server/            │   │   │  peer/                  │ │
 * │   │  ApplicationHandler │   │   │  WebSocketPeer          │ │
 * │   └─────────────────────┘   │   │  (upstream + downstream)│ │
 * │   ┌─────────────────────┐   │   └─────────────────────────┘ │
 * │   │  client/            │   │                               │
 * │   │  ApplicationClient  │   │                               │
 * │   └─────────────────────┘   │                               │
 * └─────────────────────────────┴───────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * **Server (Node.js)**:
 * ```typescript
 * import {
 *   createApplicationHandler,
 *   createWebSocketPeer,
 * } from "@agentxjs/network";
 *
 * // HTTP API
 * const handler = createApplicationHandler(agentx, { repository });
 *
 * // WebSocket Peer
 * const peer = createWebSocketPeer();
 * await peer.listenDownstream({ port: 5200 });
 * peer.onDownstreamConnection((conn) => {
 *   conn.onEvent((event) => console.log(event));
 * });
 * ```
 *
 * **Relay (Node.js)**:
 * ```typescript
 * import { createWebSocketPeer } from "@agentxjs/network";
 *
 * const peer = createWebSocketPeer();
 * await peer.connectUpstream({ url: "ws://source:5200" });
 * await peer.listenDownstream({ port: 5201 });
 *
 * // Forward upstream events to downstream
 * peer.onUpstreamEvent((event) => peer.broadcast(event));
 * ```
 *
 * **Client (Browser)**:
 * ```typescript
 * import {
 *   createApplicationClient,
 *   createWebSocketPeer,
 * } from "@agentxjs/network";
 *
 * // HTTP API
 * const client = createApplicationClient({ baseUrl: "http://localhost:5200/api" });
 * const definitions = await client.definitions.list();
 *
 * // WebSocket Peer (upstream only)
 * const peer = createWebSocketPeer();
 * await peer.connectUpstream({ url: "ws://localhost:5200" });
 * peer.onUpstreamEvent((event) => console.log(event));
 * ```
 *
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
