/**
 * AgentX - Platform API
 *
 * The central entry point for all agent operations.
 * Like Express app or Vue app, AgentX provides a unified
 * interface for managing agents, errors, and sessions.
 *
 * Two modes:
 * - Local: Direct in-memory operations
 * - Remote: Operations via network to remote AgentX server
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 *
 * // Local mode
 * const local = createAgentX();
 * const agent = local.agents.create(definition, config);
 *
 * // Remote mode
 * const remote = createAgentX({
 *   mode: 'remote',
 *   remote: { serverUrl: "http://..." }
 * });
 * const info = await remote.platform.getInfo();
 * ```
 */

import type { AgentManager } from "./agent";
import type { ErrorManager } from "./error";
import type { SessionManager } from "./session";
import type { PlatformManager } from "./platform";
import type { DefinitionManager } from "./definition";
import type { ImageManager } from "./image";
/**
 * Base AgentX interface (shared by Local and Remote)
 */
interface AgentXBase {
  /**
   * Definition registry (Docker-style: source templates)
   */
  readonly definitions: DefinitionManager;

  /**
   * Image management (Docker-style: built artifacts)
   */
  readonly images: ImageManager;

  /**
   * Agent lifecycle management
   */
  readonly agents: AgentManager;
}

/**
 * Local mode AgentX
 *
 * Direct in-memory operations, no network required.
 */
export interface AgentXLocal extends AgentXBase {
  /**
   * Mode identifier
   */
  readonly mode: "local";

  /**
   * Session management
   */
  readonly sessions: SessionManager;

  /**
   * Platform-level error management (Local only)
   *
   * Remote clients handle errors themselves due to
   * environment-specific differences (network, CORS, etc.)
   */
  readonly errors: ErrorManager;
}

/**
 * Remote mode AgentX
 *
 * Operations via network to remote AgentX server.
 */
export interface AgentXRemote extends AgentXBase {
  /**
   * Mode identifier
   */
  readonly mode: "remote";

  /**
   * Session management
   */
  readonly sessions: SessionManager;

  /**
   * Platform information (remote only)
   */
  readonly platform: PlatformManager;
}

/**
 * AgentX - Union type of Local and Remote modes
 */
export type AgentX = AgentXLocal | AgentXRemote;
