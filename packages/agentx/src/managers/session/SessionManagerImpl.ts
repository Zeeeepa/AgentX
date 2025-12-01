/**
 * SessionManagerImpl - Session management implementation
 *
 * Manages session lifecycle using Repository for persistence.
 */

import type {
  Session,
  SessionManager,
  Repository,
  SessionRecord,
  Agent,
  AgentDefinition,
} from "@deepractice-ai/agentx-types";
import { createLogger } from "@deepractice-ai/agentx-logger";

const logger = createLogger("agentx/SessionManager");

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`;
}

/**
 * Session implementation with resume capability
 */
class SessionImpl implements Session {
  readonly sessionId: string;
  readonly agentId: string;
  readonly createdAt: number;

  private _title: string | null;
  private _updatedAt: number;
  private readonly repository: Repository;
  private readonly agentFactory: (
    definition: AgentDefinition,
    config: Record<string, unknown>
  ) => Agent;

  constructor(
    record: SessionRecord,
    repository: Repository,
    agentFactory: (definition: AgentDefinition, config: Record<string, unknown>) => Agent
  ) {
    this.sessionId = record.sessionId;
    this.agentId = record.agentId;
    this._title = record.title;
    this.createdAt = record.createdAt.getTime();
    this._updatedAt = record.updatedAt.getTime();
    this.repository = repository;
    this.agentFactory = agentFactory;
  }

  get title(): string | null {
    return this._title;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  async resume(): Promise<Agent> {
    logger.info("Resuming agent from session", {
      sessionId: this.sessionId,
      agentId: this.agentId,
    });

    // Get agent record from repository
    const agentRecord = await this.repository.findAgentById(this.agentId);
    if (!agentRecord) {
      throw new Error(`Agent not found: ${this.agentId}`);
    }

    // Get messages for this session
    const messages = await this.repository.findMessagesBySessionId(this.sessionId);

    // Create agent with stored definition and config
    const definition = agentRecord.definition as unknown as AgentDefinition;
    const config = agentRecord.config;

    const agent = this.agentFactory(definition, config);

    // TODO: Load messages into agent context
    logger.debug("Agent resumed", {
      sessionId: this.sessionId,
      agentId: this.agentId,
      messageCount: messages.length,
    });

    return agent;
  }

  async setTitle(title: string): Promise<void> {
    logger.debug("Setting session title", { sessionId: this.sessionId, title });

    const now = new Date();
    await this.repository.saveSession({
      sessionId: this.sessionId,
      agentId: this.agentId,
      title,
      createdAt: new Date(this.createdAt),
      updatedAt: now,
    });

    this._title = title;
    this._updatedAt = now.getTime();

    logger.info("Session title updated", { sessionId: this.sessionId, title });
  }
}

/**
 * SessionManager implementation
 */
export class SessionManagerImpl implements SessionManager {
  private readonly repository: Repository;
  private readonly agentFactory: (
    definition: AgentDefinition,
    config: Record<string, unknown>
  ) => Agent;

  constructor(
    repository: Repository,
    agentFactory: (definition: AgentDefinition, config: Record<string, unknown>) => Agent
  ) {
    this.repository = repository;
    this.agentFactory = agentFactory;
  }

  async create(agentId: string): Promise<Session> {
    const sessionId = generateSessionId();
    const now = new Date();

    const record: SessionRecord = {
      sessionId,
      agentId,
      title: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveSession(record);

    logger.info("Session created", { sessionId, agentId });

    return new SessionImpl(record, this.repository, this.agentFactory);
  }

  async get(sessionId: string): Promise<Session | undefined> {
    const record = await this.repository.findSessionById(sessionId);
    if (!record) return undefined;

    return new SessionImpl(record, this.repository, this.agentFactory);
  }

  async has(sessionId: string): Promise<boolean> {
    return this.repository.sessionExists(sessionId);
  }

  async list(): Promise<Session[]> {
    const records = await this.repository.findAllSessions();
    return records.map((r) => new SessionImpl(r, this.repository, this.agentFactory));
  }

  async listByAgent(agentId: string): Promise<Session[]> {
    const records = await this.repository.findSessionsByAgentId(agentId);
    return records.map((r) => new SessionImpl(r, this.repository, this.agentFactory));
  }

  async destroy(sessionId: string): Promise<void> {
    await this.repository.deleteSession(sessionId);
    logger.info("Session destroyed", { sessionId });
  }

  async destroyByAgent(agentId: string): Promise<void> {
    await this.repository.deleteSessionsByAgentId(agentId);
    logger.info("Sessions destroyed by agent", { agentId });
  }

  async destroyAll(): Promise<void> {
    const sessions = await this.repository.findAllSessions();
    for (const session of sessions) {
      await this.repository.deleteSession(session.sessionId);
    }
    logger.info("All sessions destroyed");
  }
}
