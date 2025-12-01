/**
 * RemoteRepository - HTTP-based repository implementation
 *
 * Communicates with remote AgentX server for persistence.
 */

import type {
  Repository,
  AgentRecord,
  SessionRecord,
  MessageRecord,
} from "@deepractice-ai/agentx-types";
import { createLogger } from "@deepractice-ai/agentx-logger";
import { createHttpClient, type KyInstance } from "../managers/remote/HttpClient";

const logger = createLogger("agentx/RemoteRepository");

export interface RemoteRepositoryOptions {
  serverUrl: string;
}

export class RemoteRepository implements Repository {
  private readonly client: KyInstance;

  constructor(options: RemoteRepositoryOptions) {
    this.client = createHttpClient({ baseUrl: options.serverUrl });
    logger.debug("RemoteRepository created", { serverUrl: options.serverUrl });
  }

  // ==================== Agent ====================

  async saveAgent(record: AgentRecord): Promise<void> {
    await this.client.put(`repository/agents/${record.agentId}`, { json: record });
  }

  async findAgentById(agentId: string): Promise<AgentRecord | null> {
    try {
      const result = await this.client.get(`repository/agents/${agentId}`).json<AgentRecord>();
      return this.parseAgentRecord(result);
    } catch (error: unknown) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  async findAllAgents(): Promise<AgentRecord[]> {
    const result = await this.client.get("repository/agents").json<AgentRecord[]>();
    return result.map((r) => this.parseAgentRecord(r));
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.client.delete(`repository/agents/${agentId}`);
  }

  async agentExists(agentId: string): Promise<boolean> {
    try {
      await this.client.head(`repository/agents/${agentId}`);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Session ====================

  async saveSession(record: SessionRecord): Promise<void> {
    await this.client.put(`repository/sessions/${record.sessionId}`, { json: record });
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    try {
      const result = await this.client
        .get(`repository/sessions/${sessionId}`)
        .json<SessionRecord>();
      return this.parseSessionRecord(result);
    } catch (error: unknown) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  async findSessionsByAgentId(agentId: string): Promise<SessionRecord[]> {
    const result = await this.client
      .get(`repository/agents/${agentId}/sessions`)
      .json<SessionRecord[]>();
    return result.map((r) => this.parseSessionRecord(r));
  }

  async findAllSessions(): Promise<SessionRecord[]> {
    const result = await this.client.get("repository/sessions").json<SessionRecord[]>();
    return result.map((r) => this.parseSessionRecord(r));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`repository/sessions/${sessionId}`);
  }

  async deleteSessionsByAgentId(agentId: string): Promise<void> {
    await this.client.delete(`repository/agents/${agentId}/sessions`);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      await this.client.head(`repository/sessions/${sessionId}`);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Message ====================

  async saveMessage(record: MessageRecord): Promise<void> {
    await this.client.put(`repository/messages/${record.messageId}`, { json: record });
  }

  async findMessageById(messageId: string): Promise<MessageRecord | null> {
    try {
      const result = await this.client
        .get(`repository/messages/${messageId}`)
        .json<MessageRecord>();
      return this.parseMessageRecord(result);
    } catch (error: unknown) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  async findMessagesBySessionId(sessionId: string): Promise<MessageRecord[]> {
    const result = await this.client
      .get(`repository/sessions/${sessionId}/messages`)
      .json<MessageRecord[]>();
    return result.map((r) => this.parseMessageRecord(r));
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.client.delete(`repository/messages/${messageId}`);
  }

  async deleteMessagesBySessionId(sessionId: string): Promise<void> {
    await this.client.delete(`repository/sessions/${sessionId}/messages`);
  }

  async countMessagesBySessionId(sessionId: string): Promise<number> {
    const result = await this.client
      .get(`repository/sessions/${sessionId}/messages/count`)
      .json<{ count: number }>();
    return result.count;
  }

  // ==================== Helpers ====================

  private isNotFound(error: unknown): boolean {
    return (error as { response?: { status: number } })?.response?.status === 404;
  }

  private parseAgentRecord(raw: AgentRecord): AgentRecord {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
  }

  private parseSessionRecord(raw: SessionRecord): SessionRecord {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
  }

  private parseMessageRecord(raw: MessageRecord): MessageRecord {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
    };
  }
}
