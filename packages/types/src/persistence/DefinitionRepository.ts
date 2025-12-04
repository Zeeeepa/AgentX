/**
 * DefinitionRepository - Persistence interface for agent definitions
 */

import type { DefinitionRecord } from "./record/DefinitionRecord";

/**
 * DefinitionRepository - Storage operations for definitions
 */
export interface DefinitionRepository {
  /**
   * Save a definition record (create or update)
   */
  saveDefinition(record: DefinitionRecord): Promise<void>;

  /**
   * Find definition by name
   */
  findDefinitionByName(name: string): Promise<DefinitionRecord | null>;

  /**
   * Find all definitions
   */
  findAllDefinitions(): Promise<DefinitionRecord[]>;

  /**
   * Delete definition by name
   */
  deleteDefinition(name: string): Promise<void>;

  /**
   * Check if definition exists
   */
  definitionExists(name: string): Promise<boolean>;
}
