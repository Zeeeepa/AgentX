/**
 * @agentxjs/server
 *
 * AgentX Server - WebSocket server with Provider support.
 *
 * @example
 * ```typescript
 * import { createServer } from "@agentxjs/server";
 * import { nodeProvider } from "@agentxjs/node-provider";
 * import { createMonoDriver } from "@agentxjs/mono-driver";
 *
 * const server = await createServer({
 *   provider: nodeProvider({ dataPath: "./data" }),
 *   createDriver: createMonoDriver,
 *   port: 5200,
 * });
 *
 * await server.listen();
 * console.log("Server listening on ws://localhost:5200");
 * ```
 */

export { createServer, type ServerConfig } from "./Server";
export type { AgentXServer } from "./types";
export { CommandHandler } from "./CommandHandler";
