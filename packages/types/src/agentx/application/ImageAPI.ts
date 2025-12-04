/**
 * ImageAPI - Agent image management
 *
 * Application API for managing images (static resources).
 *
 * Image lifecycle:
 * - MetaImage: Auto-created when definition is registered
 * - DerivedImage: Created from session.commit()
 *
 * @example
 * ```typescript
 * // Get MetaImage for a definition
 * const metaImage = await agentx.images.getMetaImage("Translator");
 *
 * // List all images
 * const images = await agentx.images.list();
 *
 * // Delete a derived image
 * await agentx.images.delete(derivedImageId);
 * ```
 */

import type { AgentImage, MetaImage } from "~/application/image";

/**
 * ImageAPI - Registry for agent images
 */
export interface ImageAPI {
  /**
   * Get an image by ID
   *
   * @param imageId - Image identifier
   * @returns Image or undefined if not found
   */
  get(imageId: string): Promise<AgentImage | undefined>;

  /**
   * Get the MetaImage for a definition
   *
   * MetaImage is auto-created when a definition is registered.
   *
   * @param definitionName - Definition name
   * @returns MetaImage or undefined if definition not found
   */
  getMetaImage(definitionName: string): Promise<MetaImage | undefined>;

  /**
   * List all images
   *
   * @returns Array of all images (MetaImages and DerivedImages)
   */
  list(): Promise<AgentImage[]>;

  /**
   * List images by definition name
   *
   * @param definitionName - Definition name
   * @returns Array of images for the definition
   */
  listByDefinition(definitionName: string): Promise<AgentImage[]>;

  /**
   * Check if an image exists
   *
   * @param imageId - Image identifier
   * @returns true if exists
   */
  exists(imageId: string): Promise<boolean>;

  /**
   * Delete a derived image
   *
   * Note: MetaImages cannot be deleted directly.
   * They are removed when the definition is unregistered.
   *
   * @param imageId - Image identifier
   * @returns true if deleted, false if not found or is MetaImage
   */
  delete(imageId: string): Promise<boolean>;
}
