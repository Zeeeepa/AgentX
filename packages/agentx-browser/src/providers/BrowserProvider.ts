/**
 * Browser Provider - WebSocket client adapter
 *
 * Implements LLMProvider interface by communicating with WebSocket server.
 * Receives events from server and forwards them to Agent.
 */

import type { LLMProvider, LLMConfig, LLMRequest, LLMResponse } from "@deepractice-ai/agentx-types";
import mitt, { type Emitter } from "mitt";

export interface BrowserProviderConfig extends LLMConfig {
  /** WebSocket server URL */
  wsUrl: string;

  /** Auto-reconnect on disconnect (default: true) */
  reconnect?: boolean;

  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;

  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
}

/**
 * Browser Provider
 *
 * Connects to WebSocket server and translates server events to LLMProvider interface.
 *
 * Architecture:
 * - Establishes WebSocket connection to server
 * - Forwards user messages to server
 * - Receives and emits server events (user, assistant, stream_event, result, system)
 * - Handles reconnection
 */
export class BrowserProvider implements LLMProvider {
  private ws!: WebSocket;
  private emitter: Emitter<Record<string, any>>;
  private config: Required<BrowserProviderConfig>;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private isDestroyed: boolean = false;

  constructor(config: BrowserProviderConfig) {
    this.config = {
      ...config,
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
    };

    this.emitter = mitt();

    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.isDestroyed) {
      return;
    }

    console.log(`[BrowserProvider] Connecting to ${this.config.wsUrl}`);

    this.ws = new WebSocket(this.config.wsUrl);

    this.ws.onopen = () => {
      console.log(`[BrowserProvider] Connected to ${this.config.wsUrl}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitter.emit("connected", {});
    };

    this.ws.onmessage = (event) => {
      this.handleServerMessage(event.data);
    };

    this.ws.onerror = (error) => {
      console.error("[BrowserProvider] WebSocket error:", error);
      this.emitter.emit("error", { error });
    };

    this.ws.onclose = () => {
      console.log("[BrowserProvider] WebSocket closed");
      this.isConnected = false;
      this.emitter.emit("disconnected", {});
      this.attemptReconnect();
    };
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (!this.config.reconnect || this.isDestroyed) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("[BrowserProvider] Max reconnect attempts reached");
      this.emitter.emit("reconnect-failed", {});
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(
      `[BrowserProvider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );
    this.emitter.emit("reconnecting", { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Forward all server events to Agent
      // Events: user, assistant, stream_event, result, system, error
      this.emitter.emit(message.type, message);
    } catch (error) {
      console.error("[BrowserProvider] Failed to parse server message:", error);
    }
  }

  /**
   * Send request to server
   *
   * NOTE: In browser mode, we don't actually use LLMRequest/LLMResponse structure.
   * The Agent sends messages via WebSocket and receives events.
   * This method is here to satisfy the LLMProvider interface.
   */
  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    if (!this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    // Extract last message content
    const lastMessage = request.messages[request.messages.length - 1];
    const content =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : lastMessage.content.map((part) => (part.type === "text" ? part.text : "")).join("");

    // Send to server
    this.ws.send(
      JSON.stringify({
        type: "send",
        content,
      })
    );

    // Return a placeholder response
    // Real responses come through events
    return {
      stopReason: "end_turn",
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    };
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (data: any) => void): void {
    this.emitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: (data: any) => void): void {
    this.emitter.off(event, handler);
  }

  /**
   * Destroy provider and close connection
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.ws) {
      this.ws.close();
    }

    this.emitter.all.clear();
    console.log("[BrowserProvider] Destroyed");
  }

  /**
   * Check if provider is connected
   */
  isProviderConnected(): boolean {
    return this.isConnected;
  }
}
