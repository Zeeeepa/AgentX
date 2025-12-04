/**
 * DefinitionAPI - Agent definition registry
 *
 * Application API for managing agent definitions (static resources).
 *
 * @example
 * ```typescript
 * // Register definition
 * await agentx.definitions.register(TranslatorDef);
 *
 * // Get definition
 * const def = await agentx.definitions.get("Translator");
 *
 * // List all definitions
 * const defs = await agentx.definitions.list();
 * ```
 */

import type { AgentDefinition } from "~/application/definition";

/**
 * DefinitionAPI - Registry for agent definitions
 */
export interface DefinitionAPI {
  /**
   * Register an agent definition
   *
   * @param definition - Agent definition to register
   * @throws Error if definition with same name already exists
   */
  register(definition: AgentDefinition): Promise<void>;

  /**
   * Get a definition by name
   *
   * @param name - Definition name
   * @returns Definition or undefined if not found
   */
  get(name: string): Promise<AgentDefinition | undefined>;

  /**
   * List all registered definitions
   *
   * @returns Array of all definitions
   */
  list(): Promise<AgentDefinition[]>;

  /**
   * Check if a definition exists
   *
   * @param name - Definition name
   * @returns true if exists
   */
  has(name: string): Promise<boolean>;

  /**
   * Unregister a definition
   *
   * @param name - Definition name
   * @returns true if removed, false if not found
   */
  unregister(name: string): Promise<boolean>;
}
