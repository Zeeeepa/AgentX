/**
 * AgentX - Unified AI Agent Platform
 *
 * "Define Once, Run Anywhere"
 *
 * @example
 * ```typescript
 * // Node.js - full control
 * import { createAgentX } from "agentxjs";
 * import { nodeRuntime, SQLiteRepository } from "@agentxjs/node-runtime";
 *
 * const agentx = createAgentX(nodeRuntime(), new SQLiteRepository("./data.db"));
 *
 * // Browser - mirror mode
 * import { createMirror } from "agentxjs";
 *
 * const agentx = createMirror({ serverUrl: "http://localhost:5200" });
 * ```
 *
 * @packageDocumentation
 */

// Factory functions
export { createAgentX } from "./createAgentX";
export { createMirror } from "./createMirror";

// Re-export types from @agentxjs/types
export type {
  AgentX,
  DefinitionAPI,
  ImageAPI,
  RuntimeAPI,
  MirrorOptions,
  DefineAgentInput,
} from "@agentxjs/types";

// Re-export defineAgent
export { defineAgent } from "./defineAgent";
