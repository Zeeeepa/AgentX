/**
 * MockPeer - Test double for WebSocketPeer
 *
 * Simulates Peer behavior for testing MirrorRuntime.
 */

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

/**
 * MockPeer - Test double for Peer interface
 */
export class MockPeer implements Peer {
  // State
  private _upstreamState: PeerState = "disconnected";
  private _downstreamState: PeerServerState = "stopped";

  // Handlers
  private upstreamEventHandlers = new Set<PeerEventHandler>();
  private upstreamStateHandlers = new Set<PeerStateHandler>();
  private downstreamConnectionHandlers = new Set<DownstreamConnectionHandler>();
  private downstreamStateHandlers = new Set<PeerServerStateHandler>();

  // Sent events (for verification)
  public sentUpstreamEvents: EnvironmentEvent[] = [];
  public broadcastedEvents: EnvironmentEvent[] = [];

  // ============================================================================
  // Upstream (as client)
  // ============================================================================

  get upstreamState(): PeerState {
    return this._upstreamState;
  }

  async connectUpstream(_config: UpstreamConfig): Promise<void> {
    this.setUpstreamState("connected");
  }

  disconnectUpstream(): void {
    this.setUpstreamState("disconnected");
  }

  sendUpstream(event: EnvironmentEvent): void {
    this.sentUpstreamEvents.push(event);
  }

  onUpstreamEvent(handler: PeerEventHandler): PeerUnsubscribe {
    this.upstreamEventHandlers.add(handler);
    return () => {
      this.upstreamEventHandlers.delete(handler);
    };
  }

  onUpstreamStateChange(handler: PeerStateHandler): PeerUnsubscribe {
    this.upstreamStateHandlers.add(handler);
    // Immediately notify current state
    handler(this._upstreamState);
    return () => {
      this.upstreamStateHandlers.delete(handler);
    };
  }

  // ============================================================================
  // Downstream (as server)
  // ============================================================================

  get downstreamState(): PeerServerState {
    return this._downstreamState;
  }

  get downstreamConnections(): readonly DownstreamConnection[] {
    return [];
  }

  async listenDownstream(_config: DownstreamConfig): Promise<void> {
    this.setDownstreamState("listening");
  }

  async closeDownstream(): Promise<void> {
    this.setDownstreamState("stopped");
  }

  broadcast(event: EnvironmentEvent): void {
    this.broadcastedEvents.push(event);
  }

  onDownstreamConnection(handler: DownstreamConnectionHandler): PeerUnsubscribe {
    this.downstreamConnectionHandlers.add(handler);
    return () => {
      this.downstreamConnectionHandlers.delete(handler);
    };
  }

  onDownstreamStateChange(handler: PeerServerStateHandler): PeerUnsubscribe {
    this.downstreamStateHandlers.add(handler);
    // Immediately notify current state
    handler(this._downstreamState);
    return () => {
      this.downstreamStateHandlers.delete(handler);
    };
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  dispose(): void {
    this.upstreamEventHandlers.clear();
    this.upstreamStateHandlers.clear();
    this.downstreamConnectionHandlers.clear();
    this.downstreamStateHandlers.clear();
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  /**
   * Simulate upstream state change
   */
  setUpstreamState(state: PeerState): void {
    this._upstreamState = state;
    for (const handler of this.upstreamStateHandlers) {
      handler(state);
    }
  }

  /**
   * Simulate downstream state change
   */
  setDownstreamState(state: PeerServerState): void {
    this._downstreamState = state;
    for (const handler of this.downstreamStateHandlers) {
      handler(state);
    }
  }

  /**
   * Simulate receiving an event from upstream
   */
  triggerUpstreamEvent(event: EnvironmentEvent): void {
    for (const handler of this.upstreamEventHandlers) {
      handler(event);
    }
  }

  /**
   * Clear sent events (for test reset)
   */
  clearSentEvents(): void {
    this.sentUpstreamEvents = [];
    this.broadcastedEvents = [];
  }
}
