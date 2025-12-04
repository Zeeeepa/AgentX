/**
 * MirrorRuntime - Browser-side Runtime implementation
 *
 * Implements Runtime interface for browser clients.
 * Uses SystemBus internally for event handling.
 *
 * @example
 * ```typescript
 * const runtime = new MirrorRuntime();
 *
 * runtime.on((event) => {
 *   console.log("Event:", event);
 * });
 * ```
 */

import type { Runtime, Unsubscribe, RuntimeEventHandler } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";
import { SystemBusImpl } from "./SystemBusImpl";

const logger = createLogger("mirror/MirrorRuntime");

/**
 * MirrorRuntime configuration
 */
export interface MirrorRuntimeConfig {
  /**
   * Server URL to connect to (for future SSE/WebSocket support)
   */
  serverUrl?: string;
}

/**
 * MirrorRuntime - Browser-side Runtime implementation
 *
 * Simple implementation that wraps SystemBus for event handling.
 * In future, will connect to server via SSE/WebSocket for real-time events.
 */
export class MirrorRuntime implements Runtime {
  private readonly bus: SystemBusImpl;
  private readonly config: MirrorRuntimeConfig;

  constructor(config: MirrorRuntimeConfig = {}) {
    this.config = config;
    this.bus = new SystemBusImpl();
    logger.debug("MirrorRuntime created", { serverUrl: config.serverUrl });
  }

  /**
   * Subscribe to all runtime events
   */
  on(handler: RuntimeEventHandler): Unsubscribe {
    return this.bus.onAny((event) => {
      handler(event);
    });
  }

  /**
   * Emit an event to the runtime
   */
  emit(event: unknown): void {
    this.bus.emit(event as { type: string });
  }

  /**
   * Dispose the runtime and clean up resources
   */
  dispose(): void {
    logger.info("Disposing MirrorRuntime");
    this.bus.destroy();
  }

  /**
   * Get the underlying SystemBus (for advanced use)
   */
  getBus(): SystemBusImpl {
    return this.bus;
  }

  /**
   * Get configuration
   */
  getConfig(): MirrorRuntimeConfig {
    return this.config;
  }
}
