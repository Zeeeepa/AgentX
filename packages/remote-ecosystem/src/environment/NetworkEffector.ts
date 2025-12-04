/**
 * NetworkEffector - Bridges SystemBus to Channel
 *
 * Subscribes to SystemBus events and sends to Channel.
 * Converts Ecosystem layer (Effector) to Network layer (Channel).
 */

import type { Effector, SystemBus, Channel } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ecosystem/NetworkEffector");

/**
 * Event types that should be sent to remote
 */
const OUTBOUND_EVENT_TYPES = [
  "user_message",
  "interrupt",
];

/**
 * NetworkEffector - SystemBus → Channel
 */
export class NetworkEffector implements Effector {
  private readonly channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  /**
   * Subscribe to SystemBus and forward events to Channel
   */
  subscribe(bus: SystemBus): void {
    logger.debug("NetworkEffector connecting SystemBus to Channel");

    // Subscribe to outbound event types
    bus.on(OUTBOUND_EVENT_TYPES, (event) => {
      if (this.channel.state !== "connected") {
        logger.warn("Channel not connected, cannot send event", {
          type: event.type,
          state: this.channel.state,
        });
        return;
      }

      logger.debug("SystemBus event → Channel", { type: event.type });
      this.channel.send(event as any);
    });
  }
}
