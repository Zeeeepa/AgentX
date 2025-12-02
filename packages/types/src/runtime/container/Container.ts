/**
 * Container - Agent Lifecycle Manager
 *
 * Single point for all Agent lifecycle operations.
 * Abstracts platform-specific implementations.
 *
 * See index.ts for full design documentation.
 */

import type { Agent } from "../../agent";
import type { AgentImage } from "../../image";
import type { Session } from "../../session";

/**
 * Container - Agent runtime container
 *
 * Manages Agent lifecycle: creation, resume, destruction.
 * Different implementations for different platforms:
 * - NodeContainer: Server-side, creates real Drivers
 * - BrowserContainer: Client-side, uses SSE to server
 */
export interface Container {
  /** Container identifier */
  readonly id: string;

  /**
   * Run a new agent from image (like `docker run`)
   *
   * Creates a fresh agent with no conversation history.
   *
   * @param image - Agent image containing definition and config
   * @returns Running agent instance
   */
  run(image: AgentImage): Promise<Agent>;

  /**
   * Resume an agent from session (like `docker start`)
   *
   * Restores agent with conversation history.
   * Implementation handles SDK-specific resume mechanisms internally:
   * - Claude SDK: Uses sdkSessionId for native resume
   * - OpenAI: Injects messages array
   * - Others: Platform-specific
   *
   * @param session - Session containing imageId and context
   * @returns Running agent instance with history restored
   */
  resume(session: Session): Promise<Agent>;

  /**
   * Destroy an agent (like `docker stop/rm`)
   *
   * Cleans up agent resources via agent.destroy().
   *
   * @param agentId - Agent identifier
   */
  destroy(agentId: string): Promise<void>;

  /**
   * Get agent by ID (like `docker inspect`)
   */
  get(agentId: string): Agent | undefined;

  /**
   * Check if agent exists
   */
  has(agentId: string): boolean;

  /**
   * List all running agents (like `docker ps`)
   */
  list(): Agent[];

  /**
   * Destroy all agents
   */
  destroyAll(): Promise<void>;
}
