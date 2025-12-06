/**
 * PersistenceImpl - Multi-backend Persistence implementation
 *
 * Uses unstorage for backend-agnostic storage.
 * Supports: Memory, FileSystem, Redis, MongoDB, SQLite, MySQL, PostgreSQL
 *
 * @example
 * ```typescript
 * // Memory (default)
 * const persistence = createPersistence();
 *
 * // SQLite
 * const persistence = createPersistence({
 *   driver: "sqlite",
 *   path: "./data.db",
 * });
 *
 * // PostgreSQL
 * const persistence = createPersistence({
 *   driver: "postgresql",
 *   url: "postgres://user:pass@localhost:5432/agentx",
 * });
 *
 * // Redis
 * const persistence = createPersistence({
 *   driver: "redis",
 *   url: "redis://localhost:6379",
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
export type StorageDriver =
  | "memory"
  | "fs"
  | "redis"
  | "mongodb"
  | "sqlite"
  | "mysql"
  | "postgresql";

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  /**
   * Storage driver (default: "memory")
   */
  driver?: StorageDriver;

  /**
   * File path (for sqlite, fs drivers)
   * @example "./data.db" for sqlite
   * @example "./data" for fs
   */
  path?: string;

  /**
   * Connection URL (for redis, mongodb, mysql, postgresql)
   * @example "redis://localhost:6379"
   * @example "mongodb://localhost:27017/agentx"
   * @example "mysql://user:pass@localhost:3306/agentx"
   * @example "postgres://user:pass@localhost:5432/agentx"
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
        driver: fsDriver({ base: config.path ?? "./data" }),
      });

    case "redis":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const redisDriver = require("unstorage/drivers/redis").default;
      return createStorage({
        driver: redisDriver({ url: config.url ?? "redis://localhost:6379" }),
      });

    case "mongodb":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mongoDriver = require("unstorage/drivers/mongodb").default;
      return createStorage({
        driver: mongoDriver({
          connectionString: config.url ?? "mongodb://localhost:27017",
          databaseName: "agentx",
          collectionName: "storage",
        }),
      });

    case "sqlite":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sqliteDriver = require("unstorage/drivers/db0").default;
      return createStorage({
        driver: sqliteDriver({
          connector: "better-sqlite3",
          options: { path: config.path ?? "./data.db" },
        }),
      });

    case "mysql":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mysqlDriver = require("unstorage/drivers/db0").default;
      return createStorage({
        driver: mysqlDriver({
          connector: "mysql2",
          options: { uri: config.url ?? "mysql://localhost:3306/agentx" },
        }),
      });

    case "postgresql":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pgDriver = require("unstorage/drivers/db0").default;
      return createStorage({
        driver: pgDriver({
          connector: "postgresql",
          options: { connectionString: config.url ?? "postgres://localhost:5432/agentx" },
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
