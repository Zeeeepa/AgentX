/**
 * agentxjs - Unified API for AI Agents
 *
 * @example
 * ```typescript
 * // Server (Source mode)
 * import { createAgentX, defineAgent } from "agentxjs";
 *
 * const config = defineAgent({ name: "Assistant", systemPrompt: "You are helpful" });
 * const agentx = createAgentX();
 * const container = await agentx.containers.create();
 * const agent = await agentx.agents.run(container.id, config);
 *
 * // Browser (Mirror mode)
 * import { createAgentX, defineAgent } from "agentxjs";
 *
 * const agentx = createAgentX({ serverUrl: "ws://localhost:5200" });
 * ```
 *
 * @packageDocumentation
 */

export { createAgentX } from "./createAgentX";
export { defineAgent } from "./defineAgent";
export { isMirrorConfig, isSourceConfig } from "./typeGuards";

// Re-export types
export type {
  AgentX,
  AgentXConfig,
  SourceConfig,
  MirrorConfig,
  AgentDefinition,
  AgentConfig,
  Agent,
  AgentImage,
  Container,
  ContainersAPI,
  AgentsAPI,
  ImagesAPI,
  Unsubscribe,
} from "@agentxjs/types/agentx";
