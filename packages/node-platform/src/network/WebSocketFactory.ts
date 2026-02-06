/**
 * Node.js WebSocket factory using the ws library
 *
 * Provides WebSocketFactory implementation for @agentxjs/core RpcClient.
 * Browser environments use native WebSocket (the default in RpcClient).
 */

import type { WebSocketFactory } from "@agentxjs/core/network";

/**
 * Create a WebSocket instance using the ws library (Node.js)
 */
export const createNodeWebSocket: WebSocketFactory = (url: string): WebSocket => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: WS } = require("ws");
  return new WS(url) as unknown as WebSocket;
};
