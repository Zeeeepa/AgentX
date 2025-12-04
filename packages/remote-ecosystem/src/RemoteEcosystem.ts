/**
 * RemoteEcosystem - Factory for Network-backed Ecosystem
 *
 * Assembles:
 * - SystemBus from local implementation
 * - Channel from @agentxjs/network
 * - NetworkEnvironment to bridge Channel ↔ SystemBus
 *
 * @example
 * ```typescript
 * import { remoteEcosystem } from "@agentxjs/remote-ecosystem";
 *
 * const ecosystem = remoteEcosystem({
 *   url: "wss://api.example.com/ws",
 * });
 *
 * await ecosystem.connect();
 *
 * ecosystem.bus.on("text_chunk", (event) => {
 *   console.log("Text:", event.data.text);
 * });
 *
 * ecosystem.bus.emit({
 *   type: "user_message",
 *   data: { content: "Hello!" },
 * });
 *
 * ecosystem.dispose();
 * ```
 */

import type { SystemBus, Environment, Channel } from "@agentxjs/types";
import { createWebSocketChannel, type WebSocketChannelConfig } from "@agentxjs/network";
import { SystemBusImpl } from "./SystemBusImpl";
import { NetworkEnvironment } from "./environment";

/**
 * RemoteEcosystem configuration
 */
export interface RemoteEcosystemConfig extends WebSocketChannelConfig {}

/**
 * RemoteEcosystem - Network-backed Ecosystem
 */
export class RemoteEcosystem {
  /**
   * Central event bus
   */
  readonly bus: SystemBus;

  /**
   * Network environment (Receptor + Effector)
   */
  readonly environment: Environment;

  /**
   * Underlying network channel
   */
  readonly channel: Channel;

  constructor(config: RemoteEcosystemConfig) {
    // 1. Create SystemBus
    this.bus = new SystemBusImpl();

    // 2. Create Channel from network package
    this.channel = createWebSocketChannel(config);

    // 3. Create NetworkEnvironment to bridge Channel ↔ SystemBus
    this.environment = new NetworkEnvironment(this.channel);

    // 4. Connect environment to bus
    this.environment.receptor.emit(this.bus);
    this.environment.effector.subscribe(this.bus);
  }

  /**
   * Connect to remote server
   */
  async connect(): Promise<void> {
    await this.channel.connect();
  }

  /**
   * Dispose the ecosystem and clean up resources
   */
  dispose(): void {
    this.channel.disconnect();
    this.bus.destroy();
  }
}

/**
 * Create a Remote Ecosystem
 */
export function remoteEcosystem(config: RemoteEcosystemConfig): RemoteEcosystem {
  return new RemoteEcosystem(config);
}
