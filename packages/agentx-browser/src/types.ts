/**
 * Browser-specific types
 */

import type { AgentConfig } from "@deepractice-ai/agentx-api";

/**
 * Browser Agent Configuration
 *
 * Extends AgentConfig with browser-specific options
 */
export interface BrowserAgentConfig extends Omit<AgentConfig, "apiKey"> {
  /** WebSocket server URL */
  wsUrl: string;

  /** Auto-reconnect on disconnect (default: true) */
  reconnect?: boolean;

  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;

  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;

  /** API key is optional in browser (server handles it) */
  apiKey?: string;
}
