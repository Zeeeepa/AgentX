/**
 * RuntimeAPI - Dynamic instance management and event subscription
 *
 * Provides:
 * - Global event subscription for all runtime events
 * - Container/Session/Agent lifecycle management
 *
 * @example
 * ```typescript
 * // Global event listening
 * agentx.runtime.on("session_created", (e) => {
 *   console.log("New session:", e.sessionId);
 * });
 * agentx.runtime.on("text_delta", (e) => {
 *   console.log("Agent", e.agentId, "says:", e.data.text);
 * });
 *
 * // Create session and run agent
 * const session = await agentx.runtime.createSession(imageId);
 * const agent = await session.resume();
 *
 * // Instance-level events (only this agent)
 * agent.on("text_delta", (e) => process.stdout.write(e.data.text));
 * await agent.receive("Hello!");
 * ```
 */

import type { Session } from "~/runtime/session";
import type { Agent } from "~/runtime/agent";
import type { RuntimeEvent } from "~/runtime/event/runtime/RuntimeEvent";
import type { Unsubscribe } from "~/runtime/agent/AgentEventHandler";

/**
 * Container info
 */
export interface ContainerInfo {
  containerId: string;
  name?: string;
  createdAt: Date;
}

/**
 * RuntimeAPI - Runtime operations and event bus
 */
export interface RuntimeAPI {
  // ==================== Event Subscription ====================

  /**
   * Subscribe to runtime events by type
   *
   * @param type - Event type to listen for
   * @param handler - Event handler
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * agentx.runtime.on("text_delta", (e) => {
   *   console.log(e.agentId, e.data.text);
   * });
   * ```
   */
  on<T extends RuntimeEvent["type"]>(
    type: T,
    handler: (event: Extract<RuntimeEvent, { type: T }>) => void
  ): Unsubscribe;

  /**
   * Subscribe to all runtime events
   */
  onAll(handler: (event: RuntimeEvent) => void): Unsubscribe;

  // ==================== Container Lifecycle ====================

  /**
   * Create a new container
   *
   * @param name - Optional container name
   */
  createContainer(name?: string): Promise<ContainerInfo>;

  /**
   * Get container by ID
   */
  getContainer(containerId: string): Promise<ContainerInfo | undefined>;

  /**
   * List all containers
   */
  listContainers(): Promise<ContainerInfo[]>;

  /**
   * Delete a container
   *
   * @returns true if deleted, false if not found
   */
  deleteContainer(containerId: string): Promise<boolean>;

  // ==================== Session Lifecycle ====================

  /**
   * Create a new session from an image
   *
   * @param imageId - Image to create session from
   * @param containerId - Optional container (auto-created if not provided)
   */
  createSession(imageId: string, containerId?: string): Promise<Session>;

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Promise<Session | undefined>;

  /**
   * List all sessions
   */
  listSessions(): Promise<Session[]>;

  /**
   * List sessions by container
   */
  listSessionsByContainer(containerId: string): Promise<Session[]>;

  /**
   * Delete a session
   *
   * @returns true if deleted, false if not found
   */
  deleteSession(sessionId: string): Promise<boolean>;

  // ==================== Agent Lifecycle ====================

  /**
   * Run an agent directly from an image
   *
   * Like `docker run <image>` - creates a fresh agent with no history.
   * For persistent sessions, use createSession() + session.resume() instead.
   *
   * @param imageId - Image to run
   * @param containerId - Optional container (auto-created if not provided)
   *
   * @example
   * ```typescript
   * const image = await agentx.images.getMetaImage("Translator");
   * const agent = await agentx.runtime.run(image.imageId);
   *
   * agent.on("text_delta", (e) => process.stdout.write(e.data.text));
   * await agent.receive("Hello!");
   * ```
   */
  run(imageId: string, containerId?: string): Promise<Agent>;

  /**
   * Get a running agent by ID
   */
  getAgent(agentId: string): Agent | undefined;

  /**
   * List all running agents
   */
  listAgents(): Agent[];

  /**
   * Destroy a running agent
   */
  destroyAgent(agentId: string): Promise<void>;

  /**
   * Destroy all running agents
   */
  destroyAllAgents(): Promise<void>;
}
