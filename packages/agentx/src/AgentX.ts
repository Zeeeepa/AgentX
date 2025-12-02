/**
 * AgentX - Platform API Implementation
 *
 * The central entry point for all agent operations.
 * Runtime determines the execution environment (Node.js, Browser, etc.)
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { nodeRuntime } from "agentxjs-runtime";
 *
 * const agentx = createAgentX(nodeRuntime());
 *
 * // Simple usage (auto-created default container)
 * const agent = await agentx.images.run(imageId);
 *
 * // Multi-tenant usage (explicit container)
 * const container = await agentx.containers.create();
 * const agent = await agentx.images.run(imageId, { containerId: container.containerId });
 * ```
 */

import type { AgentX, Runtime } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";
import {
  AgentManager,
  SessionManagerImpl,
  ErrorManager,
  DefinitionManagerImpl,
  ImageManagerImpl,
} from "./managers";
import { ContainerManagerImpl } from "./container";

const logger = createLogger("agentx/AgentX");

/**
 * AgentX creation options
 */
export interface CreateAgentXOptions {
  /**
   * Default container ID to use for operations
   * If not provided, a default container will be auto-created
   */
  containerId?: string;
}

/**
 * Create AgentX instance with Runtime
 *
 * @param runtime - Runtime provides infrastructure (createSandbox, createDriver, repository)
 * @param options - Optional configuration
 * @returns AgentX instance
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { nodeRuntime } from "agentxjs-runtime";
 *
 * // Simple usage - auto-creates default container
 * const agentx = createAgentX(nodeRuntime());
 *
 * // Multi-tenant - specify container
 * const agentx = createAgentX(nodeRuntime(), { containerId: "tenant_123" });
 * ```
 */
export function createAgentX(runtime: Runtime, options?: CreateAgentXOptions): AgentX {
  logger.info("Creating AgentX instance", { runtime: runtime.name });

  // Check repository
  if (!runtime.repository) {
    throw new Error("Runtime must have a repository for persistence");
  }

  const repository = runtime.repository;

  // Create container manager
  const containerManager = new ContainerManagerImpl(runtime, repository);

  // Create other managers
  const errorManager = new ErrorManager();
  const definitionManager = new DefinitionManagerImpl(repository);
  const agentManager = new AgentManager(containerManager);

  // Create image manager with repository and container manager
  const imageManager = new ImageManagerImpl(repository, containerManager, options?.containerId);

  // Create session manager with repository and container manager
  const sessionManager = new SessionManagerImpl(repository, containerManager, options?.containerId);

  logger.debug("AgentX instance created", { runtime: runtime.name });

  return {
    mode: "local",
    containers: containerManager,
    definitions: definitionManager,
    images: imageManager,
    agents: agentManager,
    sessions: sessionManager,
    errors: errorManager,
  };
}
