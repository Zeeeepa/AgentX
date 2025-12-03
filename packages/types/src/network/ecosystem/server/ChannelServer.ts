/**
 * ChannelServer - Application-level server that listens for Channel connections
 *
 * ChannelServer is the "listening" side of the application architecture.
 * It accepts incoming connections and creates a Channel for each.
 * Each Channel then creates a Runtime (Ecosystem) for that connection.
 *
 * Architecture:
 * ```
 * AgentX (with ChannelServer)           Remote Client (with Channel)
 * ┌─────────────────────────────┐     ┌─────────────────────────────┐
 * │  ChannelServer.listen()     │     │                             │
 * │         │                   │     │  Channel.connect() ────────►│
 * │         ▼                   │     │                             │
 * │  onConnection(channel) ◄────┼─────┤                             │
 * │         │                   │     │                             │
 * │         ▼                   │     │                             │
 * │  Create Runtime(channel)    │     │                             │
 * │         │                   │     │                             │
 * │         ▼                   │     │                             │
 * │  runtime.on() / emit()  ◄───┼────►│  channel.on() / send()      │
 * └─────────────────────────────┘     └─────────────────────────────┘
 * ```
 *
 * @example
 * ```typescript
 * // Server side (nodeRuntime)
 * const agentx = createAgentX(nodeRuntime());
 *
 * agentx.server.onConnection((runtime) => {
 *   console.log("New connection, runtime created");
 *
 *   runtime.on((event) => {
 *     console.log("Event:", event.type);
 *   });
 * });
 *
 * await agentx.server.listen({ port: 5200 });
 * ```
 */

import type { Channel, ChannelUnsubscribe } from "~/network/ecosystem/channel";

/**
 * ChannelServer state
 */
export type ChannelServerState = "stopped" | "starting" | "listening" | "stopping";

/**
 * Connection handler - called when a new Channel connects
 */
export type ConnectionHandler = (channel: Channel) => void;

/**
 * ChannelServer state change handler
 */
export type ChannelServerStateHandler = (state: ChannelServerState) => void;

/**
 * ChannelServer - Application-level server
 *
 * Accepts incoming connections and creates Channels for each.
 * Used by nodeRuntime to accept connections from remoteRuntime.
 */
export interface ChannelServer {
  /**
   * Current server state
   */
  readonly state: ChannelServerState;

  /**
   * Start listening for connections
   *
   * @returns Promise that resolves when server is ready
   * @throws Error if server fails to start
   */
  listen(): Promise<void>;

  /**
   * Stop listening and close all connections
   */
  close(): Promise<void>;

  /**
   * Subscribe to new connections
   *
   * @param handler - Called when a new Channel connects
   * @returns Unsubscribe function
   */
  onConnection(handler: ConnectionHandler): ChannelUnsubscribe;

  /**
   * Subscribe to server state changes
   *
   * @param handler - State change handler
   * @returns Unsubscribe function
   */
  onStateChange(handler: ChannelServerStateHandler): ChannelUnsubscribe;

  /**
   * Get all active channels
   */
  readonly channels: ReadonlyArray<Channel>;
}
