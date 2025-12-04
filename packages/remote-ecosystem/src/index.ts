/**
 * @agentxjs/remote-ecosystem
 *
 * Remote Ecosystem for AgentX - Network-backed Ecosystem factory
 *
 * Bridges Network layer (Channel) to Ecosystem layer (SystemBus + Environment).
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
 * ecosystem.bus.on("text_chunk", (e) => {
 *   console.log(e.data.text);
 * });
 * ```
 */

// Main factory
export { RemoteEcosystem, remoteEcosystem, type RemoteEcosystemConfig } from "./RemoteEcosystem";

// Environment bridge (Network → Ecosystem)
export { NetworkEnvironment, NetworkReceptor, NetworkEffector } from "./environment";

// SystemBus implementation
export { SystemBusImpl } from "./SystemBusImpl";
