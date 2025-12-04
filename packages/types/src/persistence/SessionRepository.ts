/**
 * SessionRepository - Persistence interface for sessions
 */

import type { SessionRecord } from "./record/SessionRecord";

/**
 * SessionRepository - Storage operations for sessions
 */
export interface SessionRepository {
  /**
   * Save a session record (create or update)
   */
  saveSession(record: SessionRecord): Promise<void>;

  /**
   * Find session by ID
   */
  findSessionById(sessionId: string): Promise<SessionRecord | null>;

  /**
   * Find all sessions for an image
   */
  findSessionsByImageId(imageId: string): Promise<SessionRecord[]>;

  /**
   * Find all sessions for a container
   */
  findSessionsByContainerId(containerId: string): Promise<SessionRecord[]>;

  /**
   * Find all sessions
   */
  findAllSessions(): Promise<SessionRecord[]>;

  /**
   * Delete session by ID
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Delete all sessions for an image
   */
  deleteSessionsByImageId(imageId: string): Promise<void>;

  /**
   * Check if session exists
   */
  sessionExists(sessionId: string): Promise<boolean>;
}
