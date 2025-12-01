/**
 * SQLiteRepository - better-sqlite3 implementation of Repository
 *
 * Lightweight, synchronous SQLite storage for agents, sessions, and messages.
 *
 * @example
 * ```typescript
 * import { SQLiteRepository } from "@deepractice-ai/agentx-node";
 *
 * const repository = new SQLiteRepository("./data/agentx.db");
 * ```
 */

import Database from "better-sqlite3";
import type {
  Repository,
  AgentRecord,
  SessionRecord,
  MessageRecord,
  MessageRole,
  AgentLifecycle,
} from "@deepractice-ai/agentx-types";

export class SQLiteRepository implements Repository {
  private db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        agentId TEXT PRIMARY KEY,
        definition TEXT NOT NULL,
        config TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        sessionId TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        title TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (agentId) REFERENCES agents(agentId) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_agentId ON sessions(agentId);

      CREATE TABLE IF NOT EXISTS messages (
        messageId TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(sessionId) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_sessionId ON messages(sessionId);
    `);

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");
  }

  // ==================== Agent ====================

  async saveAgent(record: AgentRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO agents (agentId, definition, config, lifecycle, createdAt, updatedAt)
      VALUES (@agentId, @definition, @config, @lifecycle, @createdAt, @updatedAt)
      ON CONFLICT(agentId) DO UPDATE SET
        definition = @definition,
        config = @config,
        lifecycle = @lifecycle,
        updatedAt = @updatedAt
    `);

    stmt.run({
      agentId: record.agentId,
      definition: JSON.stringify(record.definition),
      config: JSON.stringify(record.config),
      lifecycle: record.lifecycle,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  }

  async findAgentById(agentId: string): Promise<AgentRecord | null> {
    const stmt = this.db.prepare("SELECT * FROM agents WHERE agentId = ?");
    const row = stmt.get(agentId) as AgentRow | undefined;

    if (!row) return null;

    return this.toAgentRecord(row);
  }

  async findAllAgents(): Promise<AgentRecord[]> {
    const stmt = this.db.prepare("SELECT * FROM agents");
    const rows = stmt.all() as AgentRow[];

    return rows.map((row) => this.toAgentRecord(row));
  }

  async deleteAgent(agentId: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM agents WHERE agentId = ?");
    stmt.run(agentId);
  }

  async agentExists(agentId: string): Promise<boolean> {
    const stmt = this.db.prepare("SELECT 1 FROM agents WHERE agentId = ?");
    return stmt.get(agentId) !== undefined;
  }

  // ==================== Session ====================

  async saveSession(record: SessionRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (sessionId, agentId, title, createdAt, updatedAt)
      VALUES (@sessionId, @agentId, @title, @createdAt, @updatedAt)
      ON CONFLICT(sessionId) DO UPDATE SET
        title = @title,
        updatedAt = @updatedAt
    `);

    stmt.run({
      sessionId: record.sessionId,
      agentId: record.agentId,
      title: record.title,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE sessionId = ?");
    const row = stmt.get(sessionId) as SessionRow | undefined;

    if (!row) return null;

    return this.toSessionRecord(row);
  }

  async findSessionsByAgentId(agentId: string): Promise<SessionRecord[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM sessions WHERE agentId = ? ORDER BY createdAt DESC"
    );
    const rows = stmt.all(agentId) as SessionRow[];

    return rows.map((row) => this.toSessionRecord(row));
  }

  async findAllSessions(): Promise<SessionRecord[]> {
    const stmt = this.db.prepare("SELECT * FROM sessions ORDER BY createdAt DESC");
    const rows = stmt.all() as SessionRow[];

    return rows.map((row) => this.toSessionRecord(row));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM sessions WHERE sessionId = ?");
    stmt.run(sessionId);
  }

  async deleteSessionsByAgentId(agentId: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM sessions WHERE agentId = ?");
    stmt.run(agentId);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const stmt = this.db.prepare("SELECT 1 FROM sessions WHERE sessionId = ?");
    return stmt.get(sessionId) !== undefined;
  }

  // ==================== Message ====================

  async saveMessage(record: MessageRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO messages (messageId, sessionId, role, content, createdAt)
      VALUES (@messageId, @sessionId, @role, @content, @createdAt)
      ON CONFLICT(messageId) DO UPDATE SET
        role = @role,
        content = @content
    `);

    stmt.run({
      messageId: record.messageId,
      sessionId: record.sessionId,
      role: record.role,
      content: JSON.stringify(record.content),
      createdAt: record.createdAt.toISOString(),
    });
  }

  async findMessageById(messageId: string): Promise<MessageRecord | null> {
    const stmt = this.db.prepare("SELECT * FROM messages WHERE messageId = ?");
    const row = stmt.get(messageId) as MessageRow | undefined;

    if (!row) return null;

    return this.toMessageRecord(row);
  }

  async findMessagesBySessionId(sessionId: string): Promise<MessageRecord[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC"
    );
    const rows = stmt.all(sessionId) as MessageRow[];

    return rows.map((row) => this.toMessageRecord(row));
  }

  async deleteMessage(messageId: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM messages WHERE messageId = ?");
    stmt.run(messageId);
  }

  async deleteMessagesBySessionId(sessionId: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM messages WHERE sessionId = ?");
    stmt.run(sessionId);
  }

  async countMessagesBySessionId(sessionId: string): Promise<number> {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM messages WHERE sessionId = ?");
    const row = stmt.get(sessionId) as { count: number };
    return row.count;
  }

  // ==================== Helpers ====================

  private toAgentRecord(row: AgentRow): AgentRecord {
    return {
      agentId: row.agentId,
      definition: JSON.parse(row.definition),
      config: JSON.parse(row.config),
      lifecycle: row.lifecycle as AgentLifecycle,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private toSessionRecord(row: SessionRow): SessionRecord {
    return {
      sessionId: row.sessionId,
      agentId: row.agentId,
      title: row.title,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private toMessageRecord(row: MessageRow): MessageRecord {
    return {
      messageId: row.messageId,
      sessionId: row.sessionId,
      role: row.role as MessageRole,
      content: JSON.parse(row.content),
      createdAt: new Date(row.createdAt),
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}

// Row types for SQLite results
interface AgentRow {
  agentId: string;
  definition: string;
  config: string;
  lifecycle: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionRow {
  sessionId: string;
  agentId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageRow {
  messageId: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: string;
}
