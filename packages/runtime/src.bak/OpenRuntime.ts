/**
 * OpenRuntime - Open source Runtime implementation
 *
 * Implements Runtime interface for Node.js platform.
 * Creates and manages Containers, which in turn manage Agents.
 *
 * Architecture:
 * ```
 * OpenRuntime
 *   ├── bus: SystemBus (singleton, shared)
 *   └── createContainer(containerId) → ContainerImpl
 *         └── run(definition) → Agent
 * ```
 *
 * @example
 * ```typescript
 * import { openRuntime } from "@agentxjs/runtime";
 *
 * const runtime = openRuntime();
 * const container = runtime.createContainer("my-container");
 * const agent = container.run({ name: "Assistant", systemPrompt: "..." });
 *
 * agent.on("text_delta", (e) => console.log(e.data.text));
 * await agent.receive("Hello!");
 *
 * runtime.dispose();
 * ```
 */

import type { LoggerFactory, Persistence, ContainerRecord } from "@agentxjs/types";
import type { Runtime } from "@agentxjs/types/runtime";
import type { Container, Unsubscribe } from "@agentxjs/types/runtime/internal";
import { Subject } from "rxjs";
import { createLogger, setLoggerFactory } from "@agentxjs/common";
import { SystemBusImpl } from "./SystemBusImpl";
import { ContainerImpl } from "./container";
import { FileLoggerFactory, type FileLoggerFactoryOptions } from "./runtime";
import { homedir } from "node:os";
import { join } from "node:path";

const logger = createLogger("runtime/OpenRuntime");

/**
 * OpenRuntime configuration
 */
export interface OpenRuntimeConfig {
  /**
   * Persistence layer for data storage
   * Required for container/session management
   */
  persistence: Persistence;

  /**
   * Logger factory or config
   * @default FileLoggerFactory at ~/.agentx/logs/
   */
  logger?: LoggerFactory | FileLoggerFactoryOptions;

  /**
   * Base path for all AgentX data
   * @default ~/.agentx
   */
  basePath?: string;
}

/**
 * OpenRuntime - Open source Runtime implementation
 */
export class OpenRuntime implements Runtime {
  private readonly bus: SystemBusImpl;
  private readonly persistence: Persistence;
  private readonly loggerFactory: LoggerFactory;
  private readonly basePath: string;
  /** In-memory cache of active containers */
  private readonly containers = new Map<string, Container>();
  private readonly eventSubject = new Subject<unknown>();

  constructor(config: OpenRuntimeConfig) {
    this.basePath = config.basePath ?? join(homedir(), ".agentx");
    this.persistence = config.persistence;

    // 1. Initialize logger factory first
    this.loggerFactory = this.resolveLoggerFactory(config.logger);
    setLoggerFactory(this.loggerFactory);

    logger.info("Initializing OpenRuntime");

    // 2. Create SystemBus (singleton for this runtime)
    this.bus = new SystemBusImpl();

    logger.info("OpenRuntime initialized", { basePath: this.basePath });
  }

  // ==================== Container Management ====================

  /**
   * Create a Container for managing Agent instances
   *
   * Creates both:
   * - ContainerRecord in persistence (for durability)
   * - ContainerImpl in memory (for runtime operations)
   */
  async createContainer(containerId: string): Promise<Container> {
    // Check if container already exists in memory cache
    const cached = this.containers.get(containerId);
    if (cached) {
      logger.debug("Returning cached container", { containerId });
      return cached;
    }

    // Check if container exists in persistence
    const existingRecord = await this.persistence.containers.findContainerById(containerId);
    if (existingRecord) {
      logger.debug("Loading existing container from persistence", { containerId });
      return this.loadContainer(existingRecord);
    }

    logger.info("Creating new container", { containerId });

    // 1. Create and save ContainerRecord
    const now = Date.now();
    const record: ContainerRecord = {
      containerId,
      createdAt: now,
      updatedAt: now,
    };
    await this.persistence.containers.saveContainer(record);

    // 2. Create ContainerImpl in memory
    return this.loadContainer(record);
  }

  /**
   * Get a Container by ID
   *
   * Returns cached instance or loads from persistence.
   */
  async getContainer(containerId: string): Promise<Container | undefined> {
    // Check memory cache first
    const cached = this.containers.get(containerId);
    if (cached) {
      return cached;
    }

    // Load from persistence
    const record = await this.persistence.containers.findContainerById(containerId);
    if (!record) {
      return undefined;
    }

    return this.loadContainer(record);
  }

  /**
   * List all Containers
   */
  async listContainers(): Promise<Container[]> {
    const records = await this.persistence.containers.findAllContainers();
    return Promise.all(records.map((record) => this.loadContainer(record)));
  }

  /**
   * Load a Container from record into memory
   */
  private loadContainer(record: ContainerRecord): Container {
    // Check cache first (may have been loaded by another call)
    const cached = this.containers.get(record.containerId);
    if (cached) {
      return cached;
    }

    const container = new ContainerImpl({
      containerId: record.containerId,
      bus: this.bus,
      basePath: this.basePath,
      persistence: this.persistence,
    });

    this.containers.set(record.containerId, container);

    return container;
  }

  // ==================== Event Infrastructure ====================

  /**
   * Subscribe to runtime events
   */
  on(handler: (event: unknown) => void): Unsubscribe {
    const subscription = this.eventSubject.subscribe(handler);

    // Also subscribe to SystemBus
    const busUnsub = this.bus.onAny(handler);

    return () => {
      subscription.unsubscribe();
      busUnsub();
    };
  }

  /**
   * Emit an event to the runtime
   */
  emit(event: unknown): void {
    this.eventSubject.next(event);
    this.bus.emit(event as any);
  }

  // ==================== Lifecycle ====================

  /**
   * Dispose runtime and all containers
   */
  dispose(): void {
    logger.info("Disposing OpenRuntime");

    // Dispose all containers
    for (const container of this.containers.values()) {
      container.dispose().catch((err) => {
        logger.error("Error disposing container", { error: err });
      });
    }
    this.containers.clear();

    // Destroy bus
    this.bus.destroy();

    // Complete event subject
    this.eventSubject.complete();

    logger.info("OpenRuntime disposed");
  }

  // ==================== Private Helpers ====================

  private resolveLoggerFactory(
    config: LoggerFactory | FileLoggerFactoryOptions | undefined
  ): LoggerFactory {
    if (config && "getLogger" in config) {
      return config;
    }
    return new FileLoggerFactory(config);
  }
}

/**
 * Create an open source Runtime
 *
 * @example
 * ```typescript
 * import { createNodePersistence } from "@agentxjs/persistence";
 *
 * // With memory persistence (for testing)
 * const runtime = openRuntime({
 *   persistence: createNodePersistence(),
 * });
 *
 * // With SQLite persistence
 * const runtime = openRuntime({
 *   persistence: createNodePersistence({ driver: "sqlite", path: "./data.db" }),
 * });
 * ```
 */
export function openRuntime(config: OpenRuntimeConfig): Runtime {
  return new OpenRuntime(config);
}
