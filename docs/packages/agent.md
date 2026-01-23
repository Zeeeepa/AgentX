# @agentxjs/agent

> Pure event processing engine for AI conversations - the computational core of AgentX

## Overview

`@agentxjs/agent` is the event processing package of the AgentX framework. It implements the core Mealy Machine pattern to transform streaming LLM events into structured conversation events.

**Key Design Principle**: Pure event processing with no I/O operations.

```
StreamEvent (from Driver) --> [MealyMachine] --> AgentOutput (to Presenter)
```

The package provides:

- **AgentEngine** - Coordinates event flow between Driver, Processor, and Presenter
- **MealyMachine** - Pure state machine for event transformation
- **Internal Processors** - MessageAssembler, StateEventProcessor, TurnTracker
- **Processor Combinators** - Tools for building custom processors

## Installation

```bash
bun add @agentxjs/agent
```

**Peer Dependencies**:

```bash
bun add @agentxjs/types @agentxjs/common
```

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AgentEngine                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐      ┌─────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │  Driver  │ ───► │ MealyMachine│ ───► │ StateMachine │ ───► │ Presenter│ │
│  │ (Source) │      │ (Processor) │      │   (State)    │      │  (Sink)  │ │
│  └──────────┘      └─────────────┘      └──────────────┘      └──────────┘ │
│       │                  │                     │                    │       │
│       │                  │                     │                    │       │
│  Produces            Transforms             Tracks              Consumes    │
│  StreamEvents        Events                 AgentState          AgentOutput │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mealy Machine Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                      MealyMachine                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Input: StreamEvent (from Driver)                            │
│      │                                                        │
│      ▼                                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Processor Pipeline                        │  │
│  │                                                         │  │
│  │  1. MessageAssembler  (Stream --> Message)              │  │
│  │       ↓                                                 │  │
│  │  2. StateEventProcessor (Stream --> State)              │  │
│  │       ↓                                                 │  │
│  │  3. TurnTracker (Message --> Turn)                      │  │
│  └────────────────────────────────────────────────────────┘  │
│      │                                                        │
│      ▼                                                        │
│  Output: AgentOutput (Stream + State + Message + Turn)       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Event Layers

The package transforms events across four layers:

```
Layer 1: Stream (real-time, incremental)
├── message_start
├── text_delta
├── tool_use_start
├── input_json_delta
├── tool_use_stop
├── tool_result
└── message_stop

    ↓ MessageAssembler

Layer 2: Message (complete units)
├── assistant_message
├── tool_call_message
├── tool_result_message
└── error_message

    ↓ StateEventProcessor

Layer 3: State (transitions)
├── conversation_start
├── conversation_responding
├── conversation_end
├── tool_planned
├── tool_executing
└── error_occurred

    ↓ TurnTracker

Layer 4: Turn (analytics)
├── turn_request
└── turn_response (with duration, tokens, cost)
```

## Core Components

### AgentEngine

The `AgentEngine` interface coordinates event flow between Driver, Processor, and Presenter.

```typescript
import { createAgent } from "@agentxjs/agent";
import type { AgentDriver, AgentPresenter } from "@agentxjs/types/agent";

// Create driver (event source)
const driver: AgentDriver = {
  name: "MockDriver",
  receive: async function* (message) {
    yield { type: "message_start", timestamp: Date.now(), data: { messageId: "msg_1" } };
    yield { type: "text_delta", timestamp: Date.now(), data: { text: "Hello!" } };
    yield { type: "message_stop", timestamp: Date.now(), data: { stopReason: "end_turn" } };
  },
  interrupt: () => {},
};

// Create presenter (event consumer)
const presenter: AgentPresenter = {
  name: "LogPresenter",
  present: (agentId, output) => {
    console.log(`[${agentId}] ${output.type}`, output.data);
  },
};

// Create agent engine
const agent = createAgent({ driver, presenter });

// Subscribe to events
agent.on("text_delta", (event) => {
  process.stdout.write(event.data.text);
});

agent.on("assistant_message", (event) => {
  console.log("\nComplete message:", event.data.content);
});

// Send message
await agent.receive("Hello!");
```

**AgentEngine Interface**:

```typescript
interface AgentEngine {
  readonly agentId: string;
  readonly state: AgentState;
  readonly createdAt: number;
  readonly messageQueue: MessageQueue;

  // Receive user input
  receive(message: string | UserMessage): Promise<void>;

  // Event subscription
  on(handler: AgentOutputCallback): Unsubscribe;
  on(type: string, handler: AgentOutputCallback): Unsubscribe;
  on(types: string[], handler: AgentOutputCallback): Unsubscribe;
  on(handlers: EventHandlerMap): Unsubscribe;

  // React-style subscription
  react(handlers: ReactHandlerMap): Unsubscribe;

  // State change subscription
  onStateChange(handler: StateChangeHandler): Unsubscribe;

  // Lifecycle
  onReady(handler: () => void): Unsubscribe;
  onDestroy(handler: () => void): Unsubscribe;
  interrupt(): void;
  destroy(): Promise<void>;

  // Middleware/Interceptor
  use(middleware: AgentMiddleware): Unsubscribe;
  intercept(interceptor: AgentInterceptor): Unsubscribe;
}
```

### MealyMachine

The `MealyMachine` class implements the pure Mealy Machine pattern for event processing.

```typescript
import { MealyMachine, createMealyMachine } from "@agentxjs/agent";

// Create machine
const machine = createMealyMachine();

// Process events
const agentId = "agent_123";

const event = {
  type: "text_delta",
  timestamp: Date.now(),
  data: { text: "Hello" },
};

// Process returns all output events
const outputs = machine.process(agentId, event);

for (const output of outputs) {
  console.log(output.type, output.data);
}

// Clean up when done
machine.clearState(agentId);
```

**Key Properties**:

- **Stateless Processing** - State is managed externally via Store
- **Multi-Agent Support** - Single instance can process events for multiple agents
- **Event Chaining** - Outputs can trigger further processing (e.g., MessageEvent triggers TurnTracker)

### AgentStateMachine

Manages agent state transitions based on StateEvents.

```typescript
import { AgentStateMachine } from "@agentxjs/agent";

const stateMachine = new AgentStateMachine();

// Subscribe to state changes
stateMachine.onStateChange(({ prev, current }) => {
  console.log(`State: ${prev} --> ${current}`);
});

// Process StateEvents
stateMachine.process({ type: "conversation_start", timestamp: Date.now(), data: {} });
console.log(stateMachine.state); // "thinking"

stateMachine.process({ type: "conversation_responding", timestamp: Date.now(), data: {} });
console.log(stateMachine.state); // "responding"

stateMachine.process({ type: "conversation_end", timestamp: Date.now(), data: {} });
console.log(stateMachine.state); // "idle"
```

**State Transitions**:

```
                    ┌──────────────────┐
                    │      idle        │
                    └────────┬─────────┘
                             │ conversation_start
                             ▼
                    ┌──────────────────┐
          ┌────────│    thinking      │────────┐
          │        └────────┬─────────┘        │
          │                 │                  │
          │ tool_planned    │ text_delta       │ error_occurred
          ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  planning_tool   │ │   responding     │ │      error       │
└────────┬─────────┘ └────────┬─────────┘ └──────────────────┘
         │                    │
         │ tool_executing     │ conversation_end
         ▼                    │
┌──────────────────┐          │
│ awaiting_tool_   │          │
│     result       │──────────┘
└──────────────────┘
    tool_completed
```

## Internal Processors

### MessageAssembler

Assembles complete Message events from streaming chunks.

```typescript
import { messageAssemblerProcessor, createInitialMessageAssemblerState } from "@agentxjs/agent";

let state = createInitialMessageAssemblerState();

// Process stream events
const events = [
  { type: "message_start", data: { messageId: "msg_1" } },
  { type: "text_delta", data: { text: "Hello " } },
  { type: "text_delta", data: { text: "World!" } },
  { type: "message_stop", data: { stopReason: "end_turn" } },
];

for (const event of events) {
  const [newState, outputs] = messageAssemblerProcessor(state, event);
  state = newState;

  for (const output of outputs) {
    if (output.type === "assistant_message") {
      console.log("Assembled:", output.data.content); // "Hello World!"
    }
  }
}
```

**Input/Output**:

| Input Events       | Output Events         |
| ------------------ | --------------------- |
| `message_start`    | (state update only)   |
| `text_delta`       | (accumulates text)    |
| `tool_use_start`   | (state update only)   |
| `input_json_delta` | (accumulates JSON)    |
| `tool_use_stop`    | `tool_call_message`   |
| `tool_result`      | `tool_result_message` |
| `message_stop`     | `assistant_message`   |
| `error_received`   | `error_message`       |

### StateEventProcessor

Transforms Stream events into State events.

```typescript
import { stateEventProcessor, createInitialStateEventProcessorContext } from "@agentxjs/agent";

let context = createInitialStateEventProcessorContext();

// Process stream event
const [newContext, outputs] = stateEventProcessor(context, {
  type: "message_start",
  timestamp: Date.now(),
  data: { messageId: "msg_1" },
});

// outputs = [{ type: "conversation_start", ... }]
```

**Input/Output**:

| Input Events     | Output Events                        |
| ---------------- | ------------------------------------ |
| `message_start`  | `conversation_start`                 |
| `text_delta`     | `conversation_responding`            |
| `tool_use_start` | `tool_planned`, `tool_executing`     |
| `message_stop`   | `conversation_end` (if not tool_use) |
| `error_received` | `error_occurred`                     |

### TurnTracker

Tracks request-response cycles with analytics.

```typescript
import { turnTrackerProcessor, createInitialTurnTrackerState } from "@agentxjs/agent";

let state = createInitialTurnTrackerState();

// User message starts a turn
const [state1, outputs1] = turnTrackerProcessor(state, {
  type: "user_message",
  timestamp: Date.now(),
  data: { id: "msg_1", role: "user", content: "Hello" },
});
// outputs1 = [{ type: "turn_request", ... }]

// message_stop completes the turn
const [state2, outputs2] = turnTrackerProcessor(state1, {
  type: "message_stop",
  timestamp: Date.now(),
  data: { stopReason: "end_turn" },
});
// outputs2 = [{ type: "turn_response", data: { duration, usage, ... } }]
```

**Input/Output**:

| Input Events   | Output Events   |
| -------------- | --------------- |
| `user_message` | `turn_request`  |
| `message_stop` | `turn_response` |

## Processor Combinators

The package provides utilities for building custom processors.

### combineProcessors

Combine multiple processors into one, each managing its own state slice.

```typescript
import { combineProcessors, combineInitialStates, type Processor } from "@agentxjs/agent";

interface CombinedState {
  counter: { count: number };
  logger: { messages: string[] };
}

const counterProcessor: Processor<{ count: number }, Event, Event> = (state, event) => {
  if (event.type === "increment") {
    return [{ count: state.count + 1 }, []];
  }
  return [state, []];
};

const loggerProcessor: Processor<{ messages: string[] }, Event, Event> = (state, event) => {
  return [{ messages: [...state.messages, event.type] }, []];
};

const combined = combineProcessors<CombinedState, Event, Event>({
  counter: counterProcessor,
  logger: loggerProcessor,
});

const createInitialState = combineInitialStates<CombinedState>({
  counter: () => ({ count: 0 }),
  logger: () => ({ messages: [] }),
});
```

### chainProcessors

Chain processors where output of one feeds into the next.

```typescript
import { chainProcessors } from "@agentxjs/agent";

const pipeline = chainProcessors(preprocessor, mainProcessor, postProcessor);

const [state, outputs] = pipeline(initialState, input);
```

### filterProcessor

Create a processor that only handles certain events.

```typescript
import { filterProcessor } from "@agentxjs/agent";

const textOnlyProcessor = filterProcessor((event) => event.type === "text_delta", myProcessor);
```

### mapOutput

Transform output events.

```typescript
import { mapOutput } from "@agentxjs/agent";

const withTimestamp = mapOutput(myProcessor, (output) => ({
  ...output,
  processedAt: Date.now(),
}));
```

### withLogging

Add debug logging to a processor.

```typescript
import { withLogging, createLogger } from "@agentxjs/agent";

const logger = createLogger("my/processor");
const debugProcessor = withLogging(myProcessor, "MyProcessor", logger);
```

### identityProcessor

A processor that does nothing (useful as default).

```typescript
import { identityProcessor } from "@agentxjs/agent";

const noopProcessor = identityProcessor<MyState, MyEvent>();
```

## Building Custom Drivers

Drivers are event sources that produce StreamEvents from external systems.

### Basic Driver

```typescript
import type { AgentDriver, StreamEvent, UserMessage } from "@agentxjs/types/agent";

const myDriver: AgentDriver = {
  name: "MyCustomDriver",
  description: "A custom driver implementation",

  receive: async function* (message: UserMessage): AsyncIterable<StreamEvent> {
    // Emit message_start
    yield {
      type: "message_start",
      timestamp: Date.now(),
      data: { messageId: `msg_${Date.now()}` },
    };

    // Process message and emit text_delta events
    const response = await callMyLLM(message.content);

    for (const chunk of response.chunks) {
      yield {
        type: "text_delta",
        timestamp: Date.now(),
        data: { text: chunk },
      };
    }

    // Emit message_stop
    yield {
      type: "message_stop",
      timestamp: Date.now(),
      data: { stopReason: "end_turn" },
    };
  },

  interrupt: () => {
    // Handle interrupt request
    abortController.abort();
  },
};
```

### Driver with Tool Support

```typescript
const toolDriver: AgentDriver = {
  name: "ToolDriver",

  receive: async function* (message) {
    yield { type: "message_start", timestamp: Date.now(), data: { messageId: "msg_1" } };

    // LLM decides to use a tool
    yield {
      type: "tool_use_start",
      timestamp: Date.now(),
      data: { toolCallId: "tool_1", toolName: "calculator" },
    };

    yield {
      type: "input_json_delta",
      timestamp: Date.now(),
      data: { partialJson: '{"expression":' },
    };

    yield {
      type: "input_json_delta",
      timestamp: Date.now(),
      data: { partialJson: '"2+2"}' },
    };

    yield { type: "tool_use_stop", timestamp: Date.now(), data: {} };

    // Execute tool and return result
    yield {
      type: "tool_result",
      timestamp: Date.now(),
      data: { toolCallId: "tool_1", result: "4", isError: false },
    };

    // Continue with final response
    yield { type: "text_delta", timestamp: Date.now(), data: { text: "The result is 4" } };
    yield { type: "message_stop", timestamp: Date.now(), data: { stopReason: "end_turn" } };
  },

  interrupt: () => {},
};
```

## Building Custom Presenters

Presenters consume AgentOutput events and produce side effects.

### Logging Presenter

```typescript
import type { AgentPresenter, AgentOutput } from "@agentxjs/types/agent";

const loggingPresenter: AgentPresenter = {
  name: "LoggingPresenter",
  description: "Logs all events to console",

  present: (agentId: string, output: AgentOutput) => {
    console.log(`[${agentId}] ${output.type}:`, JSON.stringify(output.data));
  },
};
```

### SSE Presenter

```typescript
const ssePresenter: AgentPresenter = {
  name: "SSEPresenter",
  description: "Sends events via Server-Sent Events",

  present: (agentId, output) => {
    // Only send Stream events via SSE
    const streamEvents = ["message_start", "text_delta", "tool_use_start", "message_stop"];

    if (streamEvents.includes(output.type)) {
      sseConnection.send(agentId, {
        event: output.type,
        data: JSON.stringify(output.data),
      });
    }
  },
};
```

### Persistence Presenter

```typescript
const persistencePresenter: AgentPresenter = {
  name: "PersistencePresenter",
  description: "Persists messages to database",

  present: async (agentId, output) => {
    // Only persist complete messages
    if (output.type === "assistant_message" || output.type === "tool_call_message") {
      await db.messages.insert({
        agentId,
        ...output.data,
      });
    }
  },
};
```

## Testing

The Mealy Machine pattern enables easy testing without mocks.

### Testing Processors

```typescript
import { describe, it, expect } from "bun:test";
import { messageAssemblerProcessor, createInitialMessageAssemblerState } from "@agentxjs/agent";

describe("MessageAssembler", () => {
  it("assembles text deltas into complete message", () => {
    let state = createInitialMessageAssemblerState();

    // Process events
    const events = [
      { type: "message_start", timestamp: 1000, data: { messageId: "msg_1" } },
      { type: "text_delta", timestamp: 1001, data: { text: "Hello" } },
      { type: "text_delta", timestamp: 1002, data: { text: " World" } },
      { type: "message_stop", timestamp: 1003, data: { stopReason: "end_turn" } },
    ];

    let finalOutputs = [];
    for (const event of events) {
      const [newState, outputs] = messageAssemblerProcessor(state, event);
      state = newState;
      finalOutputs.push(...outputs);
    }

    // Assert on outputs
    expect(finalOutputs).toHaveLength(1);
    expect(finalOutputs[0].type).toBe("assistant_message");
    expect(finalOutputs[0].data.content[0].text).toBe("Hello World");
  });
});
```

### Testing AgentEngine

```typescript
import { describe, it, expect } from "bun:test";
import { createAgent } from "@agentxjs/agent";

describe("AgentEngine", () => {
  it("processes messages through driver", async () => {
    const events: any[] = [];

    const driver = {
      name: "TestDriver",
      receive: async function* () {
        yield { type: "message_start", timestamp: Date.now(), data: { messageId: "1" } };
        yield { type: "text_delta", timestamp: Date.now(), data: { text: "Hi" } };
        yield { type: "message_stop", timestamp: Date.now(), data: { stopReason: "end_turn" } };
      },
      interrupt: () => {},
    };

    const presenter = {
      name: "TestPresenter",
      present: (_agentId, output) => events.push(output),
    };

    const agent = createAgent({ driver, presenter });
    await agent.receive("Hello");

    const types = events.map((e) => e.type);
    expect(types).toContain("message_start");
    expect(types).toContain("text_delta");
    expect(types).toContain("assistant_message");
    expect(types).toContain("conversation_end");
  });
});
```

## API Reference

### Exports

```typescript
// Core API
export { createAgent } from "./createAgent";
export { AgentStateMachine } from "./AgentStateMachine";
export type { AgentEngine, CreateAgentOptions } from "@agentxjs/types/agent";

// MealyMachine
export { MealyMachine, createMealyMachine } from "./engine/MealyMachine";

// AgentProcessor
export {
  agentProcessor,
  createInitialAgentEngineState,
  type AgentEngineState,
  type AgentProcessorInput,
  type AgentProcessorOutput,
} from "./engine/AgentProcessor";

// Internal Processors
export {
  // MessageAssembler
  messageAssemblerProcessor,
  messageAssemblerProcessorDef,
  createInitialMessageAssemblerState,
  type MessageAssemblerState,
  type MessageAssemblerInput,
  type MessageAssemblerOutput,
  type PendingContent,

  // StateEventProcessor
  stateEventProcessor,
  stateEventProcessorDef,
  createInitialStateEventProcessorContext,
  type StateEventProcessorContext,
  type StateEventProcessorInput,
  type StateEventProcessorOutput,

  // TurnTracker
  turnTrackerProcessor,
  turnTrackerProcessorDef,
  createInitialTurnTrackerState,
  type TurnTrackerState,
  type TurnTrackerInput,
  type TurnTrackerOutput,
  type PendingTurn,
} from "./engine/internal";

// Mealy Machine Core
export {
  type Source,
  type SourceDefinition,
  type Processor,
  type ProcessorResult,
  type ProcessorDefinition,
  type Sink,
  type SinkDefinition,
  type Store,
  MemoryStore,

  // Combinators
  combineProcessors,
  combineInitialStates,
  chainProcessors,
  filterProcessor,
  mapOutput,
  withLogging,
  identityProcessor,
} from "./engine/mealy";
```

### Type Definitions

```typescript
// Processor function signature
type Processor<TState, TInput, TOutput> = (
  state: Readonly<TState>,
  input: TInput
) => [TState, TOutput[]];

// Store interface for state management
interface Store<T> {
  get(id: string): T | undefined;
  set(id: string, state: T): void;
  delete(id: string): void;
  has(id: string): boolean;
}

// Source: Input adapter (produces events)
type Source<TInput, TRequest = void> = (request: TRequest) => AsyncIterable<TInput>;

// Sink: Output adapter (consumes events)
type Sink<TOutput> = (id: string, outputs: TOutput[]) => void | Promise<void>;
```

## Design Principles

### 1. Pure Functions

All processors are pure functions with no side effects.

```typescript
// Pure: deterministic, testable
const processor = (state, input) => [newState, outputs];

// Not pure: has side effects
const badProcessor = (state, input) => {
  console.log(input); // Side effect!
  await db.save(input); // Side effect!
  return [state, []];
};
```

### 2. State is Means, Output is Goal

State exists to produce outputs, not as the end goal.

```typescript
// State accumulates text...
state = { buffer: "Hello " };
input = { type: "text_delta", data: { text: "World" } };

// ...to produce complete messages
output = { type: "assistant_message", data: { content: "Hello World" } };
```

### 3. Composable Processors

Complex behavior emerges from simple, composable parts.

```typescript
// Simple processors
const a = (s, i) => [s, [output1]];
const b = (s, i) => [s, [output2]];
const c = (s, i) => [s, [output3]];

// Complex processor
const combined = combineProcessors({ a, b, c });
```

### 4. Separation of Concerns

- **Driver** - Produces events (I/O, external)
- **Processor** - Transforms events (pure, internal)
- **Presenter** - Consumes events (I/O, external)

## Related Documentation

- [Mealy Machine Concept](../concepts/mealy-machine.md) - Core pattern explanation
- [Event System](../concepts/event-system.md) - Four-layer event architecture
- [@agentxjs/types](./types.md) - Type definitions
- [@agentxjs/runtime](./runtime.md) - Runtime layer with Container, Session, Bus
