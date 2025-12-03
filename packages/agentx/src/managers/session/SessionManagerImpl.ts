/**
 * SessionManagerImpl - Session management implementation
 *
 * Manages session lifecycle using Repository for persistence.
 *
 * Part of Docker-style layered architecture:
 * Definition → build → Image → run → Agent
 *                        ↓
 *                    Session (external wrapper)
 */

import type {
  Session,
  SessionManager,
  Repository,
  SessionRecord,
  ImageRecord,
  Agent,
  ContainerManager,
  Message,
} from "@agentxjs/types";
import type { MessageRecord, MessageRole } from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

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
 * Generate unique image ID
 */
function generateImageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `image_${timestamp}_${random}`;
}

/**
 * Session implementation with resume and fork capability
 */
class SessionImpl implements Session {
  readonly sessionId: string;
  readonly containerId: string;
  readonly imageId: string;
  readonly createdAt: number;

  private _title: string | null;
  private _updatedAt: number;
  private readonly repository: Repository;
  private readonly containerManager: ContainerManager;
  private readonly defaultContainerId?: string;

  constructor(
    record: SessionRecord,
    repository: Repository,
    containerManager: ContainerManager,
    defaultContainerId?: string
  ) {
    this.sessionId = record.sessionId;
    this.containerId = record.containerId;
    this.imageId = record.imageId;
    this._title = record.title;
    this.createdAt = record.createdAt;
    this._updatedAt = record.updatedAt;
    this.repository = repository;
    this.containerManager = containerManager;
    this.defaultContainerId = defaultContainerId;
  }

  get title(): string | null {
    return this._title;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  async resume(options?: { containerId?: string }): Promise<Agent> {
    logger.info("Resuming agent from session", {
      sessionId: this.sessionId,
      imageId: this.imageId,
      containerId: options?.containerId,
    });

    // Resolve containerId (explicit > default > auto-create)
    let containerId = options?.containerId || this.defaultContainerId;

    if (!containerId) {
      // Auto-create default container
      const container = await this.containerManager.create();
      containerId = container.containerId;
      logger.debug("Auto-created default container for session", {
        containerId,
        sessionId: this.sessionId,
      });
    }

    // Delegate to container manager
    const agent = await this.containerManager.resume(this, containerId);

    // Auto-collect messages from agent
    this.collect(agent);

    return agent;
  }

  collect(agent: Agent): void {
    logger.debug("Collecting messages from agent", {
      sessionId: this.sessionId,
      agentId: agent.agentId,
    });

    const sessionId = this.sessionId;
    const repository = this.repository;

    // Subscribe to all message events and persist them
    const saveMessage = (data: Message, role: MessageRole) => {
      const record: MessageRecord = {
        messageId: data.id,
        sessionId,
        role,
        content: data as unknown as Record<string, unknown>,
        createdAt: data.timestamp ?? Date.now(),
      };

      repository.saveMessage(record).catch((error) => {
        logger.error("Failed to persist message", {
          sessionId,
          messageId: record.messageId,
          error,
        });
      });
    };

    agent.on("user_message", (event) => saveMessage(event.data, "user"));
    agent.on("assistant_message", (event) => saveMessage(event.data, "assistant"));
    agent.on("tool_call_message", (event) => saveMessage(event.data, "tool"));
    agent.on("tool_result_message", (event) => saveMessage(event.data, "tool"));
  }

  async getMessages(): Promise<Message[]> {
    logger.debug("Getting messages for session", { sessionId: this.sessionId });

    const records = await this.repository.findMessagesBySessionId(this.sessionId);

    // Convert MessageRecord to Message (content stores the full message)
    return records.map((record) => record.content as unknown as Message);
  }

  async fork(): Promise<Session> {
    logger.info("Forking session", { sessionId: this.sessionId });

    // Get current image
    const imageRecord = await this.repository.findImageById(this.imageId);
    if (!imageRecord) {
      throw new Error(`Image not found: ${this.imageId}`);
    }

    // Create new image with copied data (DerivedImage from fork)
    const newImageId = generateImageId();
    const newImageRecord: ImageRecord = {
      imageId: newImageId,
      type: "derived",
      definitionName: imageRecord.definitionName,
      parentImageId: imageRecord.imageId,
      definition: imageRecord.definition,
      config: imageRecord.config,
      messages: [...imageRecord.messages], // Copy messages
      createdAt: Date.now(),
    };
    await this.repository.saveImage(newImageRecord);

    // Create new session pointing to new image
    const newSessionId = generateSessionId();
    const now = Date.now();
    const newSessionRecord: SessionRecord = {
      sessionId: newSessionId,
      containerId: this.containerId,
      imageId: newImageId,
      title: this._title ? `Fork of ${this._title}` : null,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.saveSession(newSessionRecord);

    logger.info("Session forked", {
      originalSessionId: this.sessionId,
      newSessionId,
      newImageId,
    });

    return new SessionImpl(
      newSessionRecord,
      this.repository,
      this.containerManager,
      this.defaultContainerId
    );
  }

  async setTitle(title: string): Promise<void> {
    logger.debug("Setting session title", { sessionId: this.sessionId, title });

    const now = Date.now();
    await this.repository.saveSession({
      sessionId: this.sessionId,
      containerId: this.containerId,
      imageId: this.imageId,
      title,
      createdAt: this.createdAt,
      updatedAt: now,
    });

    this._title = title;
    this._updatedAt = now;

    logger.info("Session title updated", { sessionId: this.sessionId, title });
  }
}

/**
 * SessionManager implementation
 */
export class SessionManagerImpl implements SessionManager {
  private readonly repository: Repository;
  private readonly containerManager: ContainerManager;
  private readonly defaultContainerId?: string;

  constructor(
    repository: Repository,
    containerManager: ContainerManager,
    defaultContainerId?: string
  ) {
    this.repository = repository;
    this.containerManager = containerManager;
    this.defaultContainerId = defaultContainerId;
  }

  async create(imageId: string, containerId: string): Promise<Session> {
    const sessionId = generateSessionId();
    const now = Date.now();

    const record: SessionRecord = {
      sessionId,
      containerId,
      imageId,
      title: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveSession(record);

    logger.info("Session created", { sessionId, imageId, containerId });

    return new SessionImpl(record, this.repository, this.containerManager, this.defaultContainerId);
  }

  async get(sessionId: string): Promise<Session | undefined> {
    const record = await this.repository.findSessionById(sessionId);
    if (!record) return undefined;

    return new SessionImpl(record, this.repository, this.containerManager, this.defaultContainerId);
  }

  async has(sessionId: string): Promise<boolean> {
    return this.repository.sessionExists(sessionId);
  }

  async list(): Promise<Session[]> {
    const records = await this.repository.findAllSessions();
    return records.map(
      (r) => new SessionImpl(r, this.repository, this.containerManager, this.defaultContainerId)
    );
  }

  async listByImage(imageId: string): Promise<Session[]> {
    const records = await this.repository.findSessionsByImageId(imageId);
    return records.map(
      (r) => new SessionImpl(r, this.repository, this.containerManager, this.defaultContainerId)
    );
  }

  async listByContainer(containerId: string): Promise<Session[]> {
    const records = await this.repository.findSessionsByContainerId(containerId);
    return records.map(
      (r) => new SessionImpl(r, this.repository, this.containerManager, this.defaultContainerId)
    );
  }

  async destroy(sessionId: string): Promise<void> {
    await this.repository.deleteSession(sessionId);
    logger.info("Session destroyed", { sessionId });
  }

  async destroyByImage(imageId: string): Promise<void> {
    await this.repository.deleteSessionsByImageId(imageId);
    logger.info("Sessions destroyed by image", { imageId });
  }

  async destroyAll(): Promise<void> {
    const sessions = await this.repository.findAllSessions();
    for (const session of sessions) {
      await this.repository.deleteSession(session.sessionId);
    }
    logger.info("All sessions destroyed");
  }
}
