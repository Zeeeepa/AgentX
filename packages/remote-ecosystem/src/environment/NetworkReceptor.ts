/**
 * NetworkReceptor - Bridges Channel to SystemBus
 *
 * Listens to Channel events and emits to SystemBus.
 * Converts Network layer (Channel) to Ecosystem layer (Receptor).
 */

import type { Receptor, SystemBus, Channel } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ecosystem/NetworkReceptor");

/**
 * NetworkReceptor - Channel → SystemBus
 */
export class NetworkReceptor implements Receptor {
  private readonly channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  /**
   * Start emitting Channel events to SystemBus
   */
  emit(bus: SystemBus): void {
    logger.debug("NetworkReceptor connecting Channel to SystemBus");

    // Forward all Channel events to SystemBus
    this.channel.on((event) => {
      logger.debug("Channel event → SystemBus", { type: event.type });
      bus.emit(event);
    });

    // Forward connection state changes as events
    this.channel.onStateChange((state) => {
      bus.emit({
        type: "connection_state",
        data: { state, timestamp: Date.now() },
      } as any);
    });
  }
}
