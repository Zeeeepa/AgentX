/**
 * Network Module - Network Ecosystem types
 *
 * Network is the outermost Ecosystem layer, managing:
 * - Server: Listens for connections, creates Runtimes
 * - Client: Connects to server, gets Runtime proxy
 * - Channel: Bidirectional communication
 * - Endpoint: HTTP API contracts
 */

export * from "./channel";
export * from "./server";
export * from "./endpoint";
// client/ is empty for now
