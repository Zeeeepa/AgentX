/**
 * MirrorPersistence - HTTP-based Persistence implementation
 *
 * Implements Persistence interface by making HTTP requests to the server.
 * Used by browser clients to persist data via the AgentX server.
 *
 * @example
 * ```typescript
 * const persistence = new MirrorPersistence({
 *   baseUrl: "http://localhost:5200/api",
 * });
 *
 * await persistence.definitions.save(record);
 * const image = await persistence.images.findById(imageId);
 * ```
 */

import type {
  Persistence,
  DefinitionRepository,
  ImageRepository,
  ContainerRepository,
  SessionRepository,
  DefinitionRecord,
  ImageRecord,
  ContainerRecord,
  SessionRecord,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("mirror/MirrorPersistence");

/**
 * MirrorPersistence configuration
 */
export interface MirrorPersistenceConfig {
  /**
   * Base URL for API requests (e.g., "http://localhost:5200/api")
   */
  baseUrl: string;

  /**
   * Authentication token (optional)
   */
  token?: string;

  /**
   * Additional headers (optional)
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}

/**
 * HTTP client helper
 */
class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;

  constructor(config: MirrorPersistenceConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout ?? 30000;

    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    if (config.token) {
      this.headers["Authorization"] = `Bearer ${config.token}`;
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * HTTP-based DefinitionRepository
 */
class HttpDefinitionRepository implements DefinitionRepository {
  constructor(private readonly http: HttpClient) {}

  async saveDefinition(record: DefinitionRecord): Promise<void> {
    await this.http.request("PUT", `/definitions/${record.name}`, record);
    logger.debug("Definition saved", { name: record.name });
  }

  async findDefinitionByName(name: string): Promise<DefinitionRecord | null> {
    try {
      return await this.http.request<DefinitionRecord>("GET", `/definitions/${name}`);
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async findAllDefinitions(): Promise<DefinitionRecord[]> {
    return await this.http.request<DefinitionRecord[]>("GET", "/definitions");
  }

  async deleteDefinition(name: string): Promise<void> {
    await this.http.request("DELETE", `/definitions/${name}`);
    logger.debug("Definition deleted", { name });
  }

  async definitionExists(name: string): Promise<boolean> {
    const record = await this.findDefinitionByName(name);
    return record !== null;
  }
}

/**
 * HTTP-based ImageRepository
 */
class HttpImageRepository implements ImageRepository {
  constructor(private readonly http: HttpClient) {}

  async saveImage(record: ImageRecord): Promise<void> {
    await this.http.request("PUT", `/images/${record.imageId}`, record);
    logger.debug("Image saved", { imageId: record.imageId });
  }

  async findImageById(imageId: string): Promise<ImageRecord | null> {
    try {
      return await this.http.request<ImageRecord>("GET", `/images/${imageId}`);
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async findAllImages(): Promise<ImageRecord[]> {
    return await this.http.request<ImageRecord[]>("GET", "/images");
  }

  async findImagesByDefinitionName(definitionName: string): Promise<ImageRecord[]> {
    return await this.http.request<ImageRecord[]>(
      "GET",
      `/images?definitionName=${encodeURIComponent(definitionName)}`
    );
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.http.request("DELETE", `/images/${imageId}`);
    logger.debug("Image deleted", { imageId });
  }

  async imageExists(imageId: string): Promise<boolean> {
    const record = await this.findImageById(imageId);
    return record !== null;
  }
}

/**
 * HTTP-based ContainerRepository
 */
class HttpContainerRepository implements ContainerRepository {
  constructor(private readonly http: HttpClient) {}

  async saveContainer(record: ContainerRecord): Promise<void> {
    await this.http.request("PUT", `/containers/${record.containerId}`, record);
    logger.debug("Container saved", { containerId: record.containerId });
  }

  async findContainerById(containerId: string): Promise<ContainerRecord | null> {
    try {
      return await this.http.request<ContainerRecord>("GET", `/containers/${containerId}`);
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async findAllContainers(): Promise<ContainerRecord[]> {
    return await this.http.request<ContainerRecord[]>("GET", "/containers");
  }

  async deleteContainer(containerId: string): Promise<void> {
    await this.http.request("DELETE", `/containers/${containerId}`);
    logger.debug("Container deleted", { containerId });
  }

  async containerExists(containerId: string): Promise<boolean> {
    const record = await this.findContainerById(containerId);
    return record !== null;
  }
}

/**
 * HTTP-based SessionRepository
 */
class HttpSessionRepository implements SessionRepository {
  constructor(private readonly http: HttpClient) {}

  async saveSession(record: SessionRecord): Promise<void> {
    await this.http.request("PUT", `/sessions/${record.sessionId}`, record);
    logger.debug("Session saved", { sessionId: record.sessionId });
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    try {
      return await this.http.request<SessionRecord>("GET", `/sessions/${sessionId}`);
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async findSessionsByImageId(imageId: string): Promise<SessionRecord[]> {
    return await this.http.request<SessionRecord[]>(
      "GET",
      `/sessions?imageId=${encodeURIComponent(imageId)}`
    );
  }

  async findSessionsByContainerId(containerId: string): Promise<SessionRecord[]> {
    return await this.http.request<SessionRecord[]>(
      "GET",
      `/sessions?containerId=${encodeURIComponent(containerId)}`
    );
  }

  async findAllSessions(): Promise<SessionRecord[]> {
    return await this.http.request<SessionRecord[]>("GET", "/sessions");
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.http.request("DELETE", `/sessions/${sessionId}`);
    logger.debug("Session deleted", { sessionId });
  }

  async deleteSessionsByImageId(imageId: string): Promise<void> {
    await this.http.request(
      "DELETE",
      `/sessions?imageId=${encodeURIComponent(imageId)}`
    );
    logger.debug("Sessions deleted by imageId", { imageId });
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const record = await this.findSessionById(sessionId);
    return record !== null;
  }
}

/**
 * MirrorPersistence - HTTP-based Persistence implementation
 */
export class MirrorPersistence implements Persistence {
  readonly definitions: DefinitionRepository;
  readonly images: ImageRepository;
  readonly containers: ContainerRepository;
  readonly sessions: SessionRepository;

  constructor(config: MirrorPersistenceConfig) {
    const http = new HttpClient(config);

    this.definitions = new HttpDefinitionRepository(http);
    this.images = new HttpImageRepository(http);
    this.containers = new HttpContainerRepository(http);
    this.sessions = new HttpSessionRepository(http);

    logger.debug("MirrorPersistence created", { baseUrl: config.baseUrl });
  }
}
