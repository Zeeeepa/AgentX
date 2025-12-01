/**
 * Repository - Unified persistence interface for AgentX
 *
 * Single interface for all data operations (agents, sessions, messages).
 * Implementations can be local (Prisma) or remote (HTTP API).
 *
 * @example
 * ```typescript
 * // Local implementation (agentx-node)
 * const repository = new PrismaRepository(prismaClient);
 *
 * // Remote implementation (agentx browser)
 * const repository = new RemoteRepository({ serverUrl: "http://..." });
 *
 * // Use with runtime
 * const runtime = createRuntime({ repository });
 * ```
 */

import type { AgentRecord } from "./record/AgentRecord";
import type { SessionRecord } from "./record/SessionRecord";
import type { MessageRecord } from "./record/MessageRecord";

/**
 * Repository - Unified persistence interface
 */
export interface Repository {
  // ==================== Agent ====================

  /**
   * Save an agent record (create or update)
   */
  saveAgent(record: AgentRecord): Promise<void>;

  /**
   * Find agent by ID
   */
  findAgentById(agentId: string): Promise<AgentRecord | null>;

  /**
   * Find all agents
   */
  findAllAgents(): Promise<AgentRecord[]>;

  /**
   * Delete agent by ID (cascades to sessions and messages)
   */
  deleteAgent(agentId: string): Promise<void>;

  /**
   * Check if agent exists
   */
  agentExists(agentId: string): Promise<boolean>;

  // ==================== Session ====================

  /**
   * Save a session record (create or update)
   */
  saveSession(record: SessionRecord): Promise<void>;

  /**
   * Find session by ID
   */
  findSessionById(sessionId: string): Promise<SessionRecord | null>;

  /**
   * Find all sessions for an agent
   */
  findSessionsByAgentId(agentId: string): Promise<SessionRecord[]>;

  /**
   * Find all sessions
   */
  findAllSessions(): Promise<SessionRecord[]>;

  /**
   * Delete session by ID (cascades to messages)
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Delete all sessions for an agent
   */
  deleteSessionsByAgentId(agentId: string): Promise<void>;

  /**
   * Check if session exists
   */
  sessionExists(sessionId: string): Promise<boolean>;

  // ==================== Message ====================

  /**
   * Save a message record
   */
  saveMessage(record: MessageRecord): Promise<void>;

  /**
   * Find message by ID
   */
  findMessageById(messageId: string): Promise<MessageRecord | null>;

  /**
   * Find all messages for a session (ordered by createdAt)
   */
  findMessagesBySessionId(sessionId: string): Promise<MessageRecord[]>;

  /**
   * Delete message by ID
   */
  deleteMessage(messageId: string): Promise<void>;

  /**
   * Delete all messages for a session
   */
  deleteMessagesBySessionId(sessionId: string): Promise<void>;

  /**
   * Count messages in a session
   */
  countMessagesBySessionId(sessionId: string): Promise<number>;
}
