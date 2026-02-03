/**
 * Session - Manages conversation messages
 *
 * Collects messages and persists to storage via SessionRepository.
 * Pure implementation without EventBus dependency.
 */

import type { Message } from "../agent/types";
import type { Session, SessionConfig, SessionRecord, SessionRepository } from "./types";

/**
 * SessionImpl - Session implementation
 */
export class SessionImpl implements Session {
  readonly sessionId: string;
  readonly imageId: string;
  readonly containerId: string;
  readonly createdAt: number;

  private readonly repository: SessionRepository;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId;
    this.imageId = config.imageId;
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
      imageId: this.imageId,
      containerId: this.containerId,
      createdAt: this.createdAt,
      updatedAt: this.createdAt,
    };
    await this.repository.saveSession(record);
  }

  /**
   * Add a message to the session
   */
  async addMessage(message: Message): Promise<void> {
    await this.repository.addMessage(this.sessionId, message);
  }

  /**
   * Get all messages in the session
   */
  async getMessages(): Promise<Message[]> {
    return this.repository.getMessages(this.sessionId);
  }

  /**
   * Clear all messages in the session
   */
  async clear(): Promise<void> {
    await this.repository.clearMessages(this.sessionId);
  }
}

/**
 * Create a new Session instance
 */
export function createSession(config: SessionConfig): Session {
  return new SessionImpl(config);
}
