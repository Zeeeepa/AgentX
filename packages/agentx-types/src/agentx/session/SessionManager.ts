/**
 * SessionManager - Unified session management interface
 *
 * Manages session lifecycle. Storage is handled by the underlying
 * Storage implementation (local or remote).
 *
 * @example
 * ```typescript
 * // Create session for an agent
 * const session = await agentx.sessions.create(agentId);
 *
 * // Resume agent from session
 * const agent = await session.resume();
 *
 * // List sessions
 * const sessions = await agentx.sessions.listByAgent(agentId);
 *
 * // Cleanup
 * await agentx.sessions.destroy(sessionId);
 * ```
 */

import type { Session } from "~/session/Session";

/**
 * Session management interface
 */
export interface SessionManager {
  /**
   * Create a new session for an agent
   *
   * @param agentId - The agent ID to create session for
   * @returns Created session
   */
  create(agentId: string): Promise<Session>;

  /**
   * Get an existing session by ID
   *
   * @param sessionId - The session ID
   * @returns Session or undefined
   */
  get(sessionId: string): Promise<Session | undefined>;

  /**
   * Check if session exists
   *
   * @param sessionId - The session ID
   * @returns true if exists
   */
  has(sessionId: string): Promise<boolean>;

  /**
   * List all sessions
   *
   * @returns Array of all sessions
   */
  list(): Promise<Session[]>;

  /**
   * List all sessions for an agent
   *
   * @param agentId - The agent ID
   * @returns Array of sessions for the agent
   */
  listByAgent(agentId: string): Promise<Session[]>;

  /**
   * Destroy a session
   *
   * @param sessionId - The session ID
   */
  destroy(sessionId: string): Promise<void>;

  /**
   * Destroy all sessions for an agent
   *
   * @param agentId - The agent ID
   */
  destroyByAgent(agentId: string): Promise<void>;

  /**
   * Destroy all sessions
   */
  destroyAll(): Promise<void>;
}
