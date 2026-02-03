/**
 * Persistence Module
 *
 * Provides storage implementations for Node.js.
 *
 * @example
 * ```typescript
 * import { createPersistence, sqliteDriver, memoryDriver } from "@agentxjs/node-provider/persistence";
 *
 * // SQLite (persistent)
 * const persistence = await createPersistence(
 *   sqliteDriver({ path: "./data/agentx.db" })
 * );
 *
 * // Memory (testing)
 * const testPersistence = await createPersistence(memoryDriver());
 *
 * // Use repositories
 * await persistence.containers.saveContainer(record);
 * await persistence.images.saveImage(imageRecord);
 * await persistence.sessions.addMessage(sessionId, message);
 * ```
 */

// Types
export type { PersistenceDriver, Persistence } from "./types";

// Factory
export { createPersistence } from "./Persistence";

// Drivers
export { sqliteDriver, type SqliteDriverOptions } from "./sqlite";
export { memoryDriver } from "./memory";

// Repositories (for advanced use cases)
export { StorageContainerRepository } from "./StorageContainerRepository";
export { StorageImageRepository } from "./StorageImageRepository";
export { StorageSessionRepository } from "./StorageSessionRepository";
