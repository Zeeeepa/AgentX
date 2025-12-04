/**
 * RuntimeAPIImpl - Implementation of RuntimeAPI
 *
 * Manages runtime operations: events, containers, sessions, agents.
 * TODO: Full implementation pending - this is a skeleton.
 */

import type {
  RuntimeAPI,
  ContainerInfo,
  Runtime,
  Persistence,
  Session,
  Agent,
  RuntimeEvent,
  Unsubscribe,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("agentx/RuntimeAPI");

/**
 * RuntimeAPIImpl - Implementation of RuntimeAPI
 */
export class RuntimeAPIImpl implements RuntimeAPI {
  private agents = new Map<string, Agent>();
  private readonly runtime: Runtime;
  private readonly persistence: Persistence;

  constructor(runtime: Runtime, persistence: Persistence) {
    this.runtime = runtime;
    this.persistence = persistence;
  }

  // Expose for future implementation
  protected getRuntime(): Runtime {
    return this.runtime;
  }

  protected getPersistence(): Persistence {
    return this.persistence;
  }

  // ==================== Event Subscription ====================

  on<T extends RuntimeEvent["type"]>(
    type: T,
    _handler: (event: Extract<RuntimeEvent, { type: T }>) => void
  ): Unsubscribe {
    // TODO: Implement event subscription via runtime
    logger.debug("Event subscription", { type });
    return () => {};
  }

  onAll(_handler: (event: RuntimeEvent) => void): Unsubscribe {
    // TODO: Implement
    return () => {};
  }

  // ==================== Container Lifecycle ====================

  async createContainer(_name?: string): Promise<ContainerInfo> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async getContainer(_containerId: string): Promise<ContainerInfo | undefined> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async listContainers(): Promise<ContainerInfo[]> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async deleteContainer(_containerId: string): Promise<boolean> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  // ==================== Session Lifecycle ====================

  async createSession(_imageId: string, _containerId?: string): Promise<Session> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async getSession(_sessionId: string): Promise<Session | undefined> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async listSessions(): Promise<Session[]> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async listSessionsByContainer(_containerId: string): Promise<Session[]> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async deleteSession(_sessionId: string): Promise<boolean> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  // ==================== Agent Lifecycle ====================

  async run(_imageId: string, _containerId?: string): Promise<Agent> {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async destroyAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      // TODO: Cleanup agent resources
      this.agents.delete(agentId);
      logger.info("Agent destroyed", { agentId });
    }
  }

  async destroyAllAgents(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());
    for (const agentId of agentIds) {
      await this.destroyAgent(agentId);
    }
  }
}
