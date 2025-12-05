/**
 * SessionRecord - Storage schema for Session persistence
 *
 * Session stores conversation history for an Agent.
 */

/**
 * Session storage record
 */
export interface SessionRecord {
  /**
   * Unique session identifier
   */
  sessionId: string;

  /**
   * Associated agent ID
   */
  agentId: string;

  /**
   * Container this session belongs to
   */
  containerId: string;

  /**
   * Creation timestamp (Unix milliseconds)
   */
  createdAt: number;

  /**
   * Last update timestamp (Unix milliseconds)
   */
  updatedAt: number;
}
