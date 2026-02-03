/**
 * @agentxjs/node-provider
 *
 * Node.js platform provider for AgentX.
 * Provides implementations for persistence, workspace, and network.
 *
 * @example
 * ```typescript
 * // Function style (recommended)
 * import { createServer } from "@agentxjs/server";
 * import { nodeProvider } from "@agentxjs/node-provider";
 *
 * const server = await createServer({
 *   provider: nodeProvider({
 *     dataPath: "./data",
 *     driver: claudeDriver,
 *   }),
 * });
 *
 * // Or use createNodeProvider for more control
 * import { createNodeProvider } from "@agentxjs/node-provider";
 *
 * const provider = await createNodeProvider({
 *   dataPath: "./data",
 * });
 * ```
 */

import type { AgentXProvider } from "@agentxjs/core/runtime";
import type { Driver } from "@agentxjs/core/driver";
import { EventBusImpl } from "@agentxjs/core/event";
import { createPersistence, sqliteDriver } from "./persistence";
import { FileWorkspaceProvider } from "./workspace/FileWorkspaceProvider";
import { join } from "node:path";

/**
 * Options for creating a Node provider
 */
export interface NodeProviderOptions {
  /**
   * Base path for data storage
   * @default "./data"
   */
  dataPath?: string;

  /**
   * LLM Driver instance
   * If not provided, you need to set it before using runtime
   */
  driver?: Driver;
}

/**
 * Deferred provider config - resolved lazily
 */
export interface DeferredProviderConfig {
  readonly __deferred: true;
  readonly options: NodeProviderOptions;
  resolve(): Promise<AgentXProvider>;
}

/**
 * Create a Node.js provider configuration (deferred initialization)
 *
 * Use this for function-style API. The provider is initialized lazily.
 *
 * @param options - Provider options
 * @returns Deferred provider config
 *
 * @example
 * ```typescript
 * const server = await createServer({
 *   provider: nodeProvider({ dataPath: "./data" }),
 * });
 * ```
 */
export function nodeProvider(options: NodeProviderOptions = {}): DeferredProviderConfig {
  return {
    __deferred: true,
    options,
    resolve: () => createNodeProvider(options),
  };
}

/**
 * Create a Node.js provider for AgentX (immediate initialization)
 *
 * @param options - Provider options
 * @returns AgentXProvider instance
 */
export async function createNodeProvider(
  options: NodeProviderOptions = {}
): Promise<AgentXProvider> {
  const dataPath = options.dataPath ?? "./data";

  // Create persistence with SQLite
  const persistence = await createPersistence(
    sqliteDriver({ path: join(dataPath, "agentx.db") })
  );

  // Create workspace provider
  const workspaceProvider = new FileWorkspaceProvider({
    basePath: join(dataPath, "workspaces"),
  });

  // Create event bus
  const eventBus = new EventBusImpl();

  // Create placeholder driver if not provided
  const driver: Driver = options.driver ?? {
    name: "placeholder",
    connect: () => {
      throw new Error("Driver not configured. Please provide a driver in NodeProviderOptions.");
    },
    disconnect: () => {},
    dispose: () => {},
  };

  return {
    containerRepository: persistence.containers,
    imageRepository: persistence.images,
    sessionRepository: persistence.sessions,
    workspaceProvider,
    driver,
    eventBus,
  };
}

/**
 * Check if value is a deferred provider config
 */
export function isDeferredProvider(value: unknown): value is DeferredProviderConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "__deferred" in value &&
    (value as DeferredProviderConfig).__deferred === true
  );
}

// Re-export persistence
export * from "./persistence";

// Re-export workspace
export { FileWorkspaceProvider, type FileWorkspaceProviderOptions } from "./workspace/FileWorkspaceProvider";

// Re-export mq
export { SqliteMessageQueue, OffsetGenerator } from "./mq";

// Re-export network
export { WebSocketServer, WebSocketConnection } from "./network";
