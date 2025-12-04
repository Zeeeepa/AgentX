/**
 * defineAgent - Create an agent definition
 *
 * @example
 * ```typescript
 * const MyAgent = defineAgent({
 *   name: "Assistant",
 *   systemPrompt: "You are helpful",
 * });
 *
 * agentx.definitions.register(MyAgent);
 * ```
 */

import type { AgentDefinition, DefineAgentInput } from "@agentxjs/types";

/**
 * defineAgent - Define an agent template
 *
 * @param input - Agent definition input
 * @returns Agent definition
 */
export function defineAgent(input: DefineAgentInput): AgentDefinition {
  return {
    name: input.name,
    description: input.description,
    systemPrompt: input.systemPrompt,
  };
}
