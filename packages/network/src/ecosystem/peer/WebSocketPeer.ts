/**
 * WebSocketPeer - WebSocket implementation of Peer interface
 *
 * Provides bidirectional communication using WebSocket protocol.
 * Can act as both client (upstream) and server (downstream).
 *
 * @example
 * ```typescript
 * // Source - downstream only
 * const peer = createWebSocketPeer();
 * await peer.listenDownstream({ port: 5200 });
 *
 * // Relay - both upstream and downstream
 * const peer = createWebSocketPeer();
 * await peer.connectUpstream({ url: "ws://source:5200" });
 * await peer.listenDownstream({ port: 5201 });
 *
 * // Terminal - upstream only
 * const peer = createWebSocketPeer();
 * await peer.connectUpstream({ url: "ws://relay:5201" });
 * ```
 */

import { WebSocketServer, WebSocket } from "ws";
import type {
  Peer,
  PeerState,
  PeerServerState,
  UpstreamConfig,
  DownstreamConfig,
  DownstreamConnection,
  PeerEventHandler,
  PeerStateHandler,
  PeerServerStateHandler,
  DownstreamConnectionHandler,
  PeerUnsubscribe,
  EnvironmentEvent,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("network/WebSocketPeer");

// ============================================================================
// Downstream Connection Implementation
// ============================================================================

/**
 * Server-side connection wrapping a WebSocket
 */
class WebSocketDownstreamConnection implements DownstreamConnection {
  private _state: PeerState = "connected";
  private readonly eventHandlers = new Set<PeerEventHandler>();
  private readonly stateHandlers = new Set<PeerStateHandler>();

  constructor(
    readonly id: string,
    private readonly ws: WebSocket
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.ws.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString()) as EnvironmentEvent;
        logger.debug("Downstream received event", { connectionId: this.id, type: event.type });

        for (const handler of this.eventHandlers) {
          try {
            handler(event);
          } catch (err) {
            logger.error("Event handler error", { error: err });
          }
        }
      } catch (err) {
        logger.error("Failed to parse message", { error: err });
      }
    });

    this.ws.on("close", () => {
      logger.debug("Downstream connection closed", { connectionId: this.id });
      this.setState("disconnected");
    });

    this.ws.on("error", (err) => {
      logger.error("Downstream connection error", { connectionId: this.id, error: err });
    });
  }

  get state(): PeerState {
    return this._state;
  }

  private setState(state: PeerState): void {
    if (this._state !== state) {
      this._state = state;
      for (const handler of this.stateHandlers) {
        try {
          handler(state);
        } catch (err) {
          logger.error("State handler error", { error: err });
        }
      }
    }
  }

  send(event: EnvironmentEvent): void {
    if (this._state !== "connected" || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Cannot send event: connection is ${this._state}`);
    }

    const message = JSON.stringify(event);
    logger.debug("Downstream sending event", { connectionId: this.id, type: event.type });
    this.ws.send(message);
  }

  disconnect(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "Server disconnect");
    }
    this.setState("disconnected");
  }

  onEvent(handler: PeerEventHandler): PeerUnsubscribe {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  onStateChange(handler: PeerStateHandler): PeerUnsubscribe {
    this.stateHandlers.add(handler);
    handler(this._state);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }
}

// ============================================================================
// WebSocketPeer Implementation
// ============================================================================

/**
 * Generate unique connection ID
 */
function generateConnectionId(): string {
  return `conn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * WebSocketPeer - Bidirectional network node using WebSocket
 */
export class WebSocketPeer implements Peer {
  // Upstream state
  private _upstreamState: PeerState = "disconnected";
  private upstreamWs: WebSocket | null = null;
  private upstreamConfig: UpstreamConfig | null = null;
  private readonly upstreamEventHandlers = new Set<PeerEventHandler>();
  private readonly upstreamStateHandlers = new Set<PeerStateHandler>();
  private upstreamReconnectAttempts = 0;
  private upstreamReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private upstreamIntentionalClose = false;

  // Downstream state
  private _downstreamState: PeerServerState = "stopped";
  private downstreamWss: WebSocketServer | null = null;
  private readonly downstreamConnectionHandlers = new Set<DownstreamConnectionHandler>();
  private readonly downstreamStateHandlers = new Set<PeerServerStateHandler>();
  private readonly activeConnections = new Map<string, WebSocketDownstreamConnection>();

  constructor() {
    logger.debug("WebSocketPeer created");
  }

  // ==========================================================================
  // Upstream (as client)
  // ==========================================================================

  get upstreamState(): PeerState {
    return this._upstreamState;
  }

  private setUpstreamState(state: PeerState): void {
    if (this._upstreamState !== state) {
      this._upstreamState = state;
      logger.debug("Upstream state changed", { state });
      for (const handler of this.upstreamStateHandlers) {
        try {
          handler(state);
        } catch (err) {
          logger.error("Upstream state handler error", { error: err });
        }
      }
    }
  }

  async connectUpstream(config: UpstreamConfig): Promise<void> {
    if (this._upstreamState === "connected") {
      logger.debug("Upstream already connected");
      return;
    }

    if (this._upstreamState === "connecting") {
      logger.debug("Upstream connection in progress");
      return;
    }

    this.upstreamConfig = config;
    this.upstreamIntentionalClose = false;
    this.setUpstreamState("connecting");

    // Build URL with query params
    const urlObj = new URL(config.url);
    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        urlObj.searchParams.set(key, value);
      }
    }
    const url = urlObj.toString();

    return new Promise((resolve, reject) => {
      try {
        this.upstreamWs = new WebSocket(url);

        this.upstreamWs.on("open", () => {
          logger.info("Upstream connected", { url });
          this.upstreamReconnectAttempts = 0;
          this.setUpstreamState("connected");
          resolve();
        });

        this.upstreamWs.on("close", (code, reason) => {
          logger.info("Upstream closed", { code, reason: reason.toString() });
          this.upstreamWs = null;

          if (this._upstreamState === "connecting") {
            this.setUpstreamState("disconnected");
            reject(new Error(`Upstream connection failed: ${reason.toString() || "Unknown reason"}`));
          } else if (!this.upstreamIntentionalClose && this.shouldReconnectUpstream()) {
            this.scheduleUpstreamReconnect();
          } else {
            this.setUpstreamState("disconnected");
          }
        });

        this.upstreamWs.on("error", (err) => {
          logger.error("Upstream error", { error: err });
        });

        this.upstreamWs.on("message", (data) => {
          this.handleUpstreamMessage(data.toString());
        });
      } catch (err) {
        this.setUpstreamState("disconnected");
        reject(err);
      }
    });
  }

  disconnectUpstream(): void {
    this.upstreamIntentionalClose = true;
    this.clearUpstreamReconnectTimer();

    if (this.upstreamWs) {
      logger.info("Disconnecting upstream");
      this.upstreamWs.close(1000, "Client disconnect");
      this.upstreamWs = null;
    }

    this.setUpstreamState("disconnected");
  }

  sendUpstream(event: EnvironmentEvent): void {
    if (this._upstreamState !== "connected" || !this.upstreamWs) {
      throw new Error(`Cannot send upstream: state is ${this._upstreamState}`);
    }

    const message = JSON.stringify(event);
    logger.debug("Sending upstream", { type: event.type });
    this.upstreamWs.send(message);
  }

  onUpstreamEvent(handler: PeerEventHandler): PeerUnsubscribe {
    this.upstreamEventHandlers.add(handler);
    return () => {
      this.upstreamEventHandlers.delete(handler);
    };
  }

  onUpstreamStateChange(handler: PeerStateHandler): PeerUnsubscribe {
    this.upstreamStateHandlers.add(handler);
    handler(this._upstreamState);
    return () => {
      this.upstreamStateHandlers.delete(handler);
    };
  }

  private handleUpstreamMessage(data: string): void {
    try {
      const event = JSON.parse(data) as EnvironmentEvent;
      logger.debug("Upstream received event", { type: event.type });

      for (const handler of this.upstreamEventHandlers) {
        try {
          handler(event);
        } catch (err) {
          logger.error("Upstream event handler error", { error: err, eventType: event.type });
        }
      }
    } catch (err) {
      logger.error("Failed to parse upstream message", { error: err, data });
    }
  }

  private shouldReconnectUpstream(): boolean {
    if (!this.upstreamConfig?.reconnect) return true;
    const reconnect = this.upstreamConfig.reconnect;
    if (reconnect.enabled === false) return false;
    const maxAttempts = reconnect.maxAttempts ?? Infinity;
    return this.upstreamReconnectAttempts < maxAttempts;
  }

  private scheduleUpstreamReconnect(): void {
    if (!this.upstreamConfig) return;

    this.setUpstreamState("reconnecting");

    const reconnect = this.upstreamConfig.reconnect ?? {};
    const delay = reconnect.delay ?? 1000;
    const maxDelay = reconnect.maxDelay ?? 30000;

    const actualDelay = Math.min(
      delay * Math.pow(2, this.upstreamReconnectAttempts) + Math.random() * 1000,
      maxDelay
    );

    this.upstreamReconnectAttempts++;
    logger.info("Scheduling upstream reconnect", { attempt: this.upstreamReconnectAttempts, delay: actualDelay });

    this.upstreamReconnectTimer = setTimeout(() => {
      this.upstreamReconnectTimer = null;
      this.connectUpstream(this.upstreamConfig!).catch((err) => {
        logger.error("Upstream reconnect failed", { error: err });
      });
    }, actualDelay);
  }

  private clearUpstreamReconnectTimer(): void {
    if (this.upstreamReconnectTimer) {
      clearTimeout(this.upstreamReconnectTimer);
      this.upstreamReconnectTimer = null;
    }
  }

  // ==========================================================================
  // Downstream (as server)
  // ==========================================================================

  get downstreamState(): PeerServerState {
    return this._downstreamState;
  }

  get downstreamConnections(): ReadonlyArray<DownstreamConnection> {
    return Array.from(this.activeConnections.values());
  }

  private setDownstreamState(state: PeerServerState): void {
    if (this._downstreamState !== state) {
      this._downstreamState = state;
      logger.debug("Downstream state changed", { state });
      for (const handler of this.downstreamStateHandlers) {
        try {
          handler(state);
        } catch (err) {
          logger.error("Downstream state handler error", { error: err });
        }
      }
    }
  }

  async listenDownstream(config: DownstreamConfig): Promise<void> {
    if (this._downstreamState === "listening") {
      logger.debug("Downstream already listening");
      return;
    }

    if (this._downstreamState === "starting") {
      logger.debug("Downstream server is starting");
      return;
    }

    this.setDownstreamState("starting");

    const host = config.host ?? "0.0.0.0";
    const path = config.path ?? "/";

    return new Promise((resolve, reject) => {
      try {
        this.downstreamWss = new WebSocketServer({
          port: config.port,
          host,
          path,
        });

        this.downstreamWss.on("listening", () => {
          logger.info("Downstream listening", { port: config.port, host, path });
          this.setDownstreamState("listening");
          resolve();
        });

        this.downstreamWss.on("connection", (ws) => {
          const connectionId = generateConnectionId();
          logger.info("New downstream connection", { connectionId });

          const connection = new WebSocketDownstreamConnection(connectionId, ws);
          this.activeConnections.set(connectionId, connection);

          // Remove connection when disconnected
          connection.onStateChange((state) => {
            if (state === "disconnected") {
              this.activeConnections.delete(connectionId);
              logger.debug("Downstream connection removed", { connectionId });
            }
          });

          // Notify connection handlers
          for (const handler of this.downstreamConnectionHandlers) {
            try {
              handler(connection);
            } catch (err) {
              logger.error("Connection handler error", { error: err });
            }
          }
        });

        this.downstreamWss.on("error", (err) => {
          logger.error("Downstream server error", { error: err });
          if (this._downstreamState === "starting") {
            this.setDownstreamState("stopped");
            reject(err);
          }
        });
      } catch (err) {
        this.setDownstreamState("stopped");
        reject(err);
      }
    });
  }

  async closeDownstream(): Promise<void> {
    if (this._downstreamState === "stopped") {
      return;
    }

    this.setDownstreamState("stopping");

    // Close all active connections
    for (const connection of this.activeConnections.values()) {
      connection.disconnect();
    }
    this.activeConnections.clear();

    // Close server
    if (this.downstreamWss) {
      await new Promise<void>((resolve) => {
        this.downstreamWss!.close(() => {
          logger.info("Downstream server closed");
          resolve();
        });
      });
      this.downstreamWss = null;
    }

    this.setDownstreamState("stopped");
  }

  broadcast(event: EnvironmentEvent): void {
    logger.debug("Broadcasting to downstream", { type: event.type, count: this.activeConnections.size });

    for (const connection of this.activeConnections.values()) {
      if (connection.state === "connected") {
        try {
          connection.send(event);
        } catch (err) {
          logger.error("Broadcast to connection failed", { connectionId: connection.id, error: err });
        }
      }
    }
  }

  onDownstreamConnection(handler: DownstreamConnectionHandler): PeerUnsubscribe {
    this.downstreamConnectionHandlers.add(handler);
    return () => {
      this.downstreamConnectionHandlers.delete(handler);
    };
  }

  onDownstreamStateChange(handler: PeerServerStateHandler): PeerUnsubscribe {
    this.downstreamStateHandlers.add(handler);
    handler(this._downstreamState);
    return () => {
      this.downstreamStateHandlers.delete(handler);
    };
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  dispose(): void {
    logger.info("Disposing WebSocketPeer");

    // Disconnect upstream
    this.disconnectUpstream();

    // Close downstream (sync version for dispose)
    if (this.downstreamWss) {
      for (const connection of this.activeConnections.values()) {
        connection.disconnect();
      }
      this.activeConnections.clear();
      this.downstreamWss.close();
      this.downstreamWss = null;
    }
    this.setDownstreamState("stopped");

    // Clear all handlers
    this.upstreamEventHandlers.clear();
    this.upstreamStateHandlers.clear();
    this.downstreamConnectionHandlers.clear();
    this.downstreamStateHandlers.clear();
  }
}

/**
 * Create WebSocket peer
 */
export function createWebSocketPeer(): Peer {
  return new WebSocketPeer();
}
