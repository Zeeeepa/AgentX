/**
 * createAgentX - Factory function for creating AgentX instances
 */

import type { AgentX, Runtime, Persistence } from "@agentxjs/types";
import { DefinitionAPIImpl, ImageAPIImpl } from "./application";
import { RuntimeAPIImpl } from "./runtime";

/**
 * createAgentX - Create an AgentX instance
 *
 * @param runtime - Runtime for event handling
 * @param persistence - Persistence for data storage
 * @returns AgentX instance
 */
export function createAgentX(runtime: Runtime, persistence: Persistence): AgentX {
  const definitions = new DefinitionAPIImpl(persistence);
  const images = new ImageAPIImpl(persistence);
  const runtimeAPI = new RuntimeAPIImpl(runtime, persistence);

  return {
    definitions,
    images,
    runtime: runtimeAPI,
    dispose() {
      // Cleanup resources
      runtimeAPI.destroyAllAgents();
    },
  };
}
