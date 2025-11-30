/**
 * Container
 *
 * Runtime container for managing multiple Agents.
 * Each Agent holds its own Sandbox (isolated resources).
 *
 * Architecture:
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │                  Container                       │
 * │  ┌───────────────────────────────────────────┐  │
 * │  │  Agent 1 ──────→ Sandbox 1 (OS/Workspace) │  │
 * │  │  Agent 2 ──────→ Sandbox 2 (OS/Workspace) │  │
 * │  │  Agent 3 ──────→ Sandbox 3 (OS/Workspace) │  │
 * │  └───────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────┘
 * ```
 *
 * Key responsibilities:
 * - Manage Agent lifecycle (register, get, destroy)
 * - Platform abstraction (different Container impl = different platform)
 *
 * Platform examples:
 * - LocalContainer: Node.js local execution
 * - DockerContainer: Docker container execution
 * - CloudflareContainer: Cloudflare Workers execution
 */

import type { Agent } from "../../agent";

/**
 * Container - Agent runtime container
 *
 * Manages multiple Agents. Injected into AgentX for platform abstraction.
 */
export interface Container {
  /** Container identifier */
  readonly id: string;

  /**
   * Register an agent
   */
  register(agent: Agent): void;

  /**
   * Get agent by ID
   */
  get(agentId: string): Agent | undefined;

  /**
   * Check if agent exists
   */
  has(agentId: string): boolean;

  /**
   * Unregister agent by ID
   */
  unregister(agentId: string): boolean;

  /**
   * Get all agent IDs
   */
  getAllIds(): string[];

  /**
   * Get total count
   */
  count(): number;

  /**
   * Clear all agents
   */
  clear(): void;
}
