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
 * │   │  server/            │   │   │  server/                │ │
 * │   │  ApplicationHandler │   │   │  WebSocketChannelServer │ │
 * │   └─────────────────────┘   │   └─────────────────────────┘ │
 * │   ┌─────────────────────┐   │   ┌─────────────────────────┐ │
 * │   │  client/            │   │   │  channel/               │ │
 * │   │  ApplicationClient  │   │   │  WebSocketChannel       │ │
 * │   └─────────────────────┘   │   └─────────────────────────┘ │
 * └─────────────────────────────┴───────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * **Server (Node.js)**:
 * ```typescript
 * import {
 *   createApplicationHandler,
 *   createWebSocketChannelServer,
 * } from "@agentxjs/network";
 *
 * // HTTP API
 * const handler = createApplicationHandler(agentx, { repository });
 *
 * // WebSocket
 * const wsServer = createWebSocketChannelServer({ port: 5200 });
 * wsServer.onConnection((channel) => {
 *   // Handle channel events
 * });
 * await wsServer.listen();
 * ```
 *
 * **Client (Browser)**:
 * ```typescript
 * import {
 *   createApplicationClient,
 *   createWebSocketChannel,
 * } from "@agentxjs/network";
 *
 * // HTTP API
 * const client = createApplicationClient({ baseUrl: "http://localhost:5200/api" });
 * const definitions = await client.definitions.list();
 *
 * // WebSocket
 * const channel = createWebSocketChannel({ url: "ws://localhost:5200/ws" });
 * channel.on((event) => console.log(event));
 * await channel.connect();
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
