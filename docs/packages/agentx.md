# agentxjs Package

> Unified API for AI Agents - Server and Browser

The `agentxjs` package provides a **unified API** for building AI agents that works seamlessly across server (Node.js) and browser environments. It is the main entry point for the AgentX framework.

## Overview

```
npm: agentxjs
version: 1.9.0+
license: MIT
```

**Key Features:**

- **Unified API** - Same `createAgentX()` function for both server and browser
- **Two Modes** - Local mode (embedded runtime) and Remote mode (WebSocket client)
- **Type-Safe** - TypeScript discriminated unions for configuration
- **Event-Driven** - Real-time streaming events with 4-layer event system
- **Server Capabilities** - Built-in WebSocket server for local mode

## Architecture

```
                              createAgentX(config)
                                      |
                     +----------------+----------------+
                     |                                 |
              Local Mode                         Remote Mode
         (config without serverUrl)          (config with serverUrl)
                     |                                 |
                     v                                 v
    +--------------------------------+    +--------------------------------+
    |        LocalAgentX             |    |       RemoteAgentX             |
    |                                |    |                                |
    |  +----------+  +-----------+   |    |  +-------------------------+   |
    |  | Runtime  |  | WebSocket |   |    |  |    WebSocket Client     |   |
    |  |          |  |  Server   |   |    |  |                         |   |
    |  +----+-----+  +-----+-----+   |    |  +------------+------------+   |
    |       |              |         |    |               |                |
    |       v              v         |    |               v                |
    |  +---------+   +---------+     |    |    +--------------------+      |
    |  |   LLM   |   | Clients |     |    |    | Remote AgentX      |      |
    |  | Claude  |   |         |     |    |    | Server             |      |
    |  +---------+   +---------+     |    |    +--------------------+      |
    +--------------------------------+    +--------------------------------+

                          Both modes expose the same AgentX API:
                          - request(type, data)
                          - on(type, handler)
                          - onCommand(type, handler)
                          - dispose()
```

### Mode Selection

The mode is automatically determined by the presence of `serverUrl` in the configuration:

| Configuration               | Mode   | Use Case               |
| --------------------------- | ------ | ---------------------- |
| `{}` or `{ llm: {...} }`    | Local  | Server, CLI, Backend   |
| `{ serverUrl: "ws://..." }` | Remote | Browser, Remote Client |

## Installation

```bash
# Using bun (recommended)
bun add agentxjs

# Using npm
npm install agentxjs

# Using pnpm
pnpm add agentxjs
```

## Quick Start

### Local Mode (Server)

```typescript
import { createAgentX } from "agentxjs";

// Create AgentX with local runtime
// Reads ANTHROPIC_API_KEY from environment by default
const agentx = await createAgentX();

// Or with explicit configuration
const agentx = await createAgentX({
  llm: {
    apiKey: "sk-ant-...",
    model: "claude-sonnet-4-20250514",
  },
});

// Subscribe to streaming text
agentx.on("text_delta", (e) => {
  process.stdout.write(e.data.text);
});

// Create a container and run an agent
const containerRes = await agentx.request("container_create_request", {
  containerId: "my-container",
});

// Optionally start WebSocket server for remote clients
await agentx.listen(5200);
console.log("Server running on ws://localhost:5200");

// Cleanup when done
await agentx.dispose();
```

### Remote Mode (Browser)

```typescript
import { createAgentX } from "agentxjs";

// Connect to remote AgentX server
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
});

// Same API as local mode!
agentx.on("text_delta", (e) => {
  console.log(e.data.text);
});

const containerRes = await agentx.request("container_create_request", {
  containerId: "my-container",
});

// Cleanup
await agentx.dispose();
```

## Factory Function

### createAgentX()

The main factory function that creates an AgentX instance.

```typescript
function createAgentX(config?: AgentXConfig): Promise<AgentX>;
```

**Parameters:**

- `config` - Optional configuration object (LocalConfig or RemoteConfig)

**Returns:**

- `Promise<AgentX>` - The AgentX instance

**Mode Detection:**

```typescript
// Type guard functions are available for configuration
import { isLocalConfig, isRemoteConfig } from "agentxjs";

const config = { serverUrl: "ws://localhost:5200" };

if (isRemoteConfig(config)) {
  // TypeScript knows this is RemoteConfig
  console.log(config.serverUrl);
}

if (isLocalConfig(config)) {
  // TypeScript knows this is LocalConfig
  console.log(config.llm?.apiKey);
}
```

## Local Mode Configuration

Local mode runs AgentX with an embedded runtime, connecting directly to the LLM API.

```typescript
interface LocalConfig {
  // LLM configuration
  llm?: {
    apiKey: string; // Required (or use ANTHROPIC_API_KEY env)
    baseUrl?: string; // Default: "https://api.anthropic.com"
    model?: string; // Default: "claude-sonnet-4-20250514"
  };

  // Logger configuration
  logger?: {
    level?: LogLevel; // debug | info | warn | error
    factory?: LoggerFactory; // Custom logger factory
    console?: {
      colors?: boolean; // Enable colored output
      timestamps?: boolean; // Include timestamps
    };
  };

  // AgentX data directory
  agentxDir?: string; // Default: "~/.agentx"
  // Directory structure:
  //   {agentxDir}/data/agentx.db  - SQLite database
  //   {agentxDir}/data/queue.db   - Event queue database
  //   {agentxDir}/logs/           - Log files
  //   {agentxDir}/containers/     - Agent workdirs

  // Default agent definition for new images
  defaultAgent?: AgentDefinition;

  // Runtime environment
  environment?: {
    claudeCodePath?: string; // Path to Claude Code executable
  };

  // HTTP server attachment (for single-port deployment)
  server?: {
    on(event: "upgrade", listener: Function): void;
  };
}
```

### Full Local Configuration Example

```typescript
import { createAgentX, defineAgent } from "agentxjs";

const MyAgent = defineAgent({
  name: "Assistant",
  systemPrompt: "You are a helpful coding assistant.",
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    },
  },
});

const agentx = await createAgentX({
  llm: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-20250514",
  },
  logger: {
    level: "info",
    console: {
      colors: true,
      timestamps: true,
    },
  },
  agentxDir: "./data/.agentx",
  defaultAgent: MyAgent,
});
```

### Attaching to Existing HTTP Server

For single-port deployment with authentication middleware:

```typescript
import { createServer } from "http";
import { Hono } from "hono";
import { createAgentX } from "agentxjs";

const app = new Hono();

// Add authentication middleware
app.use("/ws/*", async (c, next) => {
  const token = c.req.header("Authorization");
  if (!validateToken(token)) {
    return c.text("Unauthorized", 401);
  }
  await next();
});

// Create HTTP server
const server = createServer(app.fetch);

// Create AgentX attached to the server
const agentx = await createAgentX({
  llm: { apiKey: "sk-ant-..." },
  server, // WebSocket upgrade handled on /ws path
});

// Start the server
server.listen(5200, () => {
  console.log("Server running on http://localhost:5200");
  console.log("WebSocket available on ws://localhost:5200/ws");
});
```

## Remote Mode Configuration

Remote mode connects to a remote AgentX server via WebSocket.

```typescript
interface RemoteConfig {
  // WebSocket server URL (required)
  serverUrl: string;

  // Authentication headers
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);

  // Business context (merged into all requests)
  context?:
    | Record<string, unknown>
    | (() => Record<string, unknown> | Promise<Record<string, unknown>>);
}
```

### Authentication Headers

Headers can be static or dynamic (sync/async):

```typescript
// Static headers
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: { Authorization: "Bearer sk-xxx" },
});

// Dynamic headers (sync)
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: () => ({
    Authorization: `Bearer ${getToken()}`,
  }),
});

// Dynamic headers (async)
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: async () => ({
    Authorization: `Bearer ${await fetchToken()}`,
  }),
});
```

**Platform Differences:**

- **Node.js**: Headers are sent during WebSocket handshake
- **Browser**: Headers are sent as first authentication message (WebSocket API limitation)

### Context Passing

Context is automatically merged into all requests:

```typescript
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  context: {
    userId: "user-123",
    tenantId: "tenant-abc",
  },
});

// Context is automatically included in every request
await agentx.request("container_create_request", {
  containerId: "my-container",
  // userId and tenantId are automatically merged
});

// Request-level context overrides global context
await agentx.request("message_send_request", {
  content: "Hello",
  context: { traceId: "trace-789" }, // Merged with global context
});
```

Dynamic context is also supported:

```typescript
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  context: async () => ({
    userId: await getCurrentUserId(),
    permissions: await getUserPermissions(),
    sessionId: crypto.randomUUID(),
  }),
});
```

## AgentX API

The AgentX interface is the same for both local and remote modes.

```typescript
interface AgentX {
  // Core API
  request<T extends CommandRequestType>(
    type: T,
    data: RequestDataFor<T>,
    timeout?: number
  ): Promise<ResponseEventFor<T>>;

  on<T extends string>(type: T, handler: (event: SystemEvent & { type: T }) => void): Unsubscribe;

  onCommand<T extends keyof CommandEventMap>(
    type: T,
    handler: (event: CommandEventMap[T]) => void
  ): Unsubscribe;

  emitCommand<T extends keyof CommandEventMap>(type: T, data: CommandEventMap[T]["data"]): void;

  // Server API (local mode only)
  listen(port: number, host?: string): Promise<void>;
  close(): Promise<void>;

  // Lifecycle
  dispose(): Promise<void>;
}
```

### request()

Send a command request and wait for the response.

```typescript
const res = await agentx.request("container_create_request", {
  containerId: "my-container",
});

console.log(res.data.containerId); // "my-container"
```

**Available Request Types:**

| Request Type               | Description                |
| -------------------------- | -------------------------- |
| `container_create_request` | Create a new container     |
| `container_get_request`    | Get container details      |
| `container_list_request`   | List all containers        |
| `image_create_request`     | Create an agent image      |
| `image_run_request`        | Run an agent from image    |
| `image_stop_request`       | Stop a running agent       |
| `image_update_request`     | Update image configuration |
| `image_list_request`       | List all images            |
| `image_get_request`        | Get image details          |
| `image_delete_request`     | Delete an image            |
| `message_send_request`     | Send message to agent      |
| `agent_interrupt_request`  | Interrupt agent processing |
| `agent_destroy_request`    | Destroy an agent           |

### on()

Subscribe to events by type.

```typescript
// Subscribe to text streaming
const unsubscribe = agentx.on("text_delta", (e) => {
  process.stdout.write(e.data.text);
});

// Subscribe to all events
agentx.on("*", (e) => {
  console.log(e.type, e.data);
});

// Unsubscribe when done
unsubscribe();
```

**Common Event Types:**

| Event Type              | Category | Description                |
| ----------------------- | -------- | -------------------------- |
| `text_delta`            | stream   | Incremental text output    |
| `message_start`         | stream   | Streaming message begins   |
| `message_stop`          | stream   | Streaming message ends     |
| `tool_use_start`        | stream   | Tool call starting         |
| `tool_use_stop`         | stream   | Tool call completed        |
| `tool_result`           | stream   | Tool result received       |
| `conversation_start`    | state    | Conversation started       |
| `conversation_thinking` | state    | Agent is thinking          |
| `conversation_end`      | state    | Conversation ended         |
| `user_message`          | message  | User message recorded      |
| `assistant_message`     | message  | Complete assistant message |
| `tool_call_message`     | message  | Tool call recorded         |
| `turn_response`         | turn     | Turn analytics             |

### onCommand()

Subscribe to command events with full type safety.

```typescript
agentx.onCommand("container_create_response", (e) => {
  // TypeScript knows the exact type of e.data
  console.log("Container created:", e.data.containerId);
});
```

### emitCommand()

Emit a command event directly. Use `request()` for most cases.

```typescript
agentx.emitCommand("message_send_request", {
  requestId: "req_123",
  sessionId: "session_456",
  content: "Hello!",
});
```

### listen() (Local Mode Only)

Start the WebSocket server for remote connections.

```typescript
await agentx.listen(5200);
console.log("Server running on ws://localhost:5200");

// With custom host
await agentx.listen(5200, "0.0.0.0");
```

**Note:** Throws an error if used with `config.server` (attached to existing server).

### close() (Local Mode Only)

Stop the WebSocket server.

```typescript
await agentx.close();
```

### dispose()

Dispose AgentX and release all resources.

```typescript
await agentx.dispose();
```

This method:

1. Closes the WebSocket server/client
2. Stops the runtime (local mode)
3. Closes the event queue
4. Clears all event handlers

## Agent Definition

Use `defineAgent()` to define agent behavior and capabilities.

```typescript
import { defineAgent } from "agentxjs";

export const CodingAssistant = defineAgent({
  name: "CodingAssistant",
  description: "A helpful coding assistant",
  systemPrompt: `You are an expert programmer.
    Always write clean, well-documented code.`,
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
    },
    github: {
      type: "sse",
      url: "http://localhost:3000/sse",
    },
  },
});
```

**AgentDefinition Interface:**

```typescript
interface AgentDefinition {
  name: string; // Required agent name
  description?: string; // Agent description
  systemPrompt?: string; // System prompt for behavior
  mcpServers?: Record<string, McpServerConfig>;
}
```

## Complete Examples

### Local Mode - CLI Chat

```typescript
import { createAgentX } from "agentxjs";
import * as readline from "readline";

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Create container and run agent
  await agentx.request("container_create_request", {
    containerId: "cli-chat",
  });

  const { data: image } = await agentx.request("image_create_request", {
    containerId: "cli-chat",
    name: "Assistant",
    systemPrompt: "You are a helpful assistant.",
  });

  const { data: agent } = await agentx.request("image_run_request", {
    imageId: image.imageId,
  });

  // Subscribe to events
  agentx.on("text_delta", (e) => process.stdout.write(e.data.text));
  agentx.on("conversation_end", () => console.log("\n"));

  // Chat loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const chat = () => {
    rl.question("You: ", async (input) => {
      if (input === "exit") {
        await agentx.dispose();
        rl.close();
        return;
      }

      await agentx.request("message_send_request", {
        sessionId: agent.sessionId,
        content: input,
      });

      chat();
    });
  };

  console.log("Chat started. Type 'exit' to quit.\n");
  chat();
}

main();
```

### Local Mode - WebSocket Server

```typescript
import { createAgentX, defineAgent } from "agentxjs";

const Assistant = defineAgent({
  name: "Assistant",
  systemPrompt: "You are a helpful assistant.",
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
    defaultAgent: Assistant,
  });

  // Start WebSocket server
  await agentx.listen(5200);

  console.log("AgentX server running on ws://localhost:5200");
  console.log("Press Ctrl+C to stop");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await agentx.dispose();
    process.exit(0);
  });
}

main();
```

### Remote Mode - Browser React App

```typescript
import { useState, useEffect } from "react";
import { createAgentX, type AgentX } from "agentxjs";

function ChatApp() {
  const [agentx, setAgentx] = useState<AgentX | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const connect = async () => {
      const ax = await createAgentX({
        serverUrl: "ws://localhost:5200",
        headers: () => ({
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }),
        context: {
          userId: "user-123",
        },
      });

      // Subscribe to events
      ax.on("text_delta", (e) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.startsWith("Assistant: ")) {
            return [...prev.slice(0, -1), last + e.data.text];
          }
          return [...prev, `Assistant: ${e.data.text}`];
        });
      });

      setAgentx(ax);
    };

    connect();

    return () => {
      agentx?.dispose();
    };
  }, []);

  const sendMessage = async () => {
    if (!agentx || !input.trim()) return;

    setMessages((prev) => [...prev, `You: ${input}`]);

    await agentx.request("message_send_request", {
      sessionId: "default-session",
      content: input,
    });

    setInput("");
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

## Browser Entry Point

The browser build (`agentxjs/browser`) only includes remote mode:

```typescript
// Browser entry automatically selected by bundlers
import { createAgentX } from "agentxjs";

// Local mode will throw an error in browser
createAgentX(); // Error: Browser environment only supports remote mode

// Remote mode works
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
});
```

This ensures Node.js-specific code (runtime, fs, sqlite) is not included in browser bundles.

## Type Exports

The package exports all necessary types:

```typescript
// Configuration types
export type {
  AgentX,
  AgentXConfig,
  LocalConfig,
  RemoteConfig,
  LLMConfig,
  StorageConfig,
  StorageDriver,
  Unsubscribe,
  AgentDefinition,
} from "agentxjs";

// Event types
export type {
  SystemEvent,
  EventSource,
  EventCategory,
  EventIntent,
  CommandEvent,
  CommandRequest,
  CommandResponse,
  AgentStreamEvent,
  AgentStateEvent,
  AgentMessageEvent,
  AgentTurnEvent,
} from "agentxjs";

// Message types
export type {
  Message,
  UserMessage,
  AssistantMessage,
  ToolCallMessage,
  ToolResultMessage,
  ContentPart,
  TextPart,
  ToolCallPart,
} from "agentxjs";

// Type guards
export {
  isLocalConfig,
  isRemoteConfig,
  isCommandEvent,
  isAgentStreamEvent,
  isAgentStateEvent,
} from "agentxjs";
```

## Package Dependencies

```
@agentxjs/types       (Type definitions)
       |
       v
@agentxjs/common      (Logger, path utilities)
       |
       v
@agentxjs/network     (WebSocket client/server)
       |
       v
agentxjs              (This package)
       |
       +--- Dev dependencies for local mode:
       |    @agentxjs/persistence
       |    @agentxjs/queue
       |    @agentxjs/runtime
       |
       v
@agentxjs/ui          (React components)
```

## Related Documentation

- [Event System](../concepts/event-system.md) - Four-layer event system
- [Lifecycle](../concepts/lifecycle.md) - Agent lifecycle management
- [Architecture Overview](../concepts/overview.md) - Two-domain architecture
