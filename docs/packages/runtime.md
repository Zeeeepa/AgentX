# @agentxjs/runtime

Runtime for AI Agents - Agent execution, SystemBus, Environment, and complete lifecycle management.

## Overview

The `@agentxjs/runtime` package provides the complete runtime infrastructure for executing AI agents. It manages the full lifecycle from agent creation to destruction, handles communication through a centralized event bus, and integrates with the Claude SDK for AI capabilities.

### Key Features

- **Docker-Style Lifecycle**: Definition -> Image -> Agent -> Session pattern
- **Event-Driven Architecture**: Central SystemBus for all runtime communication
- **Image-First Model**: Persistent conversations with transient runtime agents
- **Environment Abstraction**: Pluggable receptor/effector pattern for LLM integration
- **Request/Response Pattern**: Command-based API with correlation support

## Installation

```bash
bun add @agentxjs/runtime
```

## Architecture

```
+------------------------------------------------------------------+
|                           Runtime                                  |
|                                                                    |
|  +----------------------+    +-----------------------------+       |
|  |     SystemBus        |    |      CommandHandler         |       |
|  |  (Event Routing)     |<-->|  (Request/Response Logic)   |       |
|  +----------------------+    +-----------------------------+       |
|           |                                                        |
|           v                                                        |
|  +------------------------------------------------------------+   |
|  |                       Container                              |   |
|  |  +------------------------------------------------------+   |   |
|  |  |                    RuntimeAgent                       |   |   |
|  |  |  +----------------+  +----------------+               |   |   |
|  |  |  |   Interactor   |  |   BusDriver    |               |   |   |
|  |  |  |   (Input)      |  |   (Output)     |               |   |   |
|  |  |  +----------------+  +----------------+               |   |   |
|  |  |          |                    |                       |   |   |
|  |  |          v                    v                       |   |   |
|  |  |  +----------------+  +----------------+               |   |   |
|  |  |  |  AgentEngine   |  |   Session      |               |   |   |
|  |  |  |  (MealyMachine)|  |   (Storage)    |               |   |   |
|  |  |  +----------------+  +----------------+               |   |   |
|  |  |                                                       |   |   |
|  |  |  +------------------------------------------------+  |   |   |
|  |  |  |              Environment                        |  |   |   |
|  |  |  |  +------------------+  +------------------+     |  |   |   |
|  |  |  |  |    Receptor      |  |    Effector      |     |  |   |   |
|  |  |  |  | (Claude -> Bus)  |  | (Bus -> Claude)  |     |  |   |   |
|  |  |  |  +------------------+  +------------------+     |  |   |   |
|  |  |  +------------------------------------------------+  |   |   |
|  |  +------------------------------------------------------+   |   |
|  +----------------------------------------------+---------------+   |
|  |                  Sandbox                      |                  |
|  |  (Isolated Working Directory)                 |                  |
|  +----------------------------------------------+                  |
+------------------------------------------------------------------+
```

### Event Flow

```
User Message Flow:
==================
User Input
    |
    v
AgentInteractor
    |
    | emit user_message
    v
SystemBus ─────────────────────────────────────────
    |                                              |
    v                                              v
ClaudeEffector                              BusDriver (filters)
    |                                              |
    v                                              |
Claude SDK                                         |
    |                                              |
    v                                              |
ClaudeReceptor ────────────────────────────────────┘
    |                                              |
    | emit DriveableEvent                          |
    v                                              v
SystemBus                               AgentEngine.handleStreamEvent()
                                               |
                                               v
                                        BusPresenter (persist + emit)
```

## Core Classes

### Runtime

The top-level API that orchestrates all runtime operations. It implements the SystemBus interface and delegates to the CommandHandler for request processing.

```typescript
import { createRuntime } from "@agentxjs/runtime";
import { createPersistence } from "@agentxjs/persistence";
import { sqliteDriver } from "@agentxjs/persistence/sqlite";

const persistence = await createPersistence(sqliteDriver({ path: "./data.db" }));

const runtime = createRuntime({
  persistence,
  llmProvider: {
    provide: () => ({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: "claude-sonnet-4-20250514",
    }),
  },
  basePath: "/path/to/.agentx",
});

// Use request/response pattern
const res = await runtime.request("container_create_request", {
  containerId: "my-container",
});

// Subscribe to events
runtime.on("text_delta", (e) => console.log(e.data.text));

// Cleanup
await runtime.dispose();
```

#### RuntimeConfig

```typescript
interface RuntimeConfig {
  /** Persistence layer for data storage */
  persistence: Persistence;

  /** LLM provider for AI model access */
  llmProvider: LLMProvider<ClaudeLLMConfig>;

  /** Base path for runtime data (containers, workdirs, etc.) */
  basePath: string;

  /** Optional environment factory for dependency injection */
  environmentFactory?: EnvironmentFactory;

  /** Default agent definition used when creating new images */
  defaultAgent?: AgentDefinition;
}
```

### Container

Isolation boundary that manages multiple agents. In the Image-First model, Container tracks the `imageId -> agentId` mapping.

```typescript
// Containers are managed through Runtime commands
const res = await runtime.request("container_create_request", {
  containerId: "user-123",
});

// List all containers
const containers = await runtime.request("container_list_request", {});
```

Key responsibilities:

- Manages agent lifecycle within an isolation boundary
- Tracks `imageId -> agentId` mapping for image-first operations
- Handles agent creation from Images
- Emits lifecycle events (`container_created`, `container_destroyed`)

### Agent (RuntimeAgent)

The runtime entity that processes user messages and generates responses. Agents are transient - they exist only while actively processing.

```typescript
// Agents are created by running an Image
const runRes = await runtime.request("image_run_request", {
  imageId: "img_xyz123",
});

// Send a message to an agent via its image
await runtime.request("message_send_request", {
  imageId: "img_xyz123",
  content: "Hello, Claude!",
});

// Interrupt an agent
await runtime.request("agent_interrupt_request", {
  imageId: "img_xyz123",
});
```

Architecture components:

- **AgentInteractor**: Handles user input (the "in" side)
- **BusDriver**: Listens for DriveableEvents (the "out" side)
- **AgentEngine**: Event processing using MealyMachine pattern
- **BusPresenter**: Forwards events to bus and handles persistence

### Session (RuntimeSession)

Manages conversation history storage and retrieval.

```typescript
// Sessions are automatically created with Images
// Access messages through the Image API
const messages = await runtime.request("image_messages_request", {
  imageId: "img_xyz123",
});
```

Features:

- Persists messages via SessionRepository
- Emits `session_created`, `message_persisted` events
- Supports message clearing

### Image (RuntimeImage)

Persistent conversation entity. Users interact with Images (displayed as "conversations"), while Agents are transient runtime instances.

```typescript
// Create a new conversation (image)
const createRes = await runtime.request("image_create_request", {
  containerId: "user-123",
  config: {
    name: "My Conversation",
    description: "A helpful assistant",
    systemPrompt: "You are a helpful assistant.",
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/dir"],
      },
    },
  },
});

// List all images
const images = await runtime.request("image_list_request", {});

// Update image metadata
await runtime.request("image_update_request", {
  imageId: "img_xyz123",
  updates: { name: "Renamed Conversation" },
});

// Delete an image
await runtime.request("image_delete_request", {
  imageId: "img_xyz123",
});
```

Lifecycle:

```
create() -> ImageRecord (persistent) + SessionRecord (for messages)
run()    -> Agent (runtime, in-memory)
stop()   -> Agent destroyed, Image remains
```

### Sandbox (RuntimeSandbox)

Provides an isolated environment for each agent, including a dedicated working directory.

```typescript
// Sandbox is automatically created when running an image
// Working directory structure:
// {basePath}/containers/{containerId}/workdirs/{imageId}/
```

Features:

- Creates isolated working directories
- Supports future MCP (Model Context Protocol) tools

### SystemBus (SystemBusImpl)

Central event bus for runtime communication. Implements pub/sub pattern using RxJS.

```typescript
// Emit events
runtime.emit({
  type: "custom_event",
  timestamp: Date.now(),
  source: "agent",
  category: "custom",
  intent: "notification",
  data: { message: "Hello" },
});

// Subscribe to events
const unsubscribe = runtime.on("text_delta", (event) => {
  console.log(event.data.text);
});

// Subscribe to multiple event types
runtime.on(["message_start", "message_stop"], (event) => {
  console.log(event.type);
});

// Subscribe to all events
runtime.onAny((event) => {
  console.log(`Event: ${event.type}`);
});

// One-time subscription
runtime.once("conversation_end", (event) => {
  console.log("Conversation completed");
});

// Request/response pattern
const response = await runtime.request("image_get_request", {
  imageId: "img_xyz123",
});
```

Features:

- Priority-based event dispatch
- Filter-based subscriptions
- Request/response correlation with timeout
- Producer/Consumer views for restricted access

### Environment

Abstraction for LLM integration using the Receptor/Effector pattern.

```
+-------------------+
|   Environment     |
|                   |
|  +-------------+  |       +----------+
|  |  Receptor   |--------->| SystemBus|
|  | (Perceive)  |  |       +----------+
|  +-------------+  |            ^
|                   |            |
|  +-------------+  |            |
|  |  Effector   |<--------------+
|  |   (Act)     |  |
|  +-------------+  |
+-------------------+
```

#### ClaudeEnvironment

Default environment that integrates with the Claude SDK.

```typescript
// Environment is automatically created when running an image
// Custom environment factory for testing:
const runtime = createRuntime({
  // ... other config
  environmentFactory: {
    create(config) {
      return new MockEnvironment(config);
    },
  },
});
```

#### ClaudeReceptor

Perceives Claude SDK responses and emits DriveableEvents to SystemBus.

Converts SDK stream events to:

- `message_start` - Start of assistant message
- `text_delta` - Text content streaming
- `tool_use_content_block_start` - Tool call begins
- `input_json_delta` - Tool input streaming
- `tool_use_content_block_stop` - Tool call completes
- `tool_result` - Tool execution result
- `message_stop` - End of assistant message
- `interrupted` - Operation interrupted
- `error_received` - Error occurred

#### ClaudeEffector

Subscribes to SystemBus events and sends to Claude SDK.

Features:

- Listens for `user_message` events
- Manages request timeout using RxJS
- Handles `interrupt` events
- Filters events by agentId

## Command API

The runtime exposes a request/response API for all operations:

### Container Commands

| Command                    | Description            |
| -------------------------- | ---------------------- |
| `container_create_request` | Create a new container |
| `container_get_request`    | Get container by ID    |
| `container_list_request`   | List all containers    |

### Agent Commands

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `agent_get_request`         | Get agent by ID                   |
| `agent_list_request`        | List agents in a container        |
| `agent_destroy_request`     | Destroy an agent                  |
| `agent_destroy_all_request` | Destroy all agents in a container |
| `message_send_request`      | Send message to agent             |
| `agent_interrupt_request`   | Interrupt agent operation         |

### Image Commands

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `image_create_request`   | Create a new image (conversation) |
| `image_run_request`      | Run an image (create agent)       |
| `image_stop_request`     | Stop an image (destroy agent)     |
| `image_update_request`   | Update image metadata             |
| `image_list_request`     | List all images                   |
| `image_get_request`      | Get image by ID                   |
| `image_delete_request`   | Delete an image                   |
| `image_messages_request` | Get messages for an image         |

## Event Types

### Stream Events (from Environment)

```typescript
// message_start
{ type: "message_start", data: { message: { id, model } } }

// text_delta
{ type: "text_delta", data: { text: string } }

// message_stop
{ type: "message_stop", data: { stopReason: "end_turn" | "tool_use" | "max_tokens" } }
```

### Lifecycle Events

```typescript
// container_created
{ type: "container_created", data: { containerId, createdAt } }

// agent_registered
{ type: "agent_registered", data: { containerId, agentId, definitionName, registeredAt } }

// session_created
{ type: "session_created", data: { sessionId, imageId, containerId, createdAt } }
```

### Message Events (from Agent)

```typescript
// assistant_message
{ type: "assistant_message", category: "message", data: Message }

// tool_call_message
{ type: "tool_call_message", category: "message", data: Message }
```

## Usage Examples

### Basic Setup

```typescript
import { createRuntime, createPersistence, memoryDriver } from "@agentxjs/runtime";

// Create runtime with in-memory storage
const persistence = await createPersistence(memoryDriver());

const runtime = createRuntime({
  persistence,
  llmProvider: {
    provide: () => ({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    }),
  },
  basePath: "./data",
});

// Create container for user
await runtime.request("container_create_request", {
  containerId: "user-123",
});

// Create conversation
const imageRes = await runtime.request("image_create_request", {
  containerId: "user-123",
  config: {
    name: "My Assistant",
    systemPrompt: "You are a helpful assistant.",
  },
});

// Subscribe to text deltas
runtime.on("text_delta", (e) => {
  process.stdout.write(e.data.text);
});

// Send message (auto-runs image if needed)
await runtime.request("message_send_request", {
  imageId: imageRes.data.record.imageId,
  content: "Hello, how are you?",
});
```

### With MCP Servers

```typescript
const imageRes = await runtime.request("image_create_request", {
  containerId: "user-123",
  config: {
    name: "Filesystem Assistant",
    systemPrompt: "You can read and write files.",
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/home/user"],
      },
    },
  },
});
```

### Custom Environment Factory

```typescript
// For testing or custom LLM backends
const runtime = createRuntime({
  // ... other config
  environmentFactory: {
    create(config) {
      return new CustomEnvironment(config);
    },
  },
});
```

### RuntimeEnvironment Singleton

For advanced use cases like binary distribution where you need to configure Claude Code path:

```typescript
import { RuntimeEnvironment } from "@agentxjs/runtime";

// Set Claude Code executable path
RuntimeEnvironment.setClaudeCodePath("/path/to/claude-code/cli.js");

// Get the configured path
const path = RuntimeEnvironment.getClaudeCodePath();
```

## Integration with Portagent

The portagent application demonstrates runtime usage in a production context:

```typescript
import { createAgentX } from "agentxjs";

const agentx = await createAgentX({
  llm: {
    apiKey: process.env.LLM_PROVIDER_KEY,
    baseUrl: process.env.LLM_PROVIDER_URL,
    model: process.env.LLM_PROVIDER_MODEL,
  },
  agentxDir: "/path/to/.agentx", // Auto-configures storage
  server, // HTTP server for WebSocket
  defaultAgent: {
    name: "Assistant",
    systemPrompt: "You are helpful.",
  },
});

// AgentX internally creates Runtime with all necessary configuration
```

## Dependencies

- `@agentxjs/agent` - Agent engine and event processing
- `@agentxjs/common` - Logging, ID generation, SQLite
- `@agentxjs/persistence` - Storage layer
- `@agentxjs/types` - Type definitions
- `@anthropic-ai/claude-agent-sdk` - Claude SDK integration
- `rxjs` - Reactive event handling

## Environment Variables

| Variable             | Description    | Default           |
| -------------------- | -------------- | ----------------- |
| `ANTHROPIC_API_KEY`  | Claude API key | Required          |
| `ANTHROPIC_BASE_URL` | API endpoint   | Anthropic default |
| `LOG_LEVEL`          | Logging level  | `info`            |

## Related Packages

- [@agentxjs/agent](./agent.md) - Agent engine and event processing
- [@agentxjs/persistence](./persistence.md) - Storage layer
- [@agentxjs/types](./types.md) - Type definitions
- [agentxjs](./agentxjs.md) - Unified entry point
