# @agentxjs/server

WebSocket server for AgentX. Exposes a JSON-RPC 2.0 interface over WebSocket for managing containers, images, agents, and messages remotely. Stream events from running agents are broadcast to subscribed clients as JSON-RPC notifications.

## Installation

```bash
bun add @agentxjs/server
```

## Quick Start

```typescript
import { createServer } from "@agentxjs/server";
import { nodePlatform } from "@agentxjs/node-platform";
import { createMonoDriver } from "@agentxjs/mono-driver";
import type { CreateDriver } from "@agentxjs/core/driver";

const wrappedCreateDriver: CreateDriver = (config) => {
  return createMonoDriver({
    ...config,
    apiKey: process.env.ANTHROPIC_API_KEY!,
    options: { provider: "anthropic" },
  });
};

const server = await createServer({
  platform: nodePlatform({ dataPath: "./data" }),
  createDriver: wrappedCreateDriver,
  port: 5200,
});

await server.listen();
```

## Configuration

The `createServer` function accepts a `ServerConfig` object:

```typescript
interface ServerConfig {
  /** AgentX Platform (immediate or deferred) */
  platform: AgentXPlatform | DeferredPlatformConfig;

  /** LLM Driver factory function - creates a Driver per Agent */
  createDriver: CreateDriver;

  /** Port to listen on in standalone mode (default: 5200) */
  port?: number;

  /** Host to bind to (default: "0.0.0.0") */
  host?: string;

  /** Existing HTTP server to attach to (attached mode) */
  server?: MinimalHTTPServer;

  /** WebSocket path when attached (default: "/ws") */
  wsPath?: string;

  /** Enable debug logging */
  debug?: boolean;
}
```

### platform

An `AgentXPlatform` supplies the repositories (container, image, session), event bus, and workspace provider that the runtime needs. Use `nodePlatform()` from `@agentxjs/node-platform` for Node.js/Bun environments. A `DeferredPlatformConfig` is also supported for lazy initialization.

### createDriver

A `CreateDriver` factory function that creates a `Driver` instance for each agent. The driver handles LLM communication. This is configured separately from the platform so you can inject API keys and driver-specific options:

```typescript
const createDriver: CreateDriver = (config) => {
  return createMonoDriver({
    ...config,
    apiKey: "sk-ant-xxx",
    baseUrl: "https://api.anthropic.com",
    options: { provider: "anthropic" },
  });
};
```

## Architecture

The server is composed of three layers:

```
Client (WebSocket)
    |
    v
+-------------------+
|      Server       |  Accepts connections, routes messages,
|                   |  broadcasts stream events
+-------------------+
    |
    v
+-------------------+
|  CommandHandler   |  Maps JSON-RPC methods to runtime calls,
|                   |  returns RPC responses
+-------------------+
    |
    v
+-------------------+
|  AgentXRuntime    |  Manages agent lifecycle, drives LLM
|                   |  via Driver, emits events to EventBus
+-------------------+
```

**Server** manages WebSocket connections, parses incoming JSON-RPC messages, delegates requests to the `CommandHandler`, and broadcasts stream events from the `EventBus` to subscribed clients.

**CommandHandler** receives an RPC method and params, invokes the corresponding operation on the `AgentXRuntime`, and returns a structured result (success or error).

**AgentXRuntime** orchestrates agent creation, message processing, and lifecycle management. It uses the `CreateDriver` factory to spin up a `Driver` per agent and emits all stream events through the platform's `EventBus`.

## RPC Methods

All methods follow the [JSON-RPC 2.0](https://www.jsonrpc.org/specification) protocol. Requests include an `id`, `method`, and `params`. Responses include the same `id` with either a `result` or `error`.

### Container

| Method | Params | Description |
|---|---|---|
| `container.create` | `{ containerId }` | Create or get an existing container |
| `container.get` | `{ containerId }` | Check if a container exists |
| `container.list` | `{}` | List all container IDs |

**container.create** returns `{ containerId }`.

**container.get** returns `{ containerId, exists }`.

**container.list** returns `{ containerIds: string[] }`.

### Image

| Method | Params | Description |
|---|---|---|
| `image.create` | `{ containerId, name?, description?, systemPrompt?, mcpServers? }` | Create a new image in a container |
| `image.get` | `{ imageId }` | Get an image record by ID |
| `image.list` | `{ containerId? }` | List images, optionally filtered by container |
| `image.delete` | `{ imageId }` | Delete an image |
| `image.run` | `{ imageId, agentId? }` | Run an image (creates or reuses an agent) |
| `image.stop` | `{ imageId }` | Stop the running agent for an image |
| `image.update` | `{ imageId, updates: { name?, description? } }` | Update image metadata |
| `image.messages` | `{ imageId }` | Get conversation messages for an image |

**image.create** returns `{ record, __subscriptions }`. The `__subscriptions` array contains session IDs the client should subscribe to for receiving stream events.

**image.run** returns `{ imageId, agentId, sessionId, containerId, reused }`. If an agent is already running for the image, it is reused and `reused` is `true`.

**image.messages** returns `{ imageId, messages }`.

### Agent

| Method | Params | Description |
|---|---|---|
| `agent.get` | `{ agentId }` | Get agent info (agentId, imageId, containerId, sessionId, lifecycle) |
| `agent.list` | `{ containerId? }` | List agents, optionally filtered by container |
| `agent.destroy` | `{ agentId }` | Destroy a specific agent |
| `agent.destroyAll` | `{ containerId }` | Destroy all agents in a container |
| `agent.interrupt` | `{ agentId }` | Interrupt a running agent's current operation |

**agent.get** returns `{ agent, exists }`. The `agent` field is `null` if not found.

**agent.list** returns `{ agents }` where each entry contains `agentId`, `imageId`, `containerId`, `sessionId`, and `lifecycle`.

### Message

| Method | Params | Description |
|---|---|---|
| `message.send` | `{ agentId?, imageId?, content }` | Send a message to an agent |

Either `agentId` or `imageId` must be provided. When `imageId` is used, the server auto-activates an agent: it reuses an existing running agent for that image, or creates a new one.

`content` can be a plain string or an array of `UserContentPart` objects for multimodal input.

Returns `{ agentId, imageId }`.

## Event Broadcasting

When an agent processes a message, the runtime emits stream events (e.g., `text_delta`, `tool_use_start`, `message_stop`) to the platform's `EventBus`. The server listens to all events on the bus and broadcasts them to connected clients as JSON-RPC notifications.

### Subscription Model

Clients subscribe to topics to receive events. A newly connected client is automatically subscribed to the `global` topic. Clients can subscribe and unsubscribe using JSON-RPC notifications (no `id` field):

```json
{ "jsonrpc": "2.0", "method": "subscribe", "params": { "topic": "session-abc-123" } }
```

```json
{ "jsonrpc": "2.0", "method": "unsubscribe", "params": { "topic": "session-abc-123" } }
```

Topics typically correspond to session IDs. When an RPC response includes a `__subscriptions` array (e.g., from `image.create` or `image.run`), the client should subscribe to those topics to receive stream events for that session.

### Stream Event Format

Broadcast events are sent as JSON-RPC notifications with the method `stream.event`:

```json
{
  "jsonrpc": "2.0",
  "method": "stream.event",
  "params": {
    "topic": "session-abc-123",
    "event": {
      "type": "text_delta",
      "timestamp": 1700000000000,
      "data": { "text": "Hello" },
      "context": { "agentId": "agent_xyz", "sessionId": "session-abc-123" }
    }
  }
}
```

### Reliable Delivery

Stream events are sent using `sendReliable()`, which wraps each message with a `__msgId`. The client must respond with a `control.ack` notification. If no ACK is received within 10 seconds, the server logs a timeout warning.

### Filtering Rules

Not all internal events are broadcast:

- Events with `source: "driver"` are skipped unless their `intent` is `"notification"`.
- Events with `source: "command"` are never broadcast (they are handled via RPC responses).
- Events with `broadcastable: false` are skipped.

## Standalone vs Attached Mode

### Standalone Mode

The server creates its own WebSocket server and listens on a port:

```typescript
const server = await createServer({
  platform: nodePlatform({ dataPath: "./data" }),
  createDriver: wrappedCreateDriver,
  port: 5200,
  host: "0.0.0.0",
});

await server.listen();
```

The `listen()` method accepts optional `port` and `host` overrides. Defaults are port `5200` and host `"0.0.0.0"`.

### Attached Mode

Attach the WebSocket handler to an existing HTTP server (e.g., Hono, Express, or any server implementing `MinimalHTTPServer`):

```typescript
import { createServer as createHttpServer } from "http";

const httpServer = createHttpServer();

const server = await createServer({
  platform: nodePlatform({ dataPath: "./data" }),
  createDriver: wrappedCreateDriver,
  server: httpServer,
  wsPath: "/ws",
});

// The HTTP server handles listen()
httpServer.listen(3000);
```

In attached mode, calling `server.listen()` throws an error. The parent HTTP server is responsible for listening.

### Lifecycle Methods

```typescript
interface AgentXServer {
  /** Start listening (standalone mode only) */
  listen(port?: number, host?: string): Promise<void>;

  /** Close the WebSocket server */
  close(): Promise<void>;

  /** Dispose all resources: WebSocket server, command handler, and runtime */
  dispose(): Promise<void>;
}
```

Call `dispose()` for a full cleanup. It closes the WebSocket server, disposes the command handler, and shuts down the runtime (destroying all agents).

## CLI Usage

The package includes a standalone server binary at `bin/server.ts`:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun run bin/server.ts
```

Or using the package script:

```bash
ANTHROPIC_API_KEY=sk-ant-xxx bun --filter @agentxjs/server dev
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | -- | Claude API key |
| `ANTHROPIC_BASE_URL` | No | -- | Custom API endpoint |
| `PORT` | No | `5200` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `DATA_PATH` | No | `./data` | Data storage directory |
| `LOG_DIR` | No | `<DATA_PATH>/logs` | Log file directory |
| `LOG_LEVEL` | No | `info` | Log level (debug, info, warn, error) |

The CLI creates a `MonoDriver` with the Anthropic provider and uses `nodePlatform` for storage. It handles `SIGINT` and `SIGTERM` for graceful shutdown.

## Exports

```typescript
// Main entry point
export { createServer, type ServerConfig } from "./Server";
export type { AgentXServer } from "./types";
export { CommandHandler } from "./CommandHandler";
```
