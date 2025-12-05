/**
 * RuntimeSession - Session implementation
 *
 * Collects messages from Agent and persists to storage.
 */

import type { Session } from "@agentxjs/types/runtime/internal";
import type { SessionRepository, SessionRecord } from "@agentxjs/types/persistence";
import type { Message } from "@agentxjs/types/agent";

/**
 * RuntimeSession configuration
 */
export interface RuntimeSessionConfig {
  sessionId: string;
  agentId: string;
  containerId: string;
  repository: SessionRepository;
}

/**
 * RuntimeSession - Collects and stores messages
 */
export class RuntimeSession implements Session {
  readonly sessionId: string;
  readonly agentId: string;
  readonly containerId: string;
  readonly createdAt: number;

  private readonly repository: SessionRepository;

  constructor(config: RuntimeSessionConfig) {
    this.sessionId = config.sessionId;
    this.agentId = config.agentId;
    this.containerId = config.containerId;
    this.createdAt = Date.now();
    this.repository = config.repository;
  }

  /**
   * Initialize session in storage
   */
  async initialize(): Promise<void> {
    const record: SessionRecord = {
      sessionId: this.sessionId,
      agentId: this.agentId,
      containerId: this.containerId,
      createdAt: this.createdAt,
      updatedAt: this.createdAt,
    };
    await this.repository.saveSession(record);
  }

  async addMessage(message: Message): Promise<void> {
    await this.repository.addMessage(this.sessionId, message);
  }

  async getMessages(): Promise<Message[]> {
    return this.repository.getMessages(this.sessionId);
  }

  async clear(): Promise<void> {
    await this.repository.clearMessages(this.sessionId);
  }
}
