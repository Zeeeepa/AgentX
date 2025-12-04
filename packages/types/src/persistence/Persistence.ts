/**
 * Persistence - Unified storage interface
 *
 * Symmetric with Runtime:
 * - Runtime: event handling
 * - Persistence: data storage
 *
 * @example
 * ```typescript
 * // Access via domain-specific repositories
 * await persistence.definitions.save(record);
 * await persistence.images.findById(imageId);
 * await persistence.sessions.findByContainerId(containerId);
 * ```
 */

import type { DefinitionRepository } from "./DefinitionRepository";
import type { ImageRepository } from "./ImageRepository";
import type { ContainerRepository } from "./ContainerRepository";
import type { SessionRepository } from "./SessionRepository";

/**
 * Persistence - Unified storage interface with domain-specific access
 */
export interface Persistence {
  /**
   * Definition storage operations
   */
  readonly definitions: DefinitionRepository;

  /**
   * Image storage operations
   */
  readonly images: ImageRepository;

  /**
   * Container storage operations
   */
  readonly containers: ContainerRepository;

  /**
   * Session storage operations
   */
  readonly sessions: SessionRepository;
}
