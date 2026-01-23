# Agent API Reference

This document provides a comprehensive API reference for the Agent layer in AgentX, covering the `@agentxjs/agent` package and Agent-related types from `@agentxjs/types`.

## Overview

The Agent layer consists of two main components:

1. **AgentEngine** (`@agentxjs/agent`) - A standalone event processing unit that transforms streaming LLM events into structured conversation events using the Mealy Machine pattern.

2. **Runtime Agent** (`@agentxjs/runtime`) - A complete runtime entity that combines AgentEngine with LLM, Sandbox, and Session management.

```
Package Hierarchy:

@agentxjs/types      Type definitions
       |
@agentxjs/agent      AgentEngine (event processing)
       |
@agentxjs/runtime    Runtime Agent (complete lifecycle)
```

---

## AgentEngine

The `AgentEngine` interface defines the core event processing unit. It coordinates:

- **Driver**: Event producer (LLM interaction)
- **MealyMachine**: Event assembler (pure Mealy Machine)
- **Presenter**: Event consumer (side effects)

### Interface Definition

```typescript
interface AgentEngine {
  // Identity
  readonly agentId: string;
  readonly createdAt: number;

  // State
  readonly state: AgentState;
  readonly messageQueue: MessageQueue;

  // Message Handling
  receive(message: string | UserMessage): Promise<void>;
  handleStreamEvent(event: StreamEvent): void;

  // Event Subscription
  on(handler: AgentOutputCallback): Unsubscribe;
  on(handlers: EventHandlerMap): Unsubscribe;
  on(type: string, handler: AgentOutputCallback): Unsubscribe;
  on(types: string[], handler: AgentOutputCallback): Unsubscribe;

  // State Subscription
  onStateChange(handler: StateChangeHandler): Unsubscribe;

  // React-style Subscription
  react(handlers: ReactHandlerMap): Unsubscribe;

  // Lifecycle Hooks
  onReady(handler: () => void): Unsubscribe;
  onDestroy(handler: () => void): Unsubscribe;

  // Middleware & Interceptors
  use(middleware: AgentMiddleware): Unsubscribe;
  intercept(interceptor: AgentInterceptor): Unsubscribe;

  // Control
  interrupt(): void;
  destroy(): Promise<void>;
}
```

### Properties

#### `agentId`

```typescript
readonly agentId: string
```

Unique identifier for this agent instance. Auto-generated on creation.

#### `createdAt`

```typescript
readonly createdAt: number
```

Unix timestamp (milliseconds) when the agent was created.

#### `state`

```typescript
readonly state: AgentState
```

Current conversation state of the agent. See [AgentState](#agentstate) for possible values.

#### `messageQueue`

```typescript
readonly messageQueue: MessageQueue
```

Read-only view of the pending message queue. See [MessageQueue](#messagequeue).

### Methods

#### `receive(message)`

Send a message to the agent for processing.

```typescript
receive(message: string | UserMessage): Promise<void>
```

**Parameters:**

- `message` - String content or a full `UserMessage` object

**Returns:** Promise that resolves when processing completes

**Example:**

```typescript
// Simple string
await agent.receive("Hello!");

// Full UserMessage object
await agent.receive({
  id: "msg_123",
  role: "user",
  subtype: "user",
  content: "Hello!",
  timestamp: Date.now(),
});
```

#### `handleStreamEvent(event)`

Handle a stream event from the driver (push-based API).

```typescript
handleStreamEvent(event: StreamEvent): void
```

**Parameters:**

- `event` - StreamEvent to process through the MealyMachine

**Note:** This is the push-based API for event processing. Events are pushed by the driver when LLM responses arrive.

#### `on(handler)` / `on(type, handler)`

Subscribe to events.

```typescript
// Subscribe to all events
on(handler: AgentOutputCallback): Unsubscribe;

// Subscribe to specific event type
on(type: string, handler: AgentOutputCallback): Unsubscribe;

// Subscribe to multiple event types
on(types: string[], handler: AgentOutputCallback): Unsubscribe;

// Batch subscribe with handler map
on(handlers: EventHandlerMap): Unsubscribe;
```

**Returns:** Unsubscribe function

**Examples:**

```typescript
// All events
const unsub = agent.on((event) => {
  console.log(event.type, event.data);
});

// Single event type
agent.on("text_delta", (event) => {
  process.stdout.write(event.data.text);
});

// Multiple event types
agent.on(["message_start", "message_stop"], (event) => {
  console.log(`Message ${event.type}`);
});

// Handler map
agent.on({
  text_delta: (e) => process.stdout.write(e.data.text),
  assistant_message: (e) => saveMessage(e.data),
});
```

#### `onStateChange(handler)`

Subscribe to state transitions.

```typescript
onStateChange(handler: StateChangeHandler): Unsubscribe
```

**Parameters:**

- `handler` - Callback receiving `{ prev, current }` state change

**Example:**

```typescript
agent.onStateChange(({ prev, current }) => {
  console.log(`State: ${prev} -> ${current}`);
});
```

#### `react(handlers)`

React-style fluent event subscription using `onEventName` convention.

```typescript
react(handlers: ReactHandlerMap): Unsubscribe
```

**Example:**

```typescript
agent.react({
  onTextDelta: (e) => console.log(e.data.text),
  onAssistantMessage: (e) => setMessages((prev) => [...prev, e.data]),
  onConversationEnd: () => console.log("Done!"),
});
```

**Naming Convention:** `onTextDelta` maps to event type `text_delta`.

#### `onReady(handler)`

Subscribe to agent ready event.

```typescript
onReady(handler: () => void): Unsubscribe
```

Called when the agent is ready to receive messages. If already ready, handler is called immediately.

#### `onDestroy(handler)`

Subscribe to agent destroy event.

```typescript
onDestroy(handler: () => void): Unsubscribe
```

Called when the agent is destroyed.

#### `use(middleware)`

Add middleware to intercept incoming messages (receive side).

```typescript
use(middleware: AgentMiddleware): Unsubscribe
```

**Example:**

```typescript
agent.use(async (message, next) => {
  console.log("[Before]", message.content);
  await next(message);
  console.log("[After]");
});
```

#### `intercept(interceptor)`

Add interceptor to intercept outgoing events (event side).

```typescript
intercept(interceptor: AgentInterceptor): Unsubscribe
```

**Example:**

```typescript
agent.intercept((event, next) => {
  console.log("Event:", event.type);

  // Modify event
  if (event.type === "text_delta") {
    event.data.text = maskSensitive(event.data.text);
  }

  // Continue (or skip by not calling next)
  next(event);
});
```

#### `interrupt()`

User-initiated stop of the current operation.

```typescript
interrupt(): void
```

Stops the current operation gracefully. The agent returns to idle state.

#### `destroy()`

Clean up all resources.

```typescript
destroy(): Promise<void>
```

---

## createAgent

Factory function to create an AgentEngine instance.

```typescript
function createAgent(options: CreateAgentOptions): AgentEngine;
```

### CreateAgentOptions

```typescript
interface CreateAgentOptions {
  driver: AgentDriver;
  presenter: AgentPresenter;
}
```

**Example:**

```typescript
import { createAgent } from "@agentxjs/agent";

const engine = createAgent({
  driver: new ClaudeDriver(config),
  presenter: new SSEPresenter(connection),
});

engine.on("text_delta", (e) => console.log(e.data.text));
await engine.receive("Hello!");
```

---

## AgentDriver

Interface for message processing. Receives user messages and yields StreamEvents.

```typescript
interface AgentDriver {
  readonly name: string;
  readonly description?: string;

  receive(message: UserMessage): AsyncIterable<StreamEvent>;
  interrupt(): void;
}
```

### Properties

#### `name`

```typescript
readonly name: string
```

Driver name for identification and logging.

#### `description`

```typescript
readonly description?: string
```

Optional description of the driver.

### Methods

#### `receive(message)`

Receive a user message and yield stream events.

```typescript
receive(message: UserMessage): AsyncIterable<StreamEvent>
```

**Example Implementation:**

```typescript
class ClaudeDriver implements AgentDriver {
  readonly name = "ClaudeDriver";
  private abortController: AbortController;

  async *receive(message: UserMessage) {
    this.abortController = new AbortController();

    const stream = this.client.messages.stream({
      model: "claude-sonnet-4-20250514",
      messages: [{ role: "user", content: message.content }],
    });

    for await (const chunk of stream) {
      yield transformToStreamEvent(chunk);
    }
  }

  interrupt() {
    this.abortController.abort();
  }
}
```

#### `interrupt()`

Interrupt the current operation.

```typescript
interrupt(): void
```

Stops the current `receive()` operation gracefully. Driver should abort any ongoing requests.

---

## AgentPresenter

Interface for output adapters. Receives agent outputs and presents them to external systems.

```typescript
interface AgentPresenter {
  readonly name: string;
  readonly description?: string;

  present(agentId: string, output: AgentOutput): void | Promise<void>;
}
```

### Methods

#### `present(agentId, output)`

Present an agent output to external systems.

```typescript
present(agentId: string, output: AgentOutput): void | Promise<void>
```

**Example Implementation:**

```typescript
const ssePresenter: AgentPresenter = {
  name: "SSEPresenter",
  description: "Forwards stream events via Server-Sent Events",

  present(agentId, output) {
    if (output.type === "text_delta") {
      sseConnection.send(agentId, output);
    }
  },
};
```

---

## AgentState

Agent conversation states for fine-grained monitoring.

```typescript
type AgentState =
  | "idle" // Waiting for user input
  | "thinking" // LLM is thinking
  | "responding" // LLM is generating response
  | "planning_tool" // Generating tool call parameters
  | "awaiting_tool_result" // Waiting for tool execution result
  | "error"; // Error occurred during processing
```

### State Transitions

```
idle -> thinking -> responding -> idle
                        |
               planning_tool -> awaiting_tool_result
                        |
                   thinking -> responding -> idle

Any state can transition to error:
thinking/responding/planning_tool/awaiting_tool_result -> error -> idle
```

---

## AgentStateMachine

State management driven by StateEvents.

```typescript
interface AgentStateMachine {
  readonly state: AgentState;

  process(event: AgentOutput): void;
  onStateChange(handler: StateChangeHandler): Unsubscribe;
  reset(): void;
}
```

### Event to State Mapping

| Event Type                 | New State              |
| -------------------------- | ---------------------- |
| `conversation_start`       | `thinking`             |
| `conversation_thinking`    | `thinking`             |
| `conversation_responding`  | `responding`           |
| `conversation_end`         | `idle`                 |
| `conversation_interrupted` | `idle`                 |
| `tool_planned`             | `planning_tool`        |
| `tool_executing`           | `awaiting_tool_result` |
| `tool_completed`           | `responding`           |
| `tool_failed`              | `responding`           |
| `error_occurred`           | `error`                |

---

## MealyMachine

Pure Mealy Machine event processor that transforms StreamEvents into higher-level events.

```typescript
class MealyMachine {
  process(agentId: string, event: StreamEvent): AgentOutput[];
  clearState(agentId: string): void;
  hasState(agentId: string): boolean;
}
```

### Methods

#### `process(agentId, event)`

Process a single stream event and return output events.

```typescript
process(agentId: string, event: StreamEvent): AgentOutput[]
```

This is the core Mealy Machine operation: `process(agentId, event) -> outputs[]`.

**Event Transformation:**

```
StreamEvent (from Driver)
    |
    +-- message_start, text_delta, tool_use_start, message_stop...
            | MealyMachine processes
AgentOutput (to AgentEngine/Presenter)
    |
    +-- StateEvent (conversation_start, conversation_end...)
    +-- MessageEvent (assistant_message, tool_call_message...)
    +-- TurnEvent (turn_request, turn_response)
```

#### `clearState(agentId)`

Clear state for an agent. Call when agent is destroyed to free memory.

```typescript
clearState(agentId: string): void
```

#### `hasState(agentId)`

Check if state exists for an agent.

```typescript
hasState(agentId: string): boolean
```

---

## Processor

Core pure function type for stream processing in the Mealy Machine.

```typescript
type Processor<TState, TInput, TOutput> = (
  state: Readonly<TState>,
  input: TInput
) => [TState, TOutput[]];
```

**Pattern:** `(state, input) => [newState, outputs]`

**Key Properties:**

- Pure function (no side effects)
- Deterministic (same input always produces same output)
- State is a means (accumulator), outputs are the goal

**Example:**

```typescript
const messageProcessor: Processor<MsgState, StreamEvent, MsgEvent> = (state, input) => {
  switch (input.type) {
    case "text_delta":
      return [{ ...state, buffer: state.buffer + input.data.text }, []];
    case "message_stop":
      return [{ buffer: "" }, [{ type: "assistant_message", content: state.buffer }]];
    default:
      return [state, []];
  }
};
```

### Built-in Processors

| Processor           | Input        | Output       | Purpose                                |
| ------------------- | ------------ | ------------ | -------------------------------------- |
| MessageAssembler    | StreamEvent  | MessageEvent | Assemble complete messages from chunks |
| StateEventProcessor | StreamEvent  | StateEvent   | Generate state transition events       |
| TurnTracker         | MessageEvent | TurnEvent    | Track request-response cycles          |

---

## Runtime Agent

Complete runtime agent with LLM, Sandbox, Engine, and Session.

```typescript
interface Agent {
  // Identity
  readonly agentId: string;
  readonly name: string;
  readonly containerId: string;
  readonly lifecycle: AgentLifecycle;
  readonly createdAt: number;

  // Interaction
  receive(content: string | UserContentPart[], requestId?: string): Promise<void>;
  interrupt(requestId?: string): void;

  // Lifecycle
  stop(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;
}
```

### AgentLifecycle

```typescript
type AgentLifecycle = "running" | "stopped" | "destroyed";
```

| State       | Description                                         |
| ----------- | --------------------------------------------------- |
| `running`   | Agent is active, can receive messages               |
| `stopped`   | Agent is paused, session data preserved, can resume |
| `destroyed` | Agent is removed, all data cleaned up               |

### Methods

#### `receive(content, requestId?)`

Send a message to the agent.

```typescript
receive(content: string | UserContentPart[], requestId?: string): Promise<void>
```

**Parameters:**

- `content` - User message content (string or multimodal content parts)
- `requestId` - Optional request ID for event correlation

#### `interrupt(requestId?)`

Interrupt current processing.

```typescript
interrupt(requestId?: string): void
```

#### `stop()`

Pause the agent, preserving session data.

```typescript
stop(): Promise<void>
```

Can be resumed later with `resume()`.

#### `resume()`

Resume a stopped agent.

```typescript
resume(): Promise<void>
```

Restores the agent from preserved session data.

#### `destroy()`

Destroy the agent and all associated data.

```typescript
destroy(): Promise<void>
```

Cannot be resumed after destruction.

---

## Message Types

### UserMessage

Message sent by the user.

```typescript
interface UserMessage {
  id: string;
  role: "user";
  subtype: "user";
  content: string | UserContentPart[];
  timestamp: number;
  parentId?: string;
}
```

### Message (Union Type)

```typescript
type Message = UserMessage | AssistantMessage | ToolCallMessage | ToolResultMessage | ErrorMessage;
```

**Discriminate using `subtype`:**

```typescript
function handleMessage(msg: Message) {
  switch (msg.subtype) {
    case "user":
      console.log(msg.content);
      break;
    case "assistant":
      console.log(msg.content);
      break;
    case "tool-call":
      console.log(msg.toolCall.name);
      break;
    case "tool-result":
      console.log(msg.toolResult.output);
      break;
    case "error":
      console.log(msg.content);
      break;
  }
}
```

---

## Event Types

### AgentOutput

Union of all possible agent output events.

```typescript
type AgentOutput = StreamEvent | AgentStateEvent | AgentMessageEvent | AgentTurnEvent;
```

### EngineEvent

Lightweight event base for AgentEngine domain.

```typescript
interface EngineEvent<T extends string = string, D = unknown> {
  readonly type: T;
  readonly timestamp: number;
  readonly data: D;
}
```

### Stream Events

```typescript
type StreamEvent =
  | MessageStartEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | TextDeltaEvent
  | ToolUseStartEvent
  | InputJsonDeltaEvent
  | ToolUseStopEvent
  | ToolResultEvent;
```

### State Events

```typescript
type AgentStateEvent =
  | ConversationQueuedEvent
  | ConversationStartEvent
  | ConversationThinkingEvent
  | ConversationRespondingEvent
  | ConversationEndEvent
  | ConversationInterruptedEvent
  | ToolPlannedEvent
  | ToolExecutingEvent
  | ToolCompletedEvent
  | ToolFailedEvent
  | ErrorOccurredEvent;
```

### Message Events

```typescript
type AgentMessageEvent =
  | UserMessageEvent
  | AssistantMessageEvent
  | ToolCallMessageEvent
  | ToolResultMessageEvent
  | ErrorMessageEvent;
```

### Turn Events

```typescript
type AgentTurnEvent = TurnRequestEvent | TurnResponseEvent;
```

---

## Callback Types

### AgentOutputCallback

```typescript
type AgentOutputCallback<T extends AgentOutput = AgentOutput> = (event: T) => void;
```

### Unsubscribe

```typescript
type Unsubscribe = () => void;
```

### StateChangeHandler

```typescript
type StateChangeHandler = (change: StateChange) => void;

interface StateChange {
  prev: AgentState;
  current: AgentState;
}
```

### EventHandlerMap

```typescript
type EventHandlerMap = Record<string, ((event: AgentOutput) => void) | undefined>;
```

### ReactHandlerMap

```typescript
type ReactHandlerMap = Record<string, ((event: AgentOutput) => void) | undefined>;
```

---

## Middleware & Interceptors

### AgentMiddleware

Input-side interceptor for `receive()`.

```typescript
type AgentMiddleware = (message: UserMessage, next: AgentMiddlewareNext) => Promise<void>;
type AgentMiddlewareNext = (message: UserMessage) => Promise<void>;
```

**Example:**

```typescript
agent.use(async (message, next) => {
  // Pre-processing
  const sanitized = sanitize(message);

  // Continue chain
  await next(sanitized);

  // Post-processing
  logMessage(sanitized);
});
```

### AgentInterceptor

Output-side interceptor for events.

```typescript
type AgentInterceptor = (event: AgentOutput, next: AgentInterceptorNext) => void;
type AgentInterceptorNext = (event: AgentOutput) => void;
```

**Example:**

```typescript
agent.intercept((event, next) => {
  // Filter events
  if (event.type === "sensitive_data") {
    return; // Skip by not calling next
  }

  // Modify events
  if (event.type === "text_delta") {
    event.data.text = transform(event.data.text);
  }

  // Continue chain
  next(event);
});
```

---

## MessageQueue

Read-only view of the message queue state.

```typescript
interface MessageQueue {
  readonly length: number;
  readonly isEmpty: boolean;
}
```

---

## AgentError

Standardized error structure for agent operations.

```typescript
interface AgentError {
  category: AgentErrorCategory;
  code: string;
  message: string;
  recoverable: boolean;
  cause?: Error;
  context?: Record<string, unknown>;
}

type AgentErrorCategory =
  | "network" // Network/API errors
  | "validation" // Input validation errors
  | "system" // Internal system errors
  | "business"; // Business logic errors
```

---

## Complete Example

```typescript
import { createAgent } from "@agentxjs/agent";
import type { AgentDriver, AgentPresenter, StreamEvent } from "@agentxjs/types/agent";

// Custom Driver
class MockDriver implements AgentDriver {
  readonly name = "MockDriver";
  private abortController?: AbortController;

  async *receive(message: UserMessage): AsyncIterable<StreamEvent> {
    this.abortController = new AbortController();

    yield { type: "message_start", timestamp: Date.now(), data: {} };

    const response = `You said: ${message.content}`;
    for (const char of response) {
      yield { type: "text_delta", timestamp: Date.now(), data: { text: char } };
    }

    yield { type: "message_stop", timestamp: Date.now(), data: { stopReason: "end_turn" } };
  }

  interrupt() {
    this.abortController?.abort();
  }
}

// Custom Presenter
class ConsolePresenter implements AgentPresenter {
  readonly name = "ConsolePresenter";

  present(agentId: string, output: AgentOutput): void {
    if (output.type === "text_delta") {
      process.stdout.write(output.data.text);
    } else if (output.type === "assistant_message") {
      console.log("\n[Complete]", output.data.content);
    }
  }
}

// Create and use the agent
async function main() {
  const agent = createAgent({
    driver: new MockDriver(),
    presenter: new ConsolePresenter(),
  });

  // Subscribe to state changes
  agent.onStateChange(({ prev, current }) => {
    console.log(`[State] ${prev} -> ${current}`);
  });

  // Add middleware
  agent.use(async (message, next) => {
    console.log("[Middleware] Processing:", message.content);
    await next(message);
  });

  // Subscribe with react-style handlers
  agent.react({
    onConversationStart: () => console.log("[Start]"),
    onConversationEnd: () => console.log("[End]"),
  });

  // Send message
  await agent.receive("Hello, Agent!");

  // Cleanup
  await agent.destroy();
}

main();
```

---

## Related Documentation

- [Mealy Machine Pattern](../concepts/mealy-machine.md) - Core processing pattern
- [Event System](../concepts/event-system.md) - Four-layer event architecture
- [AgentX API](./agentx.md) - High-level unified API
- [Runtime API](./runtime.md) - Runtime internals
