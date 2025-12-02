/**
 * AgentX - Platform API Implementation
 *
 * The central entry point for all agent operations.
 * Runtime determines the execution environment (Node.js, Browser, etc.)
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { runtime } from "agentxjs-runtime";
 *
 * const agentx = createAgentX(runtime);
 * const agent = agentx.agents.create(definition, { apiKey: "xxx" });
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

const logger = createLogger("agentx/AgentX");

/**
 * Create AgentX instance with Runtime
 *
 * @param runtime - Runtime provides infrastructure (Container, Sandbox, Driver)
 * @returns AgentX instance
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { runtime } from "agentxjs-runtime";
 *
 * const agentx = createAgentX(runtime);
 * const agent = agentx.agents.create(definition, { apiKey: "xxx" });
 * ```
 */
export function createAgentX(runtime: Runtime): AgentX {
  logger.info("Creating AgentX instance", { runtime: runtime.name });

  // Check repository
  if (!runtime.repository) {
    throw new Error("Runtime must have a repository for persistence");
  }

  // Create managers
  const errorManager = new ErrorManager();
  const definitionManager = new DefinitionManagerImpl(runtime.repository);
  const agentManager = new AgentManager(runtime);

  // Create image manager with repository and container (for images.run())
  const imageManager = new ImageManagerImpl(runtime.repository, runtime.container);

  // Create session manager with repository and container (for session.resume())
  const sessionManager = new SessionManagerImpl(runtime.repository, runtime.container);

  logger.debug("AgentX instance created", { runtime: runtime.name });

  return {
    mode: "local",
    definitions: definitionManager,
    images: imageManager,
    agents: agentManager,
    sessions: sessionManager,
    errors: errorManager,
  };
}
