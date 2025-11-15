/**
 * WebSocket Server Types
 */

import type { Agent } from "@deepractice-ai/agentx-api";
import type { Server as HttpServer } from "http";

/**
 * WebSocket Server Configuration
 */
export interface WebSocketServerConfig {
  /** Agent instance to forward events from */
  agent: Agent;

  /** WebSocket path (default: '/ws') */
  path?: string;

  // === Standalone Mode ===
  /** Port to listen on (creates standalone HTTP server) */
  port?: number;

  /** Host to bind to (default: '0.0.0.0') */
  host?: string;

  // === Embedded Mode ===
  /** Existing HTTP server to attach to */
  server?: HttpServer;
}

/**
 * Client → Server messages
 */
export type ClientMessage =
  | { type: "send"; content: string }
  | { type: "clear" }
  | { type: "destroy" };

/**
 * Server → Client messages
 *
 * These are AgentEvents from agentx-api, forwarded as-is
 */
export type ServerMessage =
  | { type: "user" } // UserMessageEvent
  | { type: "assistant" } // AssistantMessageEvent
  | { type: "stream_event" } // StreamDeltaEvent
  | { type: "result" } // ResultEvent
  | { type: "system" } // SystemInitEvent
  | { type: "error"; error: string; sessionId: string }; // Error message

/**
 * WebSocket Server Instance
 */
export interface AgentWebSocketServer {
  /**
   * Get WebSocket URL
   */
  getUrl(): string;

  /**
   * Close WebSocket server
   */
  close(): Promise<void>;

  /**
   * Get server info
   */
  getInfo(): {
    path: string;
    mode: "standalone" | "embedded";
    url: string;
    clientCount: number;
  };
}
