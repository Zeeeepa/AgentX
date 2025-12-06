/**
 * PersistenceImpl - Multi-backend Persistence implementation
 *
 * Uses unstorage for backend-agnostic storage.
 * Supports: Memory, Redis, SQLite, FileSystem, and more.
 *
 * @example
 * ```typescript
 * // Memory (default, for testing)
 * const persistence = createPersistence();
 *
 * // SQLite
 * const persistence = createPersistence({
 *   driver: "sqlite",
 *   path: "./data.db",
 * });
 *
 * // Redis
 * const persistence = createPersistence({
 *   driver: "redis",
 *   url: "redis://localhost:6379",
 * });
 *
 * // FileSystem
 * const persistence = createPersistence({
 *   driver: "fs",
 *   base: "./data",
 * });
 * ```
 */

import { createStorage, type Storage } from "unstorage";
import type {
  Persistence,
  ImageRepository,
  ContainerRepository,
  SessionRepository,
} from "@agentxjs/types/runtime/internal";
import { createLogger } from "@agentxjs/common";
import {
  StorageImageRepository,
  StorageContainerRepository,
  StorageSessionRepository,
} from "./repository";

const logger = createLogger("persistence/Persistence");

/**
 * Storage driver type
 */
export type StorageDriver = "memory" | "fs" | "redis" | "sqlite";

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  /**
   * Storage driver (default: "memory")
   */
  driver?: StorageDriver;

  /**
   * File path for sqlite driver
   */
  path?: string;

  /**
   * Base directory for fs driver
   */
  base?: string;

  /**
   * Redis URL for redis driver
   */
  url?: string;

  /**
   * Custom unstorage instance (advanced)
   */
  storage?: Storage;
}

/**
 * PersistenceImpl - Multi-backend Persistence implementation
 */
export class PersistenceImpl implements Persistence {
  readonly images: ImageRepository;
  readonly containers: ContainerRepository;
  readonly sessions: SessionRepository;

  private readonly storage: Storage;

  constructor(config: PersistenceConfig = {}) {
    // Use custom storage or create one based on driver
    this.storage = config.storage ?? createStorageFromConfig(config);

    // Create repositories
    this.images = new StorageImageRepository(this.storage);
    this.containers = new StorageContainerRepository(this.storage);
    this.sessions = new StorageSessionRepository(this.storage);

    logger.info("Persistence created", { driver: config.driver ?? "memory" });
  }

  /**
   * Get the underlying storage instance
   */
  getStorage(): Storage {
    return this.storage;
  }

  /**
   * Dispose and cleanup resources
   */
  async dispose(): Promise<void> {
    await this.storage.dispose();
    logger.info("Persistence disposed");
  }
}

/**
 * Create storage instance from config
 */
function createStorageFromConfig(config: PersistenceConfig): Storage {
  const driver = config.driver ?? "memory";

  switch (driver) {
    case "memory":
      return createStorage();

    case "fs":
      // Lazy import to avoid bundling fs driver in browser
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fsDriver = require("unstorage/drivers/fs").default;
      return createStorage({
        driver: fsDriver({ base: config.base ?? "./data" }),
      });

    case "redis":
      // Lazy import
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const redisDriver = require("unstorage/drivers/redis").default;
      return createStorage({
        driver: redisDriver({ url: config.url ?? "redis://localhost:6379" }),
      });

    case "sqlite":
      // unstorage uses db0 for SQLite
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const db0Driver = require("unstorage/drivers/db0").default;
      return createStorage({
        driver: db0Driver({
          connector: "better-sqlite3",
          options: { path: config.path ?? "./data.db" },
        }),
      });

    default:
      throw new Error(`Unknown storage driver: ${driver}`);
  }
}

/**
 * Create Persistence instance
 *
 * @param config - Configuration options
 * @returns Persistence instance
 */
export function createPersistence(config?: PersistenceConfig): PersistenceImpl {
  return new PersistenceImpl(config);
}
