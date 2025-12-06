/**
 * defineAgent - Convert AgentDefinition to AgentConfig
 */

import type { AgentDefinition, AgentConfig } from "@agentxjs/types/agentx";

/**
 * Define an agent configuration
 *
 * @param definition - Agent definition
 * @returns Agent configuration for running
 */
export function defineAgent(definition: AgentDefinition): AgentConfig {
  return {
    name: definition.name,
    systemPrompt: definition.systemPrompt,
    description: definition.description,
  };
}
