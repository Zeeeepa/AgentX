/**
 * Memory Driver - In-memory storage
 *
 * Useful for testing and development.
 * Data is lost when the process exits.
 *
 * @example
 * ```typescript
 * import { createPersistence, memoryDriver } from "@agentxjs/node-platform/persistence";
 *
 * const persistence = await createPersistence(memoryDriver());
 * ```
 */

import { createStorage, type Storage } from "unstorage";
import type { PersistenceDriver } from "./types";

/**
 * Create a memory driver
 */
export function memoryDriver(): PersistenceDriver {
  return {
    async createStorage(): Promise<Storage> {
      return createStorage();
    },
  };
}
