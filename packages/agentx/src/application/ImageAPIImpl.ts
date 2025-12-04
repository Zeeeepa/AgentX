/**
 * ImageAPIImpl - Implementation of ImageAPI
 *
 * Manages agent images (MetaImage and DerivedImage).
 */

import type {
  ImageAPI,
  AgentImage,
  MetaImage,
  Persistence,
  ImageRecord,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/ImageAPI");

/**
 * Generate MetaImage ID from definition name
 */
function generateMetaImageId(definitionName: string): string {
  return `meta:${definitionName}`;
}

/**
 * Convert ImageRecord to AgentImage
 *
 * Note: ImageRecord stores serialized data (Record<string, unknown>),
 * while AgentImage has typed fields. We cast through unknown for flexibility.
 */
function toAgentImage(record: ImageRecord): AgentImage {
  if (record.type === "meta") {
    return {
      type: "meta",
      imageId: record.imageId,
      definitionName: record.definitionName,
      definition: record.definition,
      config: record.config,
      messages: [],
      createdAt: record.createdAt,
    } as unknown as MetaImage;
  } else {
    return {
      type: "derived",
      imageId: record.imageId,
      definitionName: record.definitionName,
      parentImageId: record.parentImageId!,
      definition: record.definition,
      config: record.config,
      messages: record.messages,
      createdAt: record.createdAt,
    } as unknown as AgentImage;
  }
}

/**
 * ImageAPIImpl - Implementation of ImageAPI
 */
export class ImageAPIImpl implements ImageAPI {
  constructor(private readonly persistence: Persistence) {}

  async get(imageId: string): Promise<AgentImage | undefined> {
    const record = await this.persistence.images.findImageById(imageId);
    if (!record) {
      return undefined;
    }
    return toAgentImage(record);
  }

  async getMetaImage(definitionName: string): Promise<MetaImage | undefined> {
    const metaImageId = generateMetaImageId(definitionName);
    const record = await this.persistence.images.findImageById(metaImageId);
    if (!record || record.type !== "meta") {
      return undefined;
    }
    return toAgentImage(record) as MetaImage;
  }

  async list(): Promise<AgentImage[]> {
    const records = await this.persistence.images.findAllImages();
    return records.map(toAgentImage);
  }

  async listByDefinition(definitionName: string): Promise<AgentImage[]> {
    const records = await this.persistence.images.findImagesByDefinitionName(definitionName);
    return records.map(toAgentImage);
  }

  async exists(imageId: string): Promise<boolean> {
    return this.persistence.images.imageExists(imageId);
  }

  async delete(imageId: string): Promise<boolean> {
    // Check if image exists
    const record = await this.persistence.images.findImageById(imageId);
    if (!record) {
      return false;
    }

    // Cannot delete MetaImage directly
    if (record.type === "meta") {
      logger.warn("Cannot delete MetaImage directly", { imageId });
      return false;
    }

    await this.persistence.images.deleteImage(imageId);
    logger.info("Image deleted", { imageId });
    return true;
  }
}
