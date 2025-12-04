/**
 * NetworkEnvironment - Environment backed by Network Channel
 *
 * Bridges Network layer (Channel) to Ecosystem layer (Environment).
 * Uses NetworkReceptor and NetworkEffector for bidirectional communication.
 */

import type { Environment, Receptor, Effector, Channel } from "@agentxjs/types";
import { NetworkReceptor } from "./NetworkReceptor";
import { NetworkEffector } from "./NetworkEffector";

/**
 * NetworkEnvironment - Channel-backed Environment
 */
export class NetworkEnvironment implements Environment {
  readonly name = "network";
  readonly receptor: Receptor;
  readonly effector: Effector;

  constructor(channel: Channel) {
    this.receptor = new NetworkReceptor(channel);
    this.effector = new NetworkEffector(channel);
  }
}
