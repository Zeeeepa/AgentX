/**
 * AgentManager - Running agent query and management
 *
 * Docker-style design: Agent creation happens via ContainerManager.run() or ContainerManager.resume(),
 * NOT via AgentManager. AgentManager only queries and manages running agents.
 *
 * All operations delegate to ContainerManager.
 */

import type { AgentManager as IAgentManager, Agent, ContainerManager } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/AgentManager");

/**
 * Agent query manager implementation
 *
 * Delegates all operations to ContainerManager.
 */
export class AgentManager implements IAgentManager {
  constructor(private readonly containerManager: ContainerManager) {}

  /**
   * Get an existing agent by ID
   */
  get(agentId: string): Agent | undefined {
    return this.containerManager.getAgent(agentId);
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.containerManager.hasAgent(agentId);
  }

  /**
   * List all agents
   */
  list(): Agent[] {
    return this.containerManager.listAgents();
  }

  /**
   * Destroy an agent by ID
   */
  async destroy(agentId: string): Promise<void> {
    logger.debug("Destroying agent", { agentId });
    await this.containerManager.destroyAgent(agentId);
    logger.info("Agent destroyed", { agentId });
  }

  /**
   * Destroy all agents
   */
  async destroyAll(): Promise<void> {
    const agents = this.containerManager.listAgents();
    logger.debug("Destroying all agents", { count: agents.length });
    await this.containerManager.destroyAllAgents();
    logger.info("All agents destroyed", { count: agents.length });
  }
}
