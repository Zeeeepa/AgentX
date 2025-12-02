/**
 * DefinitionManagerImpl - Repository-based implementation of DefinitionManager
 *
 * Part of Docker-style layered architecture:
 * AgentFile/Code → register → Definition → MetaImage → Session → Agent
 *
 * This implementation:
 * - Stores definitions via Repository (in-memory by default)
 * - Auto-creates MetaImage when definition is registered
 * - Maintains local cache for sync access (register/get/list are sync)
 */

import type {
  DefinitionManager,
  AgentDefinition,
  Repository,
  ImageRecord,
  DefinitionRecord,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/DefinitionManager");

/**
 * Generate MetaImage ID from definition name
 */
function generateMetaImageId(definitionName: string): string {
  return `meta_${definitionName}`;
}

/**
 * Convert AgentDefinition to DefinitionRecord
 */
function toDefinitionRecord(definition: AgentDefinition): DefinitionRecord {
  const now = new Date();
  return {
    name: definition.name,
    description: definition.description,
    systemPrompt: definition.systemPrompt,
    definition: definition as unknown as Record<string, unknown>,
    source: "code",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * DefinitionManager implementation using Repository
 */
export class DefinitionManagerImpl implements DefinitionManager {
  // Local cache for sync access
  private cache = new Map<string, AgentDefinition>();

  constructor(private readonly repository: Repository) {}

  register(definition: AgentDefinition): void {
    if (this.cache.has(definition.name)) {
      throw new Error(`Definition already exists: ${definition.name}`);
    }

    // Store in local cache (sync)
    this.cache.set(definition.name, definition);

    // Store in repository (async, fire-and-forget)
    const definitionRecord = toDefinitionRecord(definition);
    this.repository.saveDefinition(definitionRecord).catch((err) => {
      logger.error("Failed to save definition", { name: definition.name, error: err });
    });

    // Auto-create MetaImage
    const metaImageId = generateMetaImageId(definition.name);
    const imageRecord: ImageRecord = {
      imageId: metaImageId,
      type: "meta",
      definitionName: definition.name,
      parentImageId: null,
      definition: definition as unknown as Record<string, unknown>,
      config: {},
      messages: [],
      createdAt: new Date(),
    };

    // Save MetaImage to repository (async, fire-and-forget)
    this.repository.saveImage(imageRecord).catch((err) => {
      logger.error("Failed to save MetaImage", { definitionName: definition.name, error: err });
    });

    logger.info("Definition registered", {
      name: definition.name,
      metaImageId,
    });
  }

  get(name: string): AgentDefinition | undefined {
    return this.cache.get(name);
  }

  list(): AgentDefinition[] {
    return Array.from(this.cache.values());
  }

  has(name: string): boolean {
    return this.cache.has(name);
  }

  unregister(name: string): boolean {
    const definition = this.cache.get(name);
    if (!definition) {
      return false;
    }

    // Remove from local cache
    this.cache.delete(name);

    // Remove from repository (async, fire-and-forget)
    this.repository.deleteDefinition(name).catch((err) => {
      logger.error("Failed to delete definition", { name, error: err });
    });

    // Remove associated MetaImage
    const metaImageId = generateMetaImageId(name);
    this.repository.deleteImage(metaImageId).catch((err) => {
      logger.error("Failed to delete MetaImage", { definitionName: name, error: err });
    });

    logger.info("Definition unregistered", { name });
    return true;
  }
}
