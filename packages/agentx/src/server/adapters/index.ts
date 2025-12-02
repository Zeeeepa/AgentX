/**
 * Framework Adapters
 *
 * Adapters to integrate AgentXHandler with various web frameworks.
 *
 * @example
 * ```typescript
 * // Express
 * import { toExpressHandler } from "agentxjs/server/adapters/express";
 * app.use("/agentx", toExpressHandler(handler));
 *
 * // Hono
 * import { toHonoHandler } from "agentxjs/server/adapters/hono";
 * app.all("/agentx/*", toHonoHandler(handler));
 *
 * // Next.js
 * import { createNextHandler } from "agentxjs/server/adapters/next";
 * export const { GET, POST, DELETE } = createNextHandler(handler);
 * ```
 *
 * @packageDocumentation
 */

// Express adapter
export { toExpressHandler, createExpressAdapter, type ExpressHandler } from "./express";

// Hono adapter
export { toHonoHandler, createHonoRoutes, createHonoAdapter, type HonoHandler } from "./hono";

// Next.js adapter
export {
  createNextHandler,
  toNextHandler,
  createNextEdgeHandler,
  createAgentXRoutes,
  type NextRouteHandler,
  type NextRouteHandlers,
} from "./next";
