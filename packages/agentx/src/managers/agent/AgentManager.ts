/**
 * AgentManager - Running agent query and management
 *
 * Docker-style design: Agent creation happens via Container.run() or Container.resume(),
 * NOT via AgentManager. AgentManager only queries and manages running agents.
 *
 * All operations delegate to Container.
 */

import type { AgentManager as IAgentManager, Agent, Runtime } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/AgentManager");

/**
 * Agent query manager implementation
 *
 * Delegates all operations to Runtime.container.
 */
export class AgentManager implements IAgentManager {
  constructor(private readonly runtime: Runtime) {}

  /**
   * Get an existing agent by ID
   */
  get(agentId: string): Agent | undefined {
    return this.runtime.container.get(agentId);
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.runtime.container.has(agentId);
  }

  /**
   * List all agents
   */
  list(): Agent[] {
    return this.runtime.container.list();
  }

  /**
   * Destroy an agent by ID
   */
  async destroy(agentId: string): Promise<void> {
    logger.debug("Destroying agent", { agentId });
    await this.runtime.container.destroy(agentId);
    logger.info("Agent destroyed", { agentId });
  }

  /**
   * Destroy all agents
   */
  async destroyAll(): Promise<void> {
    const agents = this.runtime.container.list();
    logger.debug("Destroying all agents", { count: agents.length });
    await this.runtime.container.destroyAll();
    logger.info("All agents destroyed", { count: agents.length });
  }
}
