/**
 * Type guards for AgentXConfig
 */

import type { AgentXConfig, MirrorConfig, SourceConfig } from "@agentxjs/types/agentx";

/**
 * Check if config is MirrorConfig
 */
export function isMirrorConfig(config: AgentXConfig): config is MirrorConfig {
  return "serverUrl" in config && typeof config.serverUrl === "string";
}

/**
 * Check if config is SourceConfig
 */
export function isSourceConfig(config: AgentXConfig): config is SourceConfig {
  return !isMirrorConfig(config);
}
