# Runtime API Reference

The `@agentxjs/runtime` package provides the core runtime infrastructure for AI agents. It manages containers, agents, sessions, and the communication between components through an event-driven architecture.

## Overview

The Runtime is the backbone of the AgentX system, responsible for:

- **Container Management**: Isolation boundaries for agent execution
- **Agent Lifecycle**: Creating, running, stopping, and destroying agents
- **Event Routing**: Central SystemBus for component communication
- **Environment Integration**: Connecting agents to LLM providers (Claude)
- **Persistence**: Storing images, sessions, and conversation history

## Installation

```bash
bun add @agentxjs/runtime
```

## Quick Start

```typescript
import { createRuntime, createPersistence, memoryDriver } from "@agentxjs/runtime";

// Create persistence layer
const persistence = await createPersistence(memoryDriver());

// Create runtime
const runtime = createRuntime({
  persistence,
  llmProvider: {
    name: "claude",
    provide: () => ({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: "claude-sonnet-4-20250514",
    }),
  },
  basePath: "/path/to/data",
});

// Create a container
const containerRes = await runtime.request("container_create_request", {
  containerId: "my-container",
});

// Create an image (conversation)
const imageRes = await runtime.request("image_create_request", {
  containerId: "my-container",
  config: {
    name: "My Assistant",
    systemPrompt: "You are a helpful assistant.",
  },
});

// Subscribe to text streaming events
runtime.on("text_delta", (event) => {
  process.stdout.write(event.data.text);
});

// Send a message
await runtime.request("message_send_request", {
  imageId: imageRes.data.record!.imageId,
  content: "Hello!",
});

// Cleanup
await runtime.dispose();
```

---

## createRuntime

Factory function to create a Runtime instance.

### Signature

```typescript
function createRuntime(config: RuntimeConfig): Runtime;
```

### RuntimeConfig

```typescript
interface RuntimeConfig {
  /**
   * Persistence layer for data storage
   */
  persistence: Persistence;

  /**
   * LLM provider for AI model access
   */
  llmProvider: LLMProvider<ClaudeLLMConfig>;

  /**
   * Base path for runtime data (containers, workdirs, etc.)
   * @example "/Users/john/.agentx"
   */
  basePath: string;

  /**
   * Optional environment factory for dependency injection (e.g., mock for testing)
   * If not provided, ClaudeEnvironment will be created by default
   */
  environmentFactory?: EnvironmentFactory;

  /**
   * Default agent definition
   * Used as base configuration when creating new images
   */
  defaultAgent?: AgentDefinition;
}
```

### Example

```typescript
import { createRuntime, createPersistence } from "@agentxjs/runtime";
import { sqliteDriver } from "@agentxjs/persistence/sqlite";

const persistence = await createPersistence(sqliteDriver({ path: "./data/agentx.db" }));

const runtime = createRuntime({
  persistence,
  llmProvider: {
    name: "claude",
    provide: () => ({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      model: "claude-sonnet-4-20250514",
    }),
  },
  basePath: process.env.AGENTX_DIR || "./data",
  defaultAgent: {
    name: "Assistant",
    systemPrompt: "You are a helpful AI assistant.",
  },
});
```

---

## Runtime Interface

The Runtime interface extends SystemBus, providing all event operations plus lifecycle management.

```typescript
interface Runtime extends SystemBus {
  /**
   * Dispose runtime and all resources
   */
  dispose(): Promise<void>;
}
```

---

## SystemBus

The SystemBus is the central event hub for all runtime communication. It provides type-safe event subscription, emission, and request/response patterns.

### Core Methods

#### emit

Emit an event to the bus.

```typescript
emit(event: SystemEvent): void;
```

**Example:**

```typescript
runtime.emit({
  type: "custom_event",
  timestamp: Date.now(),
  source: "agent",
  category: "state",
  intent: "notification",
  data: { message: "Hello" },
});
```

#### emitBatch

Emit multiple events in a single call.

```typescript
emitBatch(events: SystemEvent[]): void;
```

#### on

Subscribe to specific event type(s).

```typescript
on<T extends string>(
  type: T,
  handler: BusEventHandler<SystemEvent & { type: T }>,
  options?: SubscribeOptions<SystemEvent & { type: T }>
): Unsubscribe;

on(
  types: string[],
  handler: BusEventHandler,
  options?: SubscribeOptions
): Unsubscribe;
```

**Example:**

```typescript
// Subscribe to single event type
const unsubscribe = runtime.on("text_delta", (event) => {
  console.log("Text:", event.data.text);
});

// Subscribe to multiple event types
runtime.on(["message_start", "message_stop"], (event) => {
  console.log("Message event:", event.type);
});

// Subscribe with options
runtime.on("text_delta", (event) => console.log(event.data.text), {
  filter: (e) => e.context?.agentId === "agent-1",
  priority: 10,
  once: true,
});

// Unsubscribe when done
unsubscribe();
```

#### onAny

Subscribe to all events.

```typescript
onAny(
  handler: BusEventHandler,
  options?: SubscribeOptions
): Unsubscribe;
```

**Example:**

```typescript
runtime.onAny((event) => {
  console.log(`[${event.source}] ${event.type}`);
});
```

#### once

Subscribe to an event type once (auto-unsubscribes after first trigger).

```typescript
once<T extends string>(
  type: T,
  handler: BusEventHandler<SystemEvent & { type: T }>
): Unsubscribe;
```

**Example:**

```typescript
runtime.once("message_stop", (event) => {
  console.log("First message completed:", event.data.stopReason);
});
```

#### onCommand

Subscribe to command events with full type safety.

```typescript
onCommand<T extends keyof CommandEventMap>(
  type: T,
  handler: (event: CommandEventMap[T]) => void
): Unsubscribe;
```

**Example:**

```typescript
runtime.onCommand("container_create_request", (event) => {
  console.log("Container requested:", event.data.containerId);
});
```

#### emitCommand

Emit a typed command event.

```typescript
emitCommand<T extends keyof CommandEventMap>(
  type: T,
  data: CommandEventMap[T]["data"]
): void;
```

#### request

Send a command request and wait for response.

```typescript
request<T extends CommandRequestType>(
  type: T,
  data: RequestDataFor<T>,
  timeout?: number
): Promise<ResponseEventFor<T>>;
```

**Example:**

```typescript
// Create container
const containerRes = await runtime.request("container_create_request", {
  containerId: "my-container",
});
console.log("Container created:", containerRes.data.containerId);

// Create image
const imageRes = await runtime.request("image_create_request", {
  containerId: "my-container",
  config: {
    name: "Assistant",
    systemPrompt: "You are helpful.",
  },
});
console.log("Image created:", imageRes.data.record?.imageId);

// Send message with custom timeout (60 seconds)
const msgRes = await runtime.request(
  "message_send_request",
  { imageId: imageRes.data.record!.imageId, content: "Hello!" },
  60000
);
```

#### asConsumer

Get a read-only consumer view of the bus (subscribe only).

```typescript
asConsumer(): SystemBusConsumer;
```

#### asProducer

Get a write-only producer view of the bus (emit only).

```typescript
asProducer(): SystemBusProducer;
```

#### destroy

Destroy the bus and clean up resources.

```typescript
destroy(): void;
```

### SubscribeOptions

```typescript
interface SubscribeOptions<E extends SystemEvent = SystemEvent> {
  /**
   * Event filter - only events returning true will trigger the handler.
   * Useful for filtering by agentId, sessionId, etc.
   */
  filter?: (event: E) => boolean;

  /**
   * Priority - higher numbers execute first (default: 0).
   * Useful for ensuring certain handlers run before others.
   */
  priority?: number;

  /**
   * Whether to trigger only once then auto-unsubscribe.
   */
  once?: boolean;
}
```

---

## Container

Container is a runtime isolation boundary where Agents live and work. Each Container manages multiple Agents, each with its own Sandbox.

### Interface

```typescript
interface Container {
  /**
   * Unique container identifier
   */
  readonly containerId: string;

  /**
   * Container creation timestamp
   */
  readonly createdAt: number;

  /**
   * Run an Image - create or reuse an Agent for the given Image
   */
  runImage(image: ImageRecord): Promise<{ agent: Agent; reused: boolean }>;

  /**
   * Stop an Image - destroy the Agent but keep the Image
   */
  stopImage(imageId: string): Promise<boolean>;

  /**
   * Get agent ID for an image (if running)
   */
  getAgentIdForImage(imageId: string): string | undefined;

  /**
   * Check if an image has a running agent
   */
  isImageOnline(imageId: string): boolean;

  /**
   * Get an Agent by ID
   */
  getAgent(agentId: string): Agent | undefined;

  /**
   * List all Agents in this container
   */
  listAgents(): Agent[];

  /**
   * Get the number of Agents in this container
   */
  get agentCount(): number;

  /**
   * Destroy an Agent by ID
   */
  destroyAgent(agentId: string): Promise<boolean>;

  /**
   * Destroy all Agents in this container
   */
  destroyAllAgents(): Promise<void>;

  /**
   * Dispose the container and all its Agents
   */
  dispose(): Promise<void>;
}
```

### Container Commands

#### container_create_request

Create or get a container.

```typescript
// Request
interface ContainerCreateRequest {
  data: {
    requestId: string;
    containerId: string;
  };
}

// Response
interface ContainerCreateResponse {
  data: {
    requestId: string;
    containerId: string;
    error?: string;
  };
}
```

**Example:**

```typescript
const res = await runtime.request("container_create_request", {
  containerId: "user-123",
});
console.log("Container:", res.data.containerId);
```

#### container_get_request

Check if a container exists.

```typescript
const res = await runtime.request("container_get_request", {
  containerId: "user-123",
});
if (res.data.exists) {
  console.log("Container exists");
}
```

#### container_list_request

List all containers.

```typescript
const res = await runtime.request("container_list_request", {});
console.log("Containers:", res.data.containerIds);
```

---

## Agent

Agent is a complete runtime entity composed of LLM connection, sandbox, engine, and session.

### Interface

```typescript
interface Agent {
  /**
   * Unique agent identifier
   */
  readonly agentId: string;

  /**
   * Agent name (from config or default)
   */
  readonly name: string;

  /**
   * Parent container ID
   */
  readonly containerId: string;

  /**
   * Current lifecycle state
   */
  readonly lifecycle: AgentLifecycle;

  /**
   * Creation timestamp (Unix milliseconds)
   */
  readonly createdAt: number;

  /**
   * Send a message to the agent
   * @param content - User message content (string or multimodal content parts)
   * @param requestId - Optional request ID for event correlation
   */
  receive(content: string | UserContentPart[], requestId?: string): Promise<void>;

  /**
   * Interrupt current processing
   * @param requestId - Optional request ID for event correlation
   */
  interrupt(requestId?: string): void;

  /**
   * Stop the agent (preserves session data)
   */
  stop(): Promise<void>;

  /**
   * Resume a stopped agent
   */
  resume(): Promise<void>;

  /**
   * Destroy the agent (cleanup everything)
   */
  destroy(): Promise<void>;
}
```

### AgentLifecycle

```typescript
type AgentLifecycle = "running" | "stopped" | "destroyed";
```

### Agent Commands

#### message_send_request

Send a message to an agent (by imageId or agentId).

```typescript
// Using imageId (preferred - auto-activates if offline)
const res = await runtime.request("message_send_request", {
  imageId: "image-123",
  content: "Hello, assistant!",
});

// Using multimodal content
const res = await runtime.request("message_send_request", {
  imageId: "image-123",
  content: [
    { type: "text", text: "What's in this image?" },
    { type: "image", source: { type: "base64", mediaType: "image/png", data: "..." } },
  ],
});
```

#### agent_interrupt_request

Interrupt an agent's current operation.

```typescript
const res = await runtime.request("agent_interrupt_request", {
  imageId: "image-123",
});
```

#### agent_get_request

Get agent information.

```typescript
const res = await runtime.request("agent_get_request", {
  agentId: "agent-123",
});
if (res.data.exists) {
  console.log("Agent container:", res.data.containerId);
}
```

#### agent_list_request

List all agents in a container.

```typescript
const res = await runtime.request("agent_list_request", {
  containerId: "my-container",
});
for (const agent of res.data.agents) {
  console.log(`Agent ${agent.agentId} (image: ${agent.imageId})`);
}
```

#### agent_destroy_request

Destroy an agent.

```typescript
const res = await runtime.request("agent_destroy_request", {
  agentId: "agent-123",
});
console.log("Destroyed:", res.data.success);
```

---

## Image

Image is the persistent entity representing a conversation. Agents are transient runtime instances of Images.

### Image Commands

#### image_create_request

Create a new image (conversation).

```typescript
const res = await runtime.request("image_create_request", {
  containerId: "my-container",
  config: {
    name: "Research Assistant",
    description: "Helps with research tasks",
    systemPrompt: "You are a research assistant. Be thorough and cite sources.",
  },
});

const { imageId, sessionId } = res.data.record!;
console.log("Created image:", imageId);
```

#### image_run_request

Run an image (create or reuse agent).

```typescript
const res = await runtime.request("image_run_request", {
  imageId: "image-123",
});

console.log("Agent:", res.data.agentId);
console.log("Reused existing:", res.data.reused);
```

#### image_stop_request

Stop an image (destroy agent, keep image).

```typescript
const res = await runtime.request("image_stop_request", {
  imageId: "image-123",
});
```

#### image_update_request

Update image metadata.

```typescript
const res = await runtime.request("image_update_request", {
  imageId: "image-123",
  updates: {
    name: "Updated Name",
    description: "New description",
  },
});
```

#### image_list_request

List all images.

```typescript
const res = await runtime.request("image_list_request", {
  containerId: "my-container", // optional
});

for (const image of res.data.records) {
  console.log(`${image.name} (${image.online ? "online" : "offline"})`);
}
```

#### image_get_request

Get image by ID.

```typescript
const res = await runtime.request("image_get_request", {
  imageId: "image-123",
});

if (res.data.record) {
  console.log("Image:", res.data.record.name);
  console.log("Online:", res.data.record.online);
}
```

#### image_delete_request

Delete an image.

```typescript
const res = await runtime.request("image_delete_request", {
  imageId: "image-123",
});
```

#### image_messages_request

Get conversation history for an image.

```typescript
const res = await runtime.request("image_messages_request", {
  imageId: "image-123",
});

for (const msg of res.data.messages) {
  console.log(`[${msg.role}]: ${JSON.stringify(msg.content)}`);
}
```

---

## Environment

Environment is the external world interface combining Receptor (input) and Effector (output).

### Interface

```typescript
interface Environment {
  /**
   * Environment name
   */
  readonly name: string;

  /**
   * Receptor - perceives external world, emits to SystemBus
   */
  readonly receptor: Receptor;

  /**
   * Effector - subscribes to SystemBus, acts on external world
   */
  readonly effector: Effector;

  /**
   * Warmup the environment (optional pre-initialization)
   */
  warmup?(): Promise<void>;

  /**
   * Dispose environment resources
   */
  dispose(): void;
}
```

### Receptor

```typescript
interface Receptor {
  /**
   * Connect to SystemBus producer to emit events
   */
  connect(producer: SystemBusProducer): void;
}
```

### Effector

```typescript
interface Effector {
  /**
   * Connect to SystemBus consumer to subscribe to events
   */
  connect(consumer: SystemBusConsumer): void;
}
```

### ClaudeEnvironment

The default Environment implementation for Claude LLM.

```typescript
import { ClaudeEnvironment } from "@agentxjs/runtime";

const env = new ClaudeEnvironment({
  agentId: "agent-1",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseUrl: process.env.ANTHROPIC_BASE_URL,
  model: "claude-sonnet-4-20250514",
  systemPrompt: "You are helpful.",
  cwd: "/path/to/workdir",
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/dir"],
    },
  },
});

// Connect to bus
env.receptor.connect(bus.asProducer());
env.effector.connect(bus.asConsumer());

// Optional: warmup to reduce first message latency
await env.warmup();

// Cleanup when done
env.dispose();
```

### EnvironmentFactory

Factory for creating Environment instances (useful for testing).

```typescript
interface EnvironmentFactory {
  create(config: EnvironmentCreateConfig): Environment;
}

interface EnvironmentCreateConfig {
  agentId: string;
  llmConfig: ClaudeLLMConfig;
  systemPrompt?: string;
  cwd: string;
  resumeSessionId?: string;
  mcpServers?: Record<string, McpServerConfig>;
  onSessionIdCaptured?: (sessionId: string) => void;
}
```

**Example: Custom Environment Factory for Testing**

```typescript
const mockEnvironmentFactory: EnvironmentFactory = {
  create(config) {
    return new MockEnvironment(config);
  },
};

const runtime = createRuntime({
  persistence,
  llmProvider,
  basePath: "./data",
  environmentFactory: mockEnvironmentFactory,
});
```

---

## LLMProvider

Provides LLM configuration at Runtime level.

### Interface

```typescript
interface LLMProvider<TSupply = unknown> {
  /**
   * Provider identifier (e.g., "claude", "openai")
   */
  readonly name: string;

  /**
   * Provide LLM configuration
   */
  provide(): TSupply;
}
```

### ClaudeLLMConfig

```typescript
interface ClaudeLLMConfig {
  /**
   * Anthropic API key
   */
  apiKey: string;

  /**
   * API base URL (optional, for custom endpoints)
   */
  baseUrl?: string;

  /**
   * Model name (e.g., "claude-sonnet-4-20250514")
   */
  model?: string;
}
```

**Example:**

```typescript
const llmProvider: LLMProvider<ClaudeLLMConfig> = {
  name: "claude",
  provide: () => ({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  }),
};
```

---

## RuntimeEnvironment

Global singleton for runtime configuration. Internal use only.

```typescript
class RuntimeEnvironment {
  /**
   * Set Claude Code executable path
   */
  static setClaudeCodePath(path: string): void;

  /**
   * Get Claude Code executable path
   */
  static getClaudeCodePath(): string | undefined;

  /**
   * Reset configuration (for testing)
   */
  static reset(): void;
}
```

### RuntimeEnvironmentConfig

```typescript
interface RuntimeEnvironmentConfig {
  /**
   * Path to Claude Code executable
   * Required for binary distribution where Claude Code is bundled
   * @example "/path/to/dist/claude-code/cli.js"
   */
  claudeCodePath?: string;
}
```

---

## SystemEvent

Base interface for all events in the system.

### Structure

```typescript
interface SystemEvent<
  T extends string = string,
  D = unknown,
  S extends EventSource = EventSource,
  C extends EventCategory = EventCategory,
  I extends EventIntent = EventIntent,
> {
  readonly type: T;
  readonly timestamp: number;
  readonly data: D;
  readonly source: S;
  readonly category: C;
  readonly intent: I;
  readonly context?: EventContext;
  readonly broadcastable?: boolean;
}
```

### EventSource

```typescript
type EventSource =
  | "environment" // External world (Claude API, Network)
  | "agent" // Agent internal
  | "session" // Session operations
  | "container" // Container operations
  | "sandbox" // Sandbox resources (Workspace, MCP)
  | "command"; // Command request/response (API operations)
```

### EventCategory

```typescript
type EventCategory =
  | "stream" // Streaming output from LLM
  | "connection" // Network connection status
  | "state" // State transitions
  | "message" // Complete messages
  | "turn" // Conversation turns
  | "error" // Errors
  | "lifecycle" // Creation/destruction
  | "persist" // Persistence operations
  | "action" // User actions (resume, fork)
  | "workdir" // File operations
  | "mcp" // MCP tool operations
  | "request" // Command request
  | "response"; // Command response
```

### EventIntent

```typescript
type EventIntent =
  | "request" // Request to perform action
  | "result" // Result of completed action
  | "notification"; // State change notification
```

### EventContext

```typescript
interface EventContext {
  containerId?: string;
  imageId?: string;
  agentId?: string;
  sessionId?: string;
  turnId?: string;
  correlationId?: string;
}
```

---

## Stream Events

Events emitted during LLM streaming.

### text_delta

Text chunk received.

```typescript
runtime.on("text_delta", (event) => {
  process.stdout.write(event.data.text);
});
```

### message_start

Message stream started.

```typescript
runtime.on("message_start", (event) => {
  console.log("Message ID:", event.data.message.id);
  console.log("Model:", event.data.message.model);
});
```

### message_stop

Message stream completed.

```typescript
runtime.on("message_stop", (event) => {
  console.log("Stop reason:", event.data.stopReason);
  // "end_turn" | "tool_use" | "max_tokens" | "stop_sequence"
});
```

### tool_use_content_block_start

Tool call started.

```typescript
runtime.on("tool_use_content_block_start", (event) => {
  console.log("Tool:", event.data.name);
  console.log("Tool ID:", event.data.id);
});
```

### input_json_delta

Tool input JSON chunk.

```typescript
runtime.on("input_json_delta", (event) => {
  console.log("Partial JSON:", event.data.partialJson);
});
```

### tool_result

Tool execution result.

```typescript
runtime.on("tool_result", (event) => {
  console.log("Tool ID:", event.data.toolUseId);
  console.log("Result:", event.data.result);
  console.log("Is Error:", event.data.isError);
});
```

### interrupted

Operation was interrupted.

```typescript
runtime.on("interrupted", (event) => {
  console.log("Reason:", event.data.reason);
  // "user_interrupt" | "timeout" | "error" | "system"
});
```

---

## Message Events

Complete message events (assembled from stream).

### user_message

User message sent.

```typescript
runtime.on("user_message", (event) => {
  console.log("User:", event.data.content);
});
```

### assistant_message

Assistant message completed.

```typescript
runtime.on("assistant_message", (event) => {
  console.log("Assistant:", event.data.content);
});
```

### tool_call_message

Tool call message.

```typescript
runtime.on("tool_call_message", (event) => {
  console.log("Tool calls:", event.data.content);
});
```

### error_message

Error message.

```typescript
runtime.on("error_message", (event) => {
  console.error("Error:", event.data.content);
});
```

---

## Lifecycle Events

Container and agent lifecycle events.

### container_created

Container was created.

```typescript
runtime.on("container_created", (event) => {
  console.log("Container created:", event.data.containerId);
});
```

### container_destroyed

Container was destroyed.

```typescript
runtime.on("container_destroyed", (event) => {
  console.log("Container destroyed:", event.data.containerId);
  console.log("Agent count:", event.data.agentCount);
});
```

### agent_registered

Agent was registered in container.

```typescript
runtime.on("agent_registered", (event) => {
  console.log("Agent registered:", event.data.agentId);
  console.log("Container:", event.data.containerId);
});
```

### agent_unregistered

Agent was unregistered from container.

```typescript
runtime.on("agent_unregistered", (event) => {
  console.log("Agent unregistered:", event.data.agentId);
});
```

### session_resumed

Session was resumed.

```typescript
runtime.on("session_resumed", (event) => {
  console.log("Session resumed:", event.data.sessionId);
});
```

### session_destroyed

Session was destroyed.

```typescript
runtime.on("session_destroyed", (event) => {
  console.log("Session destroyed:", event.data.sessionId);
});
```

---

## Type Guards

Helper functions for event type checking.

```typescript
import {
  isFromSource,
  hasIntent,
  isRequest,
  isResult,
  isNotification,
  isCommandEvent,
  isCommandRequest,
  isCommandResponse,
} from "@agentxjs/types/event";

// Check event source
if (isFromSource(event, "agent")) {
  // event is from agent
}

// Check intent
if (isRequest(event)) {
  // event is a request
}

// Check command events
if (isCommandRequest(event)) {
  // event is a command request
}
```

---

## Complete Example

```typescript
import { createRuntime, createPersistence } from "@agentxjs/runtime";
import { sqliteDriver } from "@agentxjs/persistence/sqlite";

async function main() {
  // Setup
  const persistence = await createPersistence(sqliteDriver({ path: "./data/agentx.db" }));

  const runtime = createRuntime({
    persistence,
    llmProvider: {
      name: "claude",
      provide: () => ({
        apiKey: process.env.ANTHROPIC_API_KEY!,
        model: "claude-sonnet-4-20250514",
      }),
    },
    basePath: "./data",
    defaultAgent: {
      name: "Assistant",
      systemPrompt: "You are a helpful AI assistant.",
    },
  });

  // Create container
  await runtime.request("container_create_request", {
    containerId: "default",
  });

  // Create image
  const imageRes = await runtime.request("image_create_request", {
    containerId: "default",
    config: { name: "My Chat" },
  });
  const imageId = imageRes.data.record!.imageId;

  // Subscribe to events
  runtime.on("text_delta", (e) => process.stdout.write(e.data.text));
  runtime.on("message_stop", () => console.log("\n--- Message complete ---"));
  runtime.on("error_message", (e) => console.error("Error:", e.data));

  // Chat loop
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        await runtime.dispose();
        rl.close();
        return;
      }

      await runtime.request("message_send_request", {
        imageId,
        content: input,
      });

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
```

---

## See Also

- [AgentX API Reference](./agentx.md) - High-level API for creating agents
- [Types API Reference](./types.md) - Type definitions
- [Persistence API Reference](./persistence.md) - Storage layer
