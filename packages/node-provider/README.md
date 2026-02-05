# @agentxjs/node-provider

Node.js platform provider for AgentX. Supplies concrete implementations of persistence, workspace, network, message queue, and logging for server-side environments. The provider assembles these components into an `AgentXProvider` that can be passed to the AgentX runtime.

## Installation

```bash
bun add @agentxjs/node-provider
```

## Quick Start

```typescript
import { createNodeProvider } from "@agentxjs/node-provider";

const provider = await createNodeProvider({
  dataPath: "./data",
});

// provider.containerRepository  - SQLite-backed container storage
// provider.imageRepository      - SQLite-backed image storage
// provider.sessionRepository    - SQLite-backed session storage
// provider.workspaceProvider    - File system workspace isolation
// provider.eventBus             - In-memory event bus
```

### Deferred Initialization

Use `nodeProvider()` when you need lazy initialization, for example when passing configuration to a server factory:

```typescript
import { nodeProvider } from "@agentxjs/node-provider";

const config = nodeProvider({ dataPath: "./data" });

// Provider is not created until resolve() is called
const provider = await config.resolve();
```

## Configuration

### NodeProviderOptions

| Option     | Type       | Default    | Description                                                    |
|------------|------------|------------|----------------------------------------------------------------|
| `dataPath` | `string`   | `"./data"` | Base directory for all data storage (SQLite database, workspaces) |
| `logDir`   | `string`   | --         | Directory for log files. If provided, enables file logging instead of console output |
| `logLevel` | `LogLevel` | `"debug"` (file) / `"info"` (console) | Log verbosity: `"debug"`, `"info"`, `"warn"`, `"error"`, or `"silent"` |

```typescript
const provider = await createNodeProvider({
  dataPath: "./data",
  logDir: ".agentx/logs",
  logLevel: "info",
});
```

When `logDir` is specified, all log output is written to `<logDir>/app.log`. You can monitor logs in real time:

```bash
tail -f .agentx/logs/app.log
```

## Components

### Persistence

SQLite-backed repositories for containers, images, and sessions. Built on [unstorage](https://unstorage.unjs.io/) with a custom SQLite driver powered by `commonxjs/sqlite` for cross-runtime support (Bun via `bun:sqlite`, Node.js 22+ via `node:sqlite`).

```typescript
import { createPersistence, sqliteDriver, memoryDriver } from "@agentxjs/node-provider/persistence";

// SQLite persistence (production)
const persistence = await createPersistence(
  sqliteDriver({ path: "./data/agentx.db" })
);

// In-memory persistence (testing)
const persistence = await createPersistence(memoryDriver());

// Repositories
await persistence.containers.saveContainer(record);
await persistence.containers.findContainerById("container-1");
await persistence.containers.findAllContainers();

await persistence.images.saveImage(imageRecord);
await persistence.images.findImagesByName("Assistant");
await persistence.images.findImagesByContainerId("container-1");

await persistence.sessions.saveSession(sessionRecord);
await persistence.sessions.addMessage(sessionId, message);
await persistence.sessions.getMessages(sessionId);
```

**Repositories provided:**

- `StorageContainerRepository` -- CRUD operations for container records
- `StorageImageRepository` -- CRUD operations for image records with secondary indexes by name and container
- `StorageSessionRepository` -- CRUD operations for session records with message storage and indexes by image and container

**Drivers:**

- `sqliteDriver({ path })` -- Persistent storage using SQLite. Auto-creates parent directories. Uses WAL mode for the message queue schema.
- `memoryDriver()` -- Ephemeral in-memory storage for testing. Data is lost when the process exits.

### Workspace

`FileWorkspaceProvider` creates isolated file system directories for each agent, organized by container and image.

```typescript
import { FileWorkspaceProvider } from "@agentxjs/node-provider";

const workspaceProvider = new FileWorkspaceProvider({
  basePath: "./data/workspaces",
});

// Create a workspace for an agent
const workspace = await workspaceProvider.create({
  containerId: "container-1",
  imageId: "image-1",
  name: "my-workspace",
});

// Initialize the directory on disk
await workspace.initialize();

// Access workspace properties
console.log(workspace.id);    // "ws_container-1_image-1_lq5x4g2_a1b2"
console.log(workspace.path);  // "./data/workspaces/container-1/image-1"

// Cleanup when done
await workspace.cleanup();
```

Each workspace provides:

- `initialize()` -- Creates the directory (recursive `mkdir`)
- `exists()` -- Checks if the directory exists on disk
- `cleanup()` -- Removes the directory and its contents

### Network

WebSocket server and connection management built on the `ws` library. Implements the `ChannelServer` and `ChannelConnection` interfaces from `@agentxjs/core`.

```typescript
import { WebSocketServer } from "@agentxjs/node-provider/network";

const server = new WebSocketServer({ heartbeat: true, heartbeatInterval: 30000 });

// Standalone mode -- listen on a port
await server.listen(5200);

// Or attach to an existing HTTP server
server.attach(httpServer, "/ws");

// Handle connections
server.onConnection((connection) => {
  console.log("Connected:", connection.id);

  connection.onMessage((message) => {
    console.log("Received:", message);
  });

  // Fire-and-forget send
  connection.send(JSON.stringify({ type: "hello" }));

  // Reliable delivery with ACK confirmation
  connection.sendReliable(JSON.stringify({ type: "event", data: "important" }), {
    onAck: () => console.log("Client confirmed receipt"),
    timeout: 5000,
    onTimeout: () => console.log("No ACK received within timeout"),
  });

  connection.onClose(() => {
    console.log("Disconnected:", connection.id);
  });
});

// Broadcast to all connected clients
server.broadcast(JSON.stringify({ type: "announcement" }));

// Shutdown
await server.close();
```

**WebSocketServer** supports two modes:

- **Standalone** -- Call `listen(port, host?)` to start a new WebSocket server
- **Attached** -- Call `attach(httpServer, path?)` to handle WebSocket upgrades on an existing HTTP server (`noServer` mode)

**WebSocketConnection** features:

- **Heartbeat** -- Automatic ping/pong with configurable interval. Terminates unresponsive clients.
- **Reliable delivery** -- `sendReliable()` wraps messages with a `__msgId`, waits for the client to respond with `__ack`, and triggers `onAck` or `onTimeout` callbacks.
- **Event handlers** -- `onMessage`, `onClose`, `onError` with unsubscribe support.

### Message Queue

`SqliteMessageQueue` combines RxJS-based in-memory pub/sub for real-time delivery with SQLite persistence for recovery after disconnections.

```typescript
import { SqliteMessageQueue } from "@agentxjs/node-provider/mq";

const queue = SqliteMessageQueue.create("./data/queue.db", {
  retentionMs: 86400000, // 24 hours (default)
});

// Subscribe to a topic (real-time, in-memory)
const unsubscribe = queue.subscribe("session-123", (entry) => {
  console.log(entry.offset, entry.event);
});

// Publish an event (persisted to SQLite + broadcast to subscribers)
const offset = await queue.publish("session-123", {
  type: "text_delta",
  data: { text: "Hello" },
});

// Acknowledge processing (update consumer position)
await queue.ack("connection-1", "session-123", offset);

// Recover missed events after reconnection
const lastOffset = await queue.getOffset("connection-1", "session-123");
const missed = await queue.recover("session-123", lastOffset ?? undefined);

// Cleanup
await queue.close();
```

**Key characteristics:**

- Real-time delivery through RxJS `Subject` (in-memory, zero latency)
- SQLite persistence for durability and recovery
- Consumer offset tracking for at-least-once delivery
- Automatic cleanup of old entries based on retention policy (default: 24 hours, checked every 5 minutes)
- WAL journal mode for concurrent read/write performance

**OffsetGenerator** produces monotonically increasing, lexicographically sortable offsets in the format `{timestamp_base36}-{sequence}` (e.g., `lq5x4g2-0001`).

### Logger

`FileLoggerFactory` writes structured log output to a file, useful for TUI applications or production deployments where console output is not practical.

```typescript
import { FileLoggerFactory } from "@agentxjs/node-provider";
import { setLoggerFactory } from "commonxjs/logger";

const factory = new FileLoggerFactory({
  logDir: ".agentx/logs",
  level: "info",
  filename: "app.log", // default
});

// Register as the global logger factory
setLoggerFactory(factory);
```

Log format:

```
2025-01-15T10:30:00.000Z INFO  [node-provider/WebSocketServer] WebSocket server listening {"port":5200,"host":"0.0.0.0"}
```

When using `createNodeProvider` with `logDir` set, file logging is configured automatically.

## API Reference

### createNodeProvider(options?)

Creates and returns an `AgentXProvider` with all components initialized. This is the primary entry point.

```typescript
function createNodeProvider(options?: NodeProviderOptions): Promise<AgentXProvider>
```

The returned `AgentXProvider` contains:

| Property                | Type                        | Description                     |
|-------------------------|-----------------------------|---------------------------------|
| `containerRepository`   | `ContainerRepository`       | Container CRUD operations       |
| `imageRepository`       | `ImageRepository`           | Image CRUD operations           |
| `sessionRepository`     | `SessionRepository`         | Session and message operations  |
| `workspaceProvider`     | `WorkspaceProvider`         | File system workspace manager   |
| `eventBus`              | `EventBus`                  | In-memory event pub/sub         |

The provider handles persistence, workspace, and event bus concerns only. The AI driver (e.g., Claude) is injected separately at the runtime level.

### nodeProvider(options?)

Creates a deferred provider configuration. The provider is not initialized until `resolve()` is called.

```typescript
function nodeProvider(options?: NodeProviderOptions): DeferredProviderConfig
```

```typescript
const deferred = nodeProvider({ dataPath: "./data" });

// Later, when needed:
const provider = await deferred.resolve();
```

### isDeferredProvider(value)

Type guard to check whether a value is a `DeferredProviderConfig`.

```typescript
function isDeferredProvider(value: unknown): value is DeferredProviderConfig
```

## Sub-path Exports

The package exposes additional entry points for direct access to individual modules:

| Import path                         | Exports                                          |
|-------------------------------------|--------------------------------------------------|
| `@agentxjs/node-provider`           | Everything (main entry)                          |
| `@agentxjs/node-provider/persistence` | `createPersistence`, `sqliteDriver`, `memoryDriver`, repository classes |
| `@agentxjs/node-provider/mq`       | `SqliteMessageQueue`, `OffsetGenerator`          |
| `@agentxjs/node-provider/network`  | `WebSocketServer`, `WebSocketConnection`         |

## Dependencies

- `@agentxjs/core` -- Core interfaces (`ContainerRepository`, `ImageRepository`, `SessionRepository`, `WorkspaceProvider`, `EventBus`, `ChannelServer`, `MessageQueue`)
- `commonxjs` -- Cross-runtime SQLite and logging utilities
- `rxjs` -- Reactive streams for in-memory pub/sub
- `unstorage` -- Backend-agnostic key-value storage abstraction
- `ws` -- WebSocket implementation for Node.js

## License

See the repository root for license information.
