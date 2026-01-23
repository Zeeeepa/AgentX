# @agentxjs/common

Common utilities for the AgentX platform. This package provides shared infrastructure including logging, SQLite database abstraction, path utilities, and ID generation.

## Overview

`@agentxjs/common` is an internal package that provides essential utilities used throughout the AgentX ecosystem. It follows key design principles:

1. **Internal Use**: Designed for AgentX internal packages
2. **Lazy Initialization**: Safe to use at module level before configuration
3. **Pluggable**: External implementations via Runtime injection
4. **Cross-Runtime**: Works in both Bun and Node.js environments

## Installation

```bash
bun add @agentxjs/common
```

## Package Structure

| Module | Import Path               | Purpose                                          |
| ------ | ------------------------- | ------------------------------------------------ |
| Logger | `@agentxjs/common`        | Lazy-initialized logging with pluggable backends |
| SQLite | `@agentxjs/common/sqlite` | Cross-runtime SQLite database abstraction        |
| Path   | `@agentxjs/common/path`   | Cross-runtime path utilities                     |
| ID     | `@agentxjs/common`        | Unique ID generation utilities                   |

## Logger Module

The logger module provides a platform-agnostic logging interface with lazy initialization, allowing loggers to be created at module level before the runtime is configured.

### Import

```typescript
import { createLogger } from "@agentxjs/common";
```

### createLogger()

Creates a logger instance with lazy initialization.

```typescript
function createLogger(name: string): Logger;
```

**Parameters:**

- `name` - Logger name (hierarchical, e.g., "engine/AgentEngine")

**Returns:** Logger instance (lazy proxy)

### Logger Interface

```typescript
interface Logger {
  readonly name: string;
  readonly level: LogLevel;

  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string | Error, context?: LogContext): void;

  isDebugEnabled(): boolean;
  isInfoEnabled(): boolean;
  isWarnEnabled(): boolean;
  isErrorEnabled(): boolean;
}
```

### Log Levels

The logger supports five log levels in order of severity:

| Level    | Value | Description                    |
| -------- | ----- | ------------------------------ |
| `debug`  | 0     | Detailed debugging information |
| `info`   | 1     | General informational messages |
| `warn`   | 2     | Warning conditions             |
| `error`  | 3     | Error conditions               |
| `silent` | 4     | Suppress all logging           |

```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
```

### Log Context

Additional metadata can be passed to log methods:

```typescript
type LogContext = Record<string, unknown>;
```

### Basic Usage

```typescript
import { createLogger } from "@agentxjs/common";

// Safe at module level (before Runtime configured)
const logger = createLogger("engine/AgentEngine");

// Later, at runtime
logger.debug("Processing event", { agentId: "agent_123", eventType: "text_delta" });
logger.info("Agent initialized", { agentId: "agent_123" });
logger.warn("Connection retry", { attempt: 3, maxAttempts: 5 });
logger.error("Failed to process message", { messageId: "msg_456" });
```

### Error Logging

The error method accepts both strings and Error objects:

```typescript
// String message
logger.error("Something went wrong", { context: "additional info" });

// Error object (stack trace is automatically included)
try {
  throw new Error("Connection failed");
} catch (err) {
  logger.error(err, { connectionId: "conn_123" });
}
```

### Level Checking

Check if a log level is enabled before performing expensive operations:

```typescript
if (logger.isDebugEnabled()) {
  const debugInfo = computeExpensiveDebugInfo();
  logger.debug("Debug details", debugInfo);
}
```

### ConsoleLogger

The default logger implementation with color and timestamp support:

```typescript
import { ConsoleLogger } from "@agentxjs/common";

const logger = new ConsoleLogger("myapp/module", {
  level: "debug", // Log level (default: "info")
  colors: true, // Enable ANSI colors (default: auto-detect)
  timestamps: true, // Include timestamps (default: true)
});
```

### Custom Logger Factory

Integrate custom logging libraries by providing a LoggerFactory:

```typescript
import { setLoggerFactory } from "@agentxjs/common";
import type { LoggerFactory } from "@agentxjs/types";

// Create a custom factory (e.g., using pino)
const pinoFactory: LoggerFactory = {
  getLogger(name: string) {
    return new PinoLogger(name);
  },
};

// Set the factory (typically done by Runtime initialization)
setLoggerFactory(pinoFactory);
```

### LoggerFactoryImpl

The internal factory implementation supports configuration:

```typescript
import { LoggerFactoryImpl } from "@agentxjs/common";

LoggerFactoryImpl.configure({
  defaultLevel: "debug",
  consoleOptions: {
    colors: false,
    timestamps: true,
  },
});
```

## SQLite Module

The SQLite module provides a unified database abstraction that automatically detects the runtime environment and uses the appropriate SQLite implementation.

### Import

```typescript
import { openDatabase } from "@agentxjs/common/sqlite";
```

### Runtime Detection

| Runtime     | SQLite Implementation    |
| ----------- | ------------------------ |
| Bun         | `bun:sqlite` (built-in)  |
| Node.js 22+ | `node:sqlite` (built-in) |

### openDatabase()

Opens a SQLite database connection.

```typescript
function openDatabase(path: string): Database;
```

**Parameters:**

- `path` - Database file path (use `:memory:` for in-memory database)

**Returns:** Database instance

**Features:**

- Auto-detects runtime (Bun or Node.js 22+)
- Auto-creates parent directories for the database file
- Zero external dependencies

### Database Interface

```typescript
interface Database {
  /** Execute raw SQL (no return value) */
  exec(sql: string): void;

  /** Prepare a statement for execution */
  prepare(sql: string): Statement;

  /** Close the database connection */
  close(): void;
}
```

### Statement Interface

```typescript
interface Statement {
  /** Execute statement with parameters, return result */
  run(...params: unknown[]): RunResult;

  /** Get single row */
  get(...params: unknown[]): unknown;

  /** Get all rows */
  all(...params: unknown[]): unknown[];
}
```

### RunResult Interface

```typescript
interface RunResult {
  /** Number of rows changed */
  changes: number;

  /** Last inserted row ID */
  lastInsertRowid: number | bigint;
}
```

### Basic Usage

```typescript
import { openDatabase } from "@agentxjs/common/sqlite";

// Open database (creates parent directories automatically)
const db = openDatabase("./data/app.db");

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Insert data
const insertStmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
const result = insertStmt.run("Alice", "alice@example.com");
console.log("Inserted ID:", result.lastInsertRowid);

// Query single row
const getStmt = db.prepare("SELECT * FROM users WHERE id = ?");
const user = getStmt.get(1);
console.log("User:", user);

// Query all rows
const allStmt = db.prepare("SELECT * FROM users");
const users = allStmt.all();
console.log("All users:", users);

// Close connection
db.close();
```

### In-Memory Database

```typescript
import { openDatabase } from "@agentxjs/common/sqlite";

// Create in-memory database for testing
const db = openDatabase(":memory:");

db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)");
db.prepare("INSERT INTO test (value) VALUES (?)").run("hello");

const rows = db.prepare("SELECT * FROM test").all();
console.log(rows); // [{ id: 1, value: "hello" }]

db.close();
```

### Parameterized Queries

```typescript
// Positional parameters
const stmt = db.prepare("SELECT * FROM users WHERE name = ? AND active = ?");
const users = stmt.all("Alice", 1);

// Multiple inserts with prepared statement
const insertStmt = db.prepare("INSERT INTO logs (level, message) VALUES (?, ?)");
insertStmt.run("info", "Application started");
insertStmt.run("debug", "Loading configuration");
insertStmt.run("error", "Connection failed");
```

## Path Module

The path module provides cross-runtime path utilities that work consistently in both Bun and Node.js environments.

### Import

```typescript
import {
  getModuleDir,
  getPackageRoot,
  getMonorepoRoot,
  resolveFromRoot,
  resolveFromPackage,
} from "@agentxjs/common/path";
```

### getModuleDir()

Gets the directory of the current module (equivalent to `__dirname` in CommonJS).

```typescript
function getModuleDir(meta: ImportMeta): string;
```

**Parameters:**

- `meta` - Pass `import.meta` from your module

**Returns:** Absolute path to the directory containing the module

```typescript
import { getModuleDir } from "@agentxjs/common/path";

const __dirname = getModuleDir(import.meta);
// e.g., "/Users/sean/AgentX/packages/common/src"
```

### getPackageRoot()

Gets the root directory of the current package (where `package.json` is located).

```typescript
function getPackageRoot(meta: ImportMeta): string;
```

**Parameters:**

- `meta` - Pass `import.meta` from your module

**Returns:** Absolute path to the package root

```typescript
import { getPackageRoot } from "@agentxjs/common/path";

const pkgRoot = getPackageRoot(import.meta);
// e.g., "/Users/sean/AgentX/packages/queue"
```

### getMonorepoRoot()

Gets the monorepo root directory by searching for common workspace markers.

```typescript
function getMonorepoRoot(meta: ImportMeta): string;
```

**Parameters:**

- `meta` - Pass `import.meta` from your module

**Returns:** Absolute path to the monorepo root

**Markers searched (in order):**

1. `pnpm-workspace.yaml`
2. `pnpm-lock.yaml`
3. `bun.lock`
4. `bun.lockb`
5. `package-lock.json`
6. `yarn.lock`
7. Root `package.json` (fallback)

```typescript
import { getMonorepoRoot } from "@agentxjs/common/path";

const root = getMonorepoRoot(import.meta);
// e.g., "/Users/sean/AgentX"
```

### resolveFromRoot()

Resolves a path relative to the monorepo root.

```typescript
function resolveFromRoot(meta: ImportMeta, ...paths: string[]): string;
```

**Parameters:**

- `meta` - Pass `import.meta` from your module
- `paths` - Path segments to resolve

**Returns:** Absolute resolved path

```typescript
import { resolveFromRoot } from "@agentxjs/common/path";

const dataDir = resolveFromRoot(import.meta, "data");
// e.g., "/Users/sean/AgentX/data"

const config = resolveFromRoot(import.meta, "packages", "config", "settings.json");
// e.g., "/Users/sean/AgentX/packages/config/settings.json"
```

### resolveFromPackage()

Resolves a path relative to the current package root.

```typescript
function resolveFromPackage(meta: ImportMeta, ...paths: string[]): string;
```

**Parameters:**

- `meta` - Pass `import.meta` from your module
- `paths` - Path segments to resolve

**Returns:** Absolute resolved path

```typescript
import { resolveFromPackage } from "@agentxjs/common/path";

const testsDir = resolveFromPackage(import.meta, "tests");
// e.g., "/Users/sean/AgentX/packages/queue/tests"

const fixtures = resolveFromPackage(import.meta, "tests", "fixtures", "data.json");
// e.g., "/Users/sean/AgentX/packages/queue/tests/fixtures/data.json"
```

### Why Not Use import.meta.dir?

While Bun provides `import.meta.dir`, Node.js does not support this property. Using the path utilities ensures cross-runtime compatibility:

```typescript
// Don't do this - Node.js incompatible
const dir = import.meta.dir;

// Do this instead - works in both Bun and Node.js
import { getModuleDir } from "@agentxjs/common/path";
const dir = getModuleDir(import.meta);
```

## ID Module

The ID module provides consistent ID generation patterns across the AgentX platform.

### Import

```typescript
import { generateId, generateRequestId } from "@agentxjs/common";
```

### generateRequestId()

Generates a unique request ID for command request/response correlation.

```typescript
function generateRequestId(): string;
```

**Returns:** Request ID in format `req_{timestamp}_{random}`

```typescript
import { generateRequestId } from "@agentxjs/common";

const requestId = generateRequestId();
// e.g., "req_1704067200000_a1b2c3"
```

### generateId()

Generates a unique ID with a custom prefix.

```typescript
function generateId(prefix: string): string;
```

**Parameters:**

- `prefix` - The prefix for the ID (e.g., "msg", "agent", "session")

**Returns:** ID in format `{prefix}_{timestamp}_{random}`

```typescript
import { generateId } from "@agentxjs/common";

const msgId = generateId("msg");
// e.g., "msg_1704067200000_a1b2c3"

const agentId = generateId("agent");
// e.g., "agent_1704067200000_x7y8z9"

const sessionId = generateId("session");
// e.g., "session_1704067200000_d4e5f6"
```

## Complete Example

A comprehensive example demonstrating all modules:

```typescript
import { createLogger, generateId, generateRequestId } from "@agentxjs/common";
import { openDatabase } from "@agentxjs/common/sqlite";
import { getModuleDir, resolveFromPackage } from "@agentxjs/common/path";

// Create logger
const logger = createLogger("app/main");

// Get paths
const __dirname = getModuleDir(import.meta);
const dbPath = resolveFromPackage(import.meta, "data", "app.db");

logger.info("Starting application", { cwd: __dirname, dbPath });

// Open database
const db = openDatabase(dbPath);

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    content TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Generate IDs and insert data
const id = generateId("record");
const requestId = generateRequestId();

const stmt = db.prepare("INSERT INTO requests (id, request_id, content) VALUES (?, ?, ?)");
stmt.run(id, requestId, "Hello, World!");

logger.info("Request saved", { id, requestId });

// Query data
const requests = db.prepare("SELECT * FROM requests").all();
logger.debug("All requests", { count: requests.length });

// Cleanup
db.close();
logger.info("Application shutdown complete");
```

## API Reference

### Logger Exports

| Export              | Type     | Description                            |
| ------------------- | -------- | -------------------------------------- |
| `createLogger`      | Function | Create a logger instance               |
| `setLoggerFactory`  | Function | Set external logger factory            |
| `ConsoleLogger`     | Class    | Default console-based logger           |
| `LoggerFactoryImpl` | Class    | Internal logger factory implementation |

### SQLite Exports

| Export         | Type      | Description                   |
| -------------- | --------- | ----------------------------- |
| `openDatabase` | Function  | Open a SQLite database        |
| `Database`     | Interface | Database connection interface |
| `Statement`    | Interface | Prepared statement interface  |
| `RunResult`    | Interface | Query execution result        |

### Path Exports

| Export               | Type     | Description                     |
| -------------------- | -------- | ------------------------------- |
| `getModuleDir`       | Function | Get current module directory    |
| `getPackageRoot`     | Function | Get package root directory      |
| `getMonorepoRoot`    | Function | Get monorepo root directory     |
| `resolveFromRoot`    | Function | Resolve path from monorepo root |
| `resolveFromPackage` | Function | Resolve path from package root  |

### ID Exports

| Export              | Type     | Description                    |
| ------------------- | -------- | ------------------------------ |
| `generateId`        | Function | Generate ID with custom prefix |
| `generateRequestId` | Function | Generate request ID            |

## Related

- [@agentxjs/types](./types.md) - Type definitions
- [@agentxjs/agent](./agent.md) - Agent engine
- [@agentxjs/runtime](./runtime.md) - Runtime architecture
- [Architecture Overview](../concepts/overview.md) - System architecture
