/**
 * @agentxjs/server
 *
 * AgentX Server - WebSocket server with Provider support.
 *
 * @example
 * ```typescript
 * import { createServer } from "@agentxjs/server";
 * import { nodeProvider } from "@agentxjs/node-provider";
 * import { claudeDriver } from "@agentxjs/claude-driver";
 *
 * const server = await createServer({
 *   provider: nodeProvider({
 *     dataPath: "./data",
 *     driver: claudeDriver({ apiKey: process.env.ANTHROPIC_API_KEY }),
 *   }),
 *   port: 5200,
 * });
 *
 * await server.listen();
 * console.log("Server listening on ws://localhost:5200");
 *
 * // Attach to existing HTTP server
 * import { createServer as createHttpServer } from "node:http";
 *
 * const httpServer = createHttpServer();
 * const agentxServer = await createServer({
 *   provider: nodeProvider({ ... }),
 *   server: httpServer,
 *   wsPath: "/ws",
 * });
 *
 * httpServer.listen(3000);
 * ```
 */

export { createServer, type ServerConfig } from "./Server";
export type { AgentXServer } from "./types";
export { CommandHandler } from "./CommandHandler";
