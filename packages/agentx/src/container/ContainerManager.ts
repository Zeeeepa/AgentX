/**
 * ContainerManager - Container lifecycle and Agent runtime management
 *
 * ContainerManager is a logical concept at AgentX layer that:
 * 1. Manages Container lifecycle (create, delete, list)
 * 2. Runs Agents within Containers (run, resume)
 * 3. Tracks running Agents
 *
 * Architecture:
 * ```
 * AgentX Layer
 * ├── ContainerManager (this)
 * │   ├── Container lifecycle (create/delete/list)
 * │   └── Agent runtime (run/resume/destroy)
 * │
 * Runtime Layer
 * ├── createSandbox(containerId) → Sandbox
 * ├── createDriver(definition, context, sandbox) → Driver
 * └── repository → persistence
 * ```
 *
 * Multi-tenant usage:
 * ```typescript
 * // Application layer maps tenant → containerId
 * const container = await agentx.containers.create();
 * const agent = await agentx.containers.run(image, container.containerId);
 * ```
 */

import type { Agent, AgentImage, Session, ContainerRecord, ContainerConfig } from "@agentxjs/types";

/**
 * ContainerManager - Manages containers and agent runtime
 */
export interface ContainerManager {
  // ==================== Container Lifecycle ====================

  /**
   * Create a new container
   *
   * @param config - Optional container configuration
   * @returns Created container record with auto-generated containerId
   */
  create(config?: ContainerConfig): Promise<ContainerRecord>;

  /**
   * Get container by ID
   */
  get(containerId: string): Promise<ContainerRecord | null>;

  /**
   * List all containers
   */
  list(): Promise<ContainerRecord[]>;

  /**
   * Delete a container
   *
   * @param containerId - Container to delete
   * @returns true if deleted, false if not found
   */
  delete(containerId: string): Promise<boolean>;

  /**
   * Check if container exists
   */
  exists(containerId: string): Promise<boolean>;

  // ==================== Agent Runtime ====================

  /**
   * Run a new agent from image within a container
   *
   * Like `docker run`: creates a fresh agent with no history.
   *
   * @param image - Agent image to run
   * @param containerId - Container to run in
   * @returns Running agent instance
   */
  run(image: AgentImage, containerId: string): Promise<Agent>;

  /**
   * Resume an agent from session within a container
   *
   * Like `docker start`: restores agent with conversation history.
   *
   * @param session - Session to resume
   * @param containerId - Container to run in
   * @returns Running agent instance with history
   */
  resume(session: Session, containerId: string): Promise<Agent>;

  /**
   * Destroy a running agent
   *
   * @param agentId - Agent to destroy
   */
  destroyAgent(agentId: string): Promise<void>;

  /**
   * Get a running agent by ID
   */
  getAgent(agentId: string): Agent | undefined;

  /**
   * Check if agent is running
   */
  hasAgent(agentId: string): boolean;

  /**
   * List all running agents
   */
  listAgents(): Agent[];

  /**
   * Destroy all running agents
   */
  destroyAllAgents(): Promise<void>;
}
