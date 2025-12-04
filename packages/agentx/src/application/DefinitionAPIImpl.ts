/**
 * DefinitionAPIImpl - Implementation of DefinitionAPI
 *
 * Manages agent definitions and auto-creates MetaImage on register.
 */

import type {
  DefinitionAPI,
  AgentDefinition,
  Persistence,
  DefinitionRecord,
  ImageRecord,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/DefinitionAPI");

/**
 * Generate MetaImage ID from definition name
 */
function generateMetaImageId(definitionName: string): string {
  return `meta:${definitionName}`;
}

/**
 * Convert AgentDefinition to DefinitionRecord
 */
function toDefinitionRecord(definition: AgentDefinition): DefinitionRecord {
  const now = Date.now();
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
 * DefinitionAPIImpl - Implementation of DefinitionAPI
 */
export class DefinitionAPIImpl implements DefinitionAPI {
  constructor(private readonly persistence: Persistence) {}

  async register(definition: AgentDefinition): Promise<void> {
    // Check if already exists
    const exists = await this.persistence.definitions.definitionExists(definition.name);
    if (exists) {
      throw new Error(`Definition already exists: ${definition.name}`);
    }

    // Save definition
    const record = toDefinitionRecord(definition);
    await this.persistence.definitions.saveDefinition(record);

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
      createdAt: Date.now(),
    };
    await this.persistence.images.saveImage(imageRecord);

    logger.info("Definition registered", {
      name: definition.name,
      metaImageId,
    });
  }

  async get(name: string): Promise<AgentDefinition | undefined> {
    const record = await this.persistence.definitions.findDefinitionByName(name);
    if (!record) {
      return undefined;
    }
    return record.definition as unknown as AgentDefinition;
  }

  async list(): Promise<AgentDefinition[]> {
    const records = await this.persistence.definitions.findAllDefinitions();
    return records.map((r) => r.definition as unknown as AgentDefinition);
  }

  async has(name: string): Promise<boolean> {
    return this.persistence.definitions.definitionExists(name);
  }

  async unregister(name: string): Promise<boolean> {
    const exists = await this.persistence.definitions.definitionExists(name);
    if (!exists) {
      return false;
    }

    // Delete definition
    await this.persistence.definitions.deleteDefinition(name);

    // Delete associated MetaImage
    const metaImageId = generateMetaImageId(name);
    await this.persistence.images.deleteImage(metaImageId);

    logger.info("Definition unregistered", { name });
    return true;
  }
}
