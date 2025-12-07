/**
 * createLocalAgentX - Local mode implementation
 *
 * This file is dynamically imported to enable tree-shaking in browser builds.
 * Contains Node.js specific code (runtime, ws server).
 */

import type { AgentX, LocalConfig, Unsubscribe } from "@agentxjs/types/agentx";
import type { SystemEvent } from "@agentxjs/types/event";
import type { WebSocket as WS, WebSocketServer as WSS } from "ws";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/createAgentX");

export async function createLocalAgentX(config: LocalConfig): Promise<AgentX> {
  // Apply logger configuration
  if (config.logger) {
    const { LoggerFactoryImpl, setLoggerFactory } = await import("@agentxjs/common");

    LoggerFactoryImpl.configure({
      defaultLevel: config.logger.level,
      consoleOptions: config.logger.console,
    });

    if (config.logger.factory) {
      setLoggerFactory(config.logger.factory);
    }
  }

  // Dynamic import to avoid bundling runtime in browser
  const { createRuntime, createPersistence } = await import("@agentxjs/runtime");

  // Create persistence from storage config (async)
  const storageConfig = config.storage ?? {};
  const persistence = await createPersistence(storageConfig as Parameters<typeof createPersistence>[0]);

  const runtime = createRuntime({
    persistence,
    llmProvider: {
      name: "claude",
      provide: () => ({
        apiKey: config.llm?.apiKey ?? "",
        baseUrl: config.llm?.baseUrl,
        model: config.llm?.model,
      }),
    },
  });

  // WebSocket server state
  let peer: WSS | null = null;
  const connections = new Set<WS>();

  return {
    // Core API - delegate to runtime
    request: (type, data, timeout) => runtime.request(type, data, timeout),

    on: (type, handler) => runtime.on(type, handler),

    onCommand: (type, handler) => runtime.onCommand(type, handler),

    emitCommand: (type, data) => runtime.emitCommand(type, data),

    // Server API
    async listen(port: number, host?: string) {
      if (peer) {
        throw new Error("Server already listening");
      }

      const { WebSocketServer } = await import("ws");
      peer = new WebSocketServer({ port, host: host ?? "0.0.0.0" });

      peer.on("connection", (ws: WS) => {
        connections.add(ws);
        logger.info("Client connected", { totalConnections: connections.size });

        // Forward client commands to runtime
        ws.on("message", (data: Buffer) => {
          try {
            const event = JSON.parse(data.toString()) as SystemEvent;
            logger.info("Received from client", { type: event.type, requestId: (event.data as { requestId?: string })?.requestId });
            runtime.emit(event);
          } catch {
            // Ignore parse errors
          }
        });

        ws.on("close", () => {
          connections.delete(ws);
          logger.info("Client disconnected", { totalConnections: connections.size });
        });
      });

      // Forward runtime events to all clients (only broadcastable events)
      runtime.onAny((event) => {
        // Skip non-broadcastable events (internal events like DriveableEvent)
        if (event.broadcastable === false) {
          return;
        }

        logger.info("Broadcasting to clients", { type: event.type, category: event.category, requestId: (event.data as { requestId?: string })?.requestId });
        const message = JSON.stringify(event);
        for (const ws of connections) {
          if (ws.readyState === 1) {
            // WebSocket.OPEN
            ws.send(message);
          }
        }
      });
    },

    async close() {
      if (!peer) return;

      for (const ws of connections) {
        ws.close();
      }
      connections.clear();

      await new Promise<void>((resolve) => {
        peer!.close(() => resolve());
      });
      peer = null;
    },

    async dispose() {
      if (peer) {
        for (const ws of connections) {
          ws.close();
        }
        connections.clear();
        await new Promise<void>((resolve) => {
          peer!.close(() => resolve());
        });
        peer = null;
      }
      await runtime.dispose();
    },
  };
}
