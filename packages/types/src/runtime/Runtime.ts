/**
 * Runtime - Technical Infrastructure Layer
 *
 * "Define Once, Run Anywhere"
 *
 * Runtime provides pure technical infrastructure via create functions:
 * - createSandbox: Creates isolated Sandbox environments
 * - createDriver: Creates RuntimeDriver instances
 * - createLogger: Creates Logger instances
 * - repository: Data persistence (optional)
 *
 * Agent lifecycle (Container) is managed at AgentX layer, not Runtime.
 * Runtime only provides create functions for technical components.
 *
 * NodeRuntime = createSandbox + createDriver + createLogger + SQLiteRepository
 * SSERuntime = createSandbox (noop) + createDriver (SSE) + createLogger + RemoteRepository
 */

import type { Sandbox } from "./container/sandbox";
import type { RuntimeDriver } from "./container/driver/RuntimeDriver";
import type { Repository } from "./repository";
import type { Logger } from "~/common/logger";
import type { AgentDefinition } from "~/agent/AgentDefinition";
import type { AgentContext } from "~/agent/AgentContext";

/**
 * Runtime - Technical infrastructure layer
 *
 * Provides create functions for runtime components.
 * ContainerManager (at AgentX layer) uses these to create Agents.
 *
 * This is a pure infrastructure interface - no business concepts (tenant, etc.).
 */
export interface Runtime {
  /** Runtime identifier (e.g., "node", "sse") */
  readonly name: string;

  /** Repository for persistence (optional) */
  readonly repository?: Repository;

  /**
   * Create a Sandbox for resource isolation
   *
   * @param containerId - Container identifier, determines isolation boundary
   * @returns New Sandbox instance with Workspace and LLM provider
   */
  createSandbox(containerId: string): Sandbox;

  /**
   * Create a RuntimeDriver
   *
   * Merges AgentDefinition (business config) with Runtime config (infrastructure).
   *
   * @param definition - Agent definition (business config)
   * @param context - Agent context (identity)
   * @param sandbox - Sandbox for isolation
   * @returns New RuntimeDriver instance
   */
  createDriver(definition: AgentDefinition, context: AgentContext, sandbox: Sandbox): RuntimeDriver;

  /**
   * Create a Logger instance
   *
   * @param name - Logger name (typically module path like "engine/AgentEngine")
   * @returns Logger instance
   */
  createLogger(name: string): Logger;
}
