/**
 * Runtime - Unified API for managing Containers and Agents
 *
 * Runtime is the single entry point for all operations.
 *
 * @example
 * ```typescript
 * const runtime = createRuntime({ persistence });
 *
 * // Container operations
 * await runtime.containers.create("my-container");
 * const container = await runtime.containers.get("my-container");
 *
 * // Agent operations
 * const agent = await runtime.agents.run("my-container", config);
 * await agent.receive("Hello!");
 *
 * // Event subscription
 * runtime.events.on("text_delta", (e) => console.log(e.data.text));
 *
 * // Cleanup
 * await runtime.dispose();
 * ```
 */

import type { Agent } from "./Agent";
import type { AgentConfig } from "./AgentConfig";

/**
 * Unsubscribe function returned by event subscription.
 */
export type Unsubscribe = () => void;

/**
 * Handler function for runtime events.
 */
export type RuntimeEventHandler<E = unknown> = (event: E) => void;

/**
 * Container info returned by containers API
 */
export interface ContainerInfo {
  readonly containerId: string;
  readonly createdAt: number;
  readonly agentCount: number;
}

/**
 * Containers API - Container management operations
 */
export interface ContainersAPI {
  /**
   * Create a new container
   */
  create(containerId: string): Promise<ContainerInfo>;

  /**
   * Get container by ID
   */
  get(containerId: string): Promise<ContainerInfo | undefined>;

  /**
   * List all containers
   */
  list(): Promise<ContainerInfo[]>;

  /**
   * Dispose a container and all its agents
   */
  dispose(containerId: string): Promise<void>;
}

/**
 * Agents API - Agent management operations
 */
export interface AgentsAPI {
  /**
   * Run an agent in a container
   */
  run(containerId: string, config: AgentConfig): Promise<Agent>;

  /**
   * Get agent by ID
   */
  get(agentId: string): Agent | undefined;

  /**
   * List all agents in a container
   */
  list(containerId: string): Agent[];

  /**
   * Destroy an agent
   */
  destroy(agentId: string): Promise<boolean>;

  /**
   * Destroy all agents in a container
   */
  destroyAll(containerId: string): Promise<void>;
}

/**
 * Events API - Event subscription operations
 */
export interface EventsAPI<E = unknown> {
  /**
   * Subscribe to a specific event type
   */
  on<T extends string>(
    type: T,
    handler: RuntimeEventHandler<E>
  ): Unsubscribe;

  /**
   * Subscribe to all events
   */
  onAll(handler: RuntimeEventHandler<E>): Unsubscribe;
}

/**
 * Runtime interface - the unified API for AI Agents
 */
export interface Runtime<E = unknown> {
  /**
   * Container management API
   */
  readonly containers: ContainersAPI;

  /**
   * Agent management API
   */
  readonly agents: AgentsAPI;

  /**
   * Event subscription API
   */
  readonly events: EventsAPI<E>;

  /**
   * Dispose runtime and all resources
   */
  dispose(): Promise<void>;
}
