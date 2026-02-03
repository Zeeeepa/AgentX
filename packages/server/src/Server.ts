/**
 * AgentX Server Implementation
 *
 * Creates a WebSocket server that:
 * 1. Accepts client connections
 * 2. Routes command events through CommandHandler
 * 3. Broadcasts agent events to subscribed clients
 */

import type { AgentXProvider } from "@agentxjs/core/runtime";
import type { ChannelConnection } from "@agentxjs/core/network";
import type { BusEvent } from "@agentxjs/core/event";
import { createAgentXRuntime } from "@agentxjs/core/runtime";
import { WebSocketServer, isDeferredProvider, type DeferredProviderConfig } from "@agentxjs/node-provider";
import { createLogger } from "commonxjs/logger";
import { CommandHandler } from "./CommandHandler";
import type { AgentXServer } from "./types";

const logger = createLogger("server/Server");

/**
 * Connection state
 */
interface ConnectionState {
  connection: ChannelConnection;
  subscribedTopics: Set<string>;
}

/**
 * Server configuration (supports both immediate and deferred providers)
 */
export interface ServerConfig {
  /**
   * AgentX Provider (can be AgentXProvider or DeferredProviderConfig)
   */
  provider: AgentXProvider | DeferredProviderConfig;

  /**
   * Port to listen on (standalone mode)
   */
  port?: number;

  /**
   * Host to bind to (default: "0.0.0.0")
   */
  host?: string;

  /**
   * Existing HTTP server to attach to (attached mode)
   */
  server?: import("@agentxjs/core/network").MinimalHTTPServer;

  /**
   * WebSocket path when attached (default: "/ws")
   */
  wsPath?: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Create an AgentX server
 */
export async function createServer(config: ServerConfig): Promise<AgentXServer> {
  const { wsPath = "/ws" } = config;

  // Resolve deferred provider if needed
  const provider: AgentXProvider = isDeferredProvider(config.provider)
    ? await config.provider.resolve()
    : config.provider;

  // Create runtime from provider
  const runtime = createAgentXRuntime(provider);

  // Create WebSocket server
  const wsServer = new WebSocketServer({
    heartbeat: true,
    heartbeatInterval: 30000,
    debug: config.debug,
  });

  // Create command handler
  const commandHandler = new CommandHandler(runtime, provider.eventBus);

  // Track connections
  const connections = new Map<string, ConnectionState>();

  /**
   * Subscribe connection to a topic
   */
  function subscribeToTopic(connectionId: string, topic: string): void {
    const state = connections.get(connectionId);
    if (!state || state.subscribedTopics.has(topic)) return;

    state.subscribedTopics.add(topic);
    logger.debug("Connection subscribed to topic", { connectionId, topic });
  }

  /**
   * Check if event should be sent to connection based on subscriptions
   */
  function shouldSendToConnection(state: ConnectionState, event: BusEvent): boolean {
    // Always send global events
    if (state.subscribedTopics.has("global")) {
      // But skip internal events
      if (event.source === "driver" && event.intent === "request") {
        return false;
      }
    }

    // Check if subscribed to event's session (context is in data or as separate field)
    const eventWithContext = event as BusEvent & { context?: { sessionId?: string } };
    const sessionId = eventWithContext.context?.sessionId;
    if (sessionId && state.subscribedTopics.has(sessionId)) {
      return true;
    }

    // Send command responses
    if (event.category === "response") {
      return true;
    }

    return state.subscribedTopics.has("global");
  }

  // Handle new connections
  wsServer.onConnection((connection) => {
    const state: ConnectionState = {
      connection,
      subscribedTopics: new Set(["global"]),
    };
    connections.set(connection.id, state);

    logger.info("Client connected", {
      connectionId: connection.id,
      totalConnections: connections.size,
    });

    // Handle messages from client
    connection.onMessage((message) => {
      try {
        const parsed = JSON.parse(message);

        // Handle subscription request
        if (parsed.type === "subscribe" && parsed.sessionId) {
          subscribeToTopic(connection.id, parsed.sessionId);
          return;
        }

        // Forward event to EventBus
        const event = parsed as BusEvent;
        logger.debug("Received client event", {
          type: event.type,
          category: event.category,
        });

        provider.eventBus.emit(event);
      } catch (err) {
        logger.error("Failed to parse client message", {
          error: (err as Error).message,
        });
      }
    });

    // Cleanup on disconnect
    connection.onClose(() => {
      connections.delete(connection.id);
      logger.info("Client disconnected", {
        connectionId: connection.id,
        totalConnections: connections.size,
      });
    });
  });

  // Route events to connected clients
  provider.eventBus.onAny((event) => {
    // Skip internal events
    if (event.source === "driver" && event.intent !== "notification") {
      return;
    }

    const message = JSON.stringify(event);

    for (const [connectionId, state] of connections) {
      if (shouldSendToConnection(state, event)) {
        state.connection.sendReliable(message, {
          timeout: 10000,
          onTimeout: () => {
            logger.warn("Event ACK timeout", {
              connectionId,
              eventType: event.type,
            });
          },
        });
      }
    }
  });

  // Attach to existing server if provided
  if (config.server) {
    wsServer.attach(config.server, wsPath);
    logger.info("WebSocket attached to existing server", { path: wsPath });
  }

  return {
    async listen(port?: number, host?: string) {
      if (config.server) {
        throw new Error(
          "Cannot listen when attached to existing server. The server should call listen() instead."
        );
      }

      const listenPort = port ?? config.port ?? 5200;
      const listenHost = host ?? config.host ?? "0.0.0.0";

      await wsServer.listen(listenPort, listenHost);
      logger.info("Server listening", { port: listenPort, host: listenHost });
    },

    async close() {
      await wsServer.close();
      logger.info("Server closed");
    },

    async dispose() {
      // Cleanup in order
      await wsServer.dispose();
      commandHandler.dispose();
      await runtime.shutdown();
      logger.info("Server disposed");
    },
  };
}
