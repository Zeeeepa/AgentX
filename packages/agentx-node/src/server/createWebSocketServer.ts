/**
 * Create WebSocket Server for Agent
 *
 * Forwards all Agent events to connected WebSocket clients.
 * Supports two modes:
 * 1. Standalone: Create own HTTP server (pass `port`)
 * 2. Embedded: Attach to existing HTTP server (pass `server`)
 */

import http from "http";
import { WebSocketServer as WsServer } from "ws";
import type { WebSocketServerConfig, AgentWebSocketServer, ClientMessage } from "./types";
import { WebSocketBridge } from "./WebSocketBridge";

/**
 * Create WebSocket Server for Agent
 *
 * @example Standalone mode
 * ```typescript
 * const wsServer = createWebSocketServer({
 *   agent,
 *   port: 5200,
 * })
 * ```
 *
 * @example Embedded mode
 * ```typescript
 * const app = express()
 * const httpServer = app.listen(3000)
 *
 * const wsServer = createWebSocketServer({
 *   agent,
 *   server: httpServer,
 * })
 * ```
 */
export function createWebSocketServer(config: WebSocketServerConfig): AgentWebSocketServer {
  const { agent, path = "/ws", port, host = "0.0.0.0", server: existingServer } = config;

  // Validate config
  if (!port && !existingServer) {
    throw new Error("Must provide either `port` (standalone) or `server` (embedded)");
  }

  if (port && existingServer) {
    throw new Error("Cannot provide both `port` and `server`. Choose one mode.");
  }

  // Determine mode
  const mode: "standalone" | "embedded" = port ? "standalone" : "embedded";

  // Create HTTP server if in standalone mode
  let httpServer: http.Server;
  let shouldCloseHttpServer = false;

  if (mode === "standalone") {
    httpServer = http.createServer();
    shouldCloseHttpServer = true;

    httpServer.listen(port, host, () => {
      console.log(`[WebSocketServer] HTTP server listening on ${host}:${port}`);
    });
  } else {
    httpServer = existingServer!;
  }

  // Create WebSocket server
  const wss = new WsServer({
    server: httpServer,
    path,
    perMessageDeflate: false,
  });

  // Track bridges (one per connection, since one Agent instance)
  const connectionBridges = new WeakMap<any, WebSocketBridge>();
  let clientCount = 0;

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    clientCount++;
    console.log(`[WebSocketServer] Client connected (total: ${clientCount})`);

    // Create bridge for this connection
    const bridge = new WebSocketBridge(agent, ws);
    connectionBridges.set(ws, bridge);

    // Handle incoming messages from client
    ws.on("message", async (data) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());

        // Route message to Agent methods
        switch (message.type) {
          case "send":
            await agent.send(message.content);
            break;

          case "clear":
            agent.clear();
            break;

          case "destroy":
            agent.destroy();
            break;

          default:
            throw new Error(`Unknown message type: ${(message as any).type}`);
        }
      } catch (error) {
        console.error("[WebSocketServer] Error handling message:", error);

        // Send error to client
        ws.send(
          JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            sessionId: agent.sessionId,
          })
        );
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      clientCount--;
      console.log(`[WebSocketServer] Client disconnected (total: ${clientCount})`);

      // Cleanup bridge
      const bridge = connectionBridges.get(ws);
      if (bridge) {
        bridge.destroy();
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[WebSocketServer] WebSocket error:", error);
    });
  });

  console.log(`[WebSocketServer] Mode: ${mode}`);
  console.log(`[WebSocketServer] Path: ${path}`);

  // Build URL
  const url =
    mode === "standalone"
      ? `ws://${host}:${port}${path}`
      : `ws://[host]:${(httpServer.address() as any)?.port || "[port]"}${path}`;

  // Return server instance
  return {
    getUrl() {
      return url;
    },

    async close() {
      return new Promise((resolve, reject) => {
        console.log("[WebSocketServer] Closing WebSocket server...");

        wss.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          // Close HTTP server if we created it
          if (shouldCloseHttpServer) {
            httpServer.close(() => {
              console.log("[WebSocketServer] HTTP server closed");
              resolve();
            });
          } else {
            console.log("[WebSocketServer] WebSocket server closed");
            resolve();
          }
        });
      });
    },

    getInfo() {
      return {
        path,
        mode,
        url,
        clientCount,
      };
    },
  };
}
