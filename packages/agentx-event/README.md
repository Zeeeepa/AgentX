# @deepractice-ai/agentx-event

**AgentX Event System** - A layered, type-safe event architecture for AI agent communication.

## 📋 Overview

This package provides a comprehensive event system for AgentX, organized into **four semantic layers** that represent different perspectives on the same agent interaction:

```
┌─────────────────────────────────────────────────────────────┐
│  Stream Layer    - Incremental data transmission (deltas)   │
│  State Layer     - State transitions (lifecycle)            │
│  Message Layer   - Complete messages (user perspective)     │
│  Exchange Layer  - Request-response pairs (analytics)       │
└─────────────────────────────────────────────────────────────┘
```

### Philosophy

**Different Layers = Different Perspectives on Same Reality**

Each layer observes the same agent interaction from a different viewpoint:

- **Stream**: Technical view - "Data is flowing byte by byte"
- **State**: State machine view - "Agent transitioned from thinking to responding"
- **Message**: User view - "User asked a question, assistant replied"
- **Exchange**: Analytics view - "This request-response cycle took 2.5s and cost $0.03"

**All layers can coexist** - choose the layer that best fits your use case.

---

## 🏗️ Architecture

### Base Layer

All events extend the base `AgentEvent`:

```typescript
interface AgentEvent {
  uuid: string;        // Unique event ID
  agentId: string;     // Which agent instance
  timestamp: number;   // When it happened
}
```

### Event Bus Pattern

Events flow through a **Producer-Consumer** pattern:

```typescript
import { AgentEventBus } from "@deepractice-ai/agentx-core";
import type { EventBus, EventProducer, EventConsumer } from "@deepractice-ai/agentx-event/bus";

const bus: EventBus = new AgentEventBus();

// Create producer/consumer pairs
const producer: EventProducer = bus.createProducer();
const consumer: EventConsumer = bus.createConsumer();

// Consume specific event types
consumer.consumeByType("user_message", (event) => {
  console.log("User said:", event.data.content);
});

// Produce events
producer.produce({
  type: "user_message",
  uuid: generateId(),
  agentId: "agent-1",
  timestamp: Date.now(),
  data: userMessage
});
```

---

## 📚 Layer Documentation

### 1. Stream Layer - Incremental Data Transmission

**Purpose**: Low-level streaming events for real-time UI updates.

**Use Cases**:
- Typewriter effect for streaming text
- Progress indicators during tool execution
- Real-time content block rendering

**Event Flow Example** (Text streaming):

```typescript
MessageStartEvent
  → TextContentBlockStartEvent
    → TextDeltaEvent (x N)  // "Hello" → " world" → "!"
  → TextContentBlockStopEvent
  → MessageDeltaEvent
→ MessageStopEvent
```

**Key Events**:

| Event | Description | Data |
|-------|-------------|------|
| `MessageStartEvent` | Message begins | `{ message: { id, model } }` |
| `TextDeltaEvent` | Text chunk arrives | `{ text: string }` |
| `InputJsonDeltaEvent` | Tool input chunk | `{ json: string }` |
| `MessageStopEvent` | Message complete | `{ stopReason }` |

**Example Usage**:

```typescript
let fullText = "";

consumer.consumeByType("text_delta", (event) => {
  fullText += event.data.text;
  updateUI(fullText); // Typewriter effect
});
```

---

### 2. State Layer - State Transitions

**Purpose**: Track agent lifecycle and state machine transitions.

**Use Cases**:
- Agent initialization/shutdown
- Conversation flow management
- Tool execution lifecycle
- Error state handling

**State Machine Example** (Tool execution):

```
ToolPlannedStateEvent
  ↓
ToolExecutingStateEvent
  ↓
ToolCompletedStateEvent / ToolFailedStateEvent
```

**State Categories**:

#### Agent Lifecycle
- `AgentInitializingStateEvent` - Agent starting up
- `AgentReadyStateEvent` - Agent ready to receive requests
- `AgentDestroyedStateEvent` - Agent shutting down

#### Conversation Lifecycle
- `ConversationStartStateEvent` - User initiates conversation
- `ConversationThinkingStateEvent` - Agent is thinking
- `ConversationRespondingStateEvent` - Agent is responding
- `ConversationEndStateEvent` - Conversation complete

#### Tool Lifecycle
- `ToolPlannedStateEvent` - Agent decides to use tool
- `ToolExecutingStateEvent` - Tool is running
- `ToolCompletedStateEvent` - Tool finished successfully
- `ToolFailedStateEvent` - Tool execution failed

#### Stream Lifecycle
- `StreamStartStateEvent` - Streaming begins
- `StreamCompleteStateEvent` - Streaming ends

#### Error Handling
- `ErrorOccurredStateEvent` - Error occurred during execution

**StateEvent Base**:

All state events extend `StateEvent`:

```typescript
interface StateEvent extends AgentEvent {
  previousState?: string;      // Where we came from
  transition?: {
    reason?: string;            // Why we transitioned
    durationMs?: number;        // Time in previous state
    trigger?: string;           // What caused transition
  };
}
```

**Example Usage**:

```typescript
// State machine tracker
consumer.consumeByType("tool_planned", (event) => {
  console.log(`Agent planning to use ${event.data.toolUse.name}`);
  console.log(`Previous state: ${event.previousState}`);
});

consumer.consumeByType("tool_completed", (event) => {
  console.log(`Tool ${event.data.toolResult.name} completed`);
  console.log(`Duration: ${event.transition?.durationMs}ms`);
});
```

---

### 3. Message Layer - Complete Messages

**Purpose**: Represent complete messages from the user's perspective.

**Use Cases**:
- Message history/chat log
- Conversation UI rendering
- Message persistence

**Key Difference from State Layer**:

```typescript
// State Layer: Focus on STATE TRANSITION
ConversationStartStateEvent {
  type: "conversation_start",
  data: { userMessage: {...} }  // State includes message
}

// Message Layer: Focus on THE MESSAGE ITSELF
UserMessageEvent {
  type: "user_message",
  data: {...}  // Message is the main entity
}
```

**Message Events**:

| Event | Description | Data Type |
|-------|-------------|-----------|
| `UserMessageEvent` | User sent a message | `UserMessage` |
| `AssistantMessageEvent` | Assistant completed response | `AssistantMessage` |
| `ToolUseMessageEvent` | Tool usage (call + result) | `ToolUseMessage` |
| `ErrorMessageEvent` | Error occurred | `ErrorMessage` |

**ToolUseMessage - Unified Tool View**:

`ToolUseMessage` represents the **complete tool usage** from the user's perspective:

```typescript
interface ToolUseMessage {
  id: string;
  role: "tool-use";

  // What tool was called
  toolCall: ToolCallPart;     // { id, name, input }

  // What it returned
  toolResult: ToolResultPart; // { id, name, output }

  timestamp: number;
  parentId?: string;
}
```

**Why Unified?**
- User doesn't care about "call" vs "result" separation
- They see: "Agent used calculator and got 42"
- Lifecycle tracking happens in **State Layer** instead

**Example Usage**:

```typescript
// Render chat history
consumer.consumeByType("user_message", (event) => {
  chatLog.append({
    role: "user",
    content: event.data.content,
    timestamp: event.timestamp
  });
});

consumer.consumeByType("tool_use_message", (event) => {
  chatLog.append({
    role: "tool-use",
    call: event.data.toolCall.name,
    result: event.data.toolResult.output,
    timestamp: event.timestamp
  });
});
```

---

### 4. Exchange Layer - Request-Response Pairs

**Purpose**: Group messages into request-response units for analytics.

**Use Cases**:
- Cost tracking per exchange
- Performance monitoring
- Usage analytics
- Billing metrics

**Exchange Events**:

| Event | Description | Data |
|-------|-------------|------|
| `ExchangeRequestEvent` | User initiated request | `{ userMessage, requestedAt }` |
| `ExchangeResponseEvent` | Agent completed response | `{ assistantMessage, completedAt, duration, cost, tokens }` |

**Example Flow**:

```typescript
ExchangeRequestEvent
  [User: "What is 2+2?"]
  ↓
  [... Stream/State/Message events ...]
  ↓
ExchangeResponseEvent
  [Assistant: "2+2 equals 4"]
  [Duration: 850ms, Tokens: 120, Cost: $0.002]
```

**Example Usage**:

```typescript
const exchanges = [];

consumer.consumeByType("exchange_request", (event) => {
  exchanges.push({
    id: event.uuid,
    userMessage: event.data.userMessage,
    startTime: event.data.requestedAt
  });
});
 
consumer.consumeByType("exchange_response", (event) => {
  const exchange = findById(event.data.exchangeId);
  exchange.assistantMessage = event.data.assistantMessage;
  exchange.duration = event.data.duration;
  exchange.cost = event.data.cost;
  exchange.tokens = event.data.tokens;

  // Analytics
  console.log(`Exchange completed in ${event.data.duration}ms`);
  console.log(`Cost: $${event.data.cost}`);
});
```

---

## 🎯 Which Layer Should I Use?

### Use Stream Layer When:
- ✅ Building real-time UI with streaming text
- ✅ Need fine-grained progress updates
- ✅ Implementing typewriter effects
- ❌ **Don't use for**: Message history, state management

### Use State Layer When:
- ✅ Implementing state machines
- ✅ Tracking agent lifecycle
- ✅ Managing tool execution flow
- ✅ Handling errors and recovery
- ❌ **Don't use for**: Message rendering

### Use Message Layer When:
- ✅ Building chat UI / message history
- ✅ Persisting conversation data
- ✅ Rendering complete messages
- ❌ **Don't use for**: Real-time streaming, state tracking

### Use Exchange Layer When:
- ✅ Tracking costs and performance
- ✅ Building analytics dashboards
- ✅ Usage monitoring and billing
- ❌ **Don't use for**: UI rendering

---

## 📊 Complete Event Flow Example

Here's how all layers work together for a single user interaction:

```typescript
// 1. EXCHANGE: User initiates request
ExchangeRequestEvent { userMessage: "Calculate 2+2" }

// 2. STATE: Conversation begins
ConversationStartStateEvent { userMessage }

// 3. MESSAGE: User message logged
UserMessageEvent { data: userMessage }

// 4. STATE: Agent starts thinking
ConversationThinkingStateEvent

// 5. STREAM: Response streaming begins
MessageStartEvent
StreamStartStateEvent

// 6. STATE: Agent decides to use tool
ToolPlannedStateEvent { toolUse: { name: "calculator", input: { a: 2, b: 2 } } }

// 7. STREAM: Tool call streamed
ToolUseContentBlockStartEvent
InputJsonDeltaEvent { json: '{"a":2,"b":2}' }
ToolUseContentBlockStopEvent

// 8. STATE: Tool executing
ToolExecutingStateEvent

// 9. STATE: Tool completed
ToolCompletedStateEvent { toolResult: { output: 4 } }

// 10. STATE: Agent responding
ConversationRespondingStateEvent

// 11. STREAM: Text response streamed
TextContentBlockStartEvent
TextDeltaEvent { text: "The" }
TextDeltaEvent { text: " answer" }
TextDeltaEvent { text: " is" }
TextDeltaEvent { text: " 4" }
TextContentBlockStopEvent

// 12. STREAM: Message complete
MessageStopEvent
StreamCompleteStateEvent

// 13. MESSAGE: Tool usage logged
ToolUseMessageEvent { toolCall, toolResult }

// 14. MESSAGE: Assistant message logged
AssistantMessageEvent { content: "The answer is 4" }

// 15. STATE: Conversation ends
ConversationEndStateEvent { tokens, duration }

// 16. EXCHANGE: Response complete
ExchangeResponseEvent { assistantMessage, cost, tokens, duration }
```

---

## 🔄 Event Bus Internals

### EventBus Interface

```typescript
interface EventBus {
  createProducer(): EventProducer;
  createConsumer(): EventConsumer;
  close(): void;
}
```

### EventProducer Interface

```typescript
interface EventProducer {
  produce(event: AgentEventType): void;
}
```

### EventConsumer Interface

```typescript
interface EventConsumer {
  // Consume all events
  consume(handler: (event: AgentEventType) => void): Unsubscribe;

  // Consume specific event type
  consumeByType<T extends AgentEventType>(
    type: T["type"],
    handler: (event: T) => void
  ): Unsubscribe;

  // Consume multiple event types
  consumeByTypes<T extends AgentEventType["type"]>(
    types: T[],
    handler: (event: Extract<AgentEventType, { type: T }>) => void
  ): Unsubscribe;

  // Unsubscribe from all
  unsubscribeAll(): void;
}
```

**Example**:

```typescript
const bus = new AgentEventBus();
const consumer = bus.createConsumer();

// Method 1: Consume all events
const unsubAll = consumer.consume((event) => {
  console.log(`Event: ${event.type}`);
});

// Method 2: Consume specific type
const unsubUser = consumer.consumeByType("user_message", (event) => {
  console.log("User:", event.data.content);
});

// Method 3: Consume multiple types
const unsubMessages = consumer.consumeByTypes(
  ["user_message", "assistant_message"],
  (event) => {
    if (event.type === "user_message") {
      // TypeScript knows event is UserMessageEvent
    }
  }
);

// Unsubscribe
unsubUser();
consumer.unsubscribeAll();
```

---

## 📦 Installation

```bash
pnpm add @deepractice-ai/agentx-event
```

**Peer Dependencies**:
- `@deepractice-ai/agentx-types` - Message and content types
- `@deepractice-ai/agentx-core` - EventBus implementation

---

## 📖 Usage Examples

### Example 1: Real-Time Chat UI

```typescript
import { AgentEventBus } from "@deepractice-ai/agentx-core";
import type { EventConsumer } from "@deepractice-ai/agentx-event/bus";

const bus = new AgentEventBus();
const consumer: EventConsumer = bus.createConsumer();

let streamingText = "";

// Stream Layer: Real-time text updates
consumer.consumeByType("text_delta", (event) => {
  streamingText += event.data.text;
  updateChatUI(streamingText);
});

consumer.consumeByType("message_stop", () => {
  streamingText = "";
});

// Message Layer: Persist complete messages
consumer.consumeByType("assistant_message", (event) => {
  saveToHistory(event.data);
});
```

### Example 2: Tool Execution Tracker

```typescript
// State Layer: Track tool lifecycle
const toolStates = new Map();

consumer.consumeByType("tool_planned", (event) => {
  toolStates.set(event.data.toolUse.id, "planned");
  showToolProgress(event.data.toolUse.name, "planned");
});

consumer.consumeByType("tool_executing", (event) => {
  toolStates.set(event.data.toolUseId, "executing");
  showToolProgress(event.data.toolName, "executing");
});

consumer.consumeByType("tool_completed", (event) => {
  toolStates.set(event.data.toolResult.id, "completed");
  showToolProgress(event.data.toolResult.name, "completed");
});

// Message Layer: Display final result
consumer.consumeByType("tool_use_message", (event) => {
  displayToolResult({
    tool: event.data.toolCall.name,
    input: event.data.toolCall.input,
    output: event.data.toolResult.output
  });
});
```

### Example 3: Analytics Dashboard

```typescript
// Exchange Layer: Track performance
const analytics = {
  totalExchanges: 0,
  totalCost: 0,
  totalTokens: 0,
  avgDuration: 0
};

consumer.consumeByType("exchange_response", (event) => {
  analytics.totalExchanges++;
  analytics.totalCost += event.data.cost || 0;
  analytics.totalTokens += event.data.tokens?.total || 0;
  analytics.avgDuration =
    (analytics.avgDuration * (analytics.totalExchanges - 1) + event.data.duration)
    / analytics.totalExchanges;

  updateDashboard(analytics);
});
```

### Example 4: State Machine Debugger

```typescript
// State Layer: Debug state transitions
const stateHistory = [];

consumer.consume((event) => {
  if ('previousState' in event) {
    stateHistory.push({
      from: event.previousState,
      to: event.type,
      timestamp: event.timestamp,
      duration: event.transition?.durationMs,
      reason: event.transition?.reason
    });

    console.log(`State: ${event.previousState} → ${event.type}`);
    if (event.transition?.durationMs) {
      console.log(`Duration: ${event.transition.durationMs}ms`);
    }
  }
});
```

---

## 🎨 Type Safety

All events are fully typed with TypeScript:

```typescript
import type { AgentEventType, StreamEventType, StateEventType } from "@deepractice-ai/agentx-event";

// Type-safe event handling
consumer.consumeByType("user_message", (event) => {
  // TypeScript knows event is UserMessageEvent
  event.data.content; // ✅ OK
  event.data.foobar;  // ❌ Type error
});

// Union type narrowing
function handleEvent(event: AgentEventType) {
  if (event.type === "text_delta") {
    // TypeScript knows event is TextDeltaEvent
    console.log(event.data.text);
  } else if (event.type === "tool_completed") {
    // TypeScript knows event is ToolCompletedStateEvent
    console.log(event.data.toolResult.output);
  }
}
```

---

## 📝 Design Principles

### 1. Separation of Concerns
Each layer has a single, well-defined purpose. Mixing concerns (e.g., using Stream events for state management) is an anti-pattern.

### 2. Type Safety First
All events are strongly typed. Runtime errors are caught at compile time.

### 3. Zero Duplication
Event types are defined once and reused everywhere. No string literals, no magic constants.

### 4. Backwards Compatibility
New events can be added without breaking existing consumers. Event schemas are versioned.

### 5. Performance
Events are lightweight. No heavy serialization. Minimal memory overhead.

---

## 🚫 Common Pitfalls

### ❌ DON'T: Use Stream events for state management
```typescript
// Bad
consumer.consumeByType("text_delta", (event) => {
  if (event.data.text === "Error:") {
    handleError(); // ❌ Fragile and unreliable
  }
});
```

```typescript
// Good
consumer.consumeByType("error_occurred", (event) => {
  handleError(event.data.error); // ✅ Explicit error event
});
```

### ❌ DON'T: Mix Message and State layers for same purpose
```typescript
// Bad
consumer.consumeByType("conversation_start", (event) => {
  addToHistory(event.data.userMessage); // ❌ Using state event for message history
});
```

```typescript
// Good
consumer.consumeByType("user_message", (event) => {
  addToHistory(event.data); // ✅ Using message event
});
```

### ❌ DON'T: Store state in event handlers
```typescript
// Bad
let currentState = "idle";
consumer.consumeByType("conversation_start", () => {
  currentState = "active"; // ❌ Manual state tracking
});
```

```typescript
// Good
const stateMachine = new StateMachine();
consumer.consume((event) => {
  if ('previousState' in event) {
    stateMachine.transition(event); // ✅ Use StateEvent metadata
  }
});
```

---

## ⚡ Event Reactors - Type-Safe Event Handling

**Reactors** provide a **compile-time safe** way to handle events by implementing interfaces that force you to handle all event types.

### Why Use Reactors?

**Traditional Approach** (Manual subscriptions):
```typescript
// ❌ Easy to forget an event type
consumer.consumeByType("user_message", handleUser);
consumer.consumeByType("assistant_message", handleAssistant);
// Oops! Forgot to handle tool_use_message and error_message
```

**Reactor Approach** (Type-safe contract):
```typescript
// ✅ TypeScript forces you to implement ALL methods
class ChatHandler implements MessageReactor {
  onUserMessage(event) { ... }
  onAssistantMessage(event) { ... }
  onToolUseMessage(event) { ... }
  onErrorMessage(event) { ... }  // Can't forget this!
}

bindMessageReactor(consumer, new ChatHandler());
```

### Four Reactor Interfaces

#### 1. StreamReactor - Handle All Stream Events

```typescript
import { bindStreamReactor, type StreamReactor } from "@deepractice-ai/agentx-event";

class StreamingUI implements StreamReactor {
  private currentText = "";

  onMessageStart(event) {
    console.log("Starting message:", event.data.message.id);
  }

  onTextDelta(event) {
    this.currentText += event.data.text;
    this.updateDisplay(this.currentText);
  }

  onMessageStop(event) {
    console.log("Message complete");
    this.currentText = "";
  }

  onTextContentBlockStart(event) { }
  onTextContentBlockStop(event) { }
  onMessageDelta(event) { }
  onToolUseContentBlockStart(event) { }
  onInputJsonDelta(event) { }
  onToolUseContentBlockStop(event) { }
}

// Automatic binding of all 9 stream events
const unbind = bindStreamReactor(consumer, new StreamingUI());
```

#### 2. StateReactor - Handle All State Transitions

```typescript
import { bindStateReactor, type StateReactor } from "@deepractice-ai/agentx-event";

class AgentStateMachine implements StateReactor {
  private currentState = "initializing";

  onAgentReady(event) {
    this.currentState = "ready";
    console.log(`Transitioned from ${event.previousState} to ready`);
  }

  onConversationStart(event) {
    this.currentState = "conversation_active";
  }

  onToolPlanned(event) {
    this.currentState = "tool_planned";
    console.log(`Planning to use: ${event.data.toolUse.name}`);
  }

  onToolCompleted(event) {
    console.log(`Tool completed in ${event.transition?.durationMs}ms`);
  }

  // ... implement all 14 state handlers
}

const unbind = bindStateReactor(consumer, new AgentStateMachine());
```

#### 3. MessageReactor - Handle All Message Events

```typescript
import { bindMessageReactor, type MessageReactor } from "@deepractice-ai/agentx-event";

class ChatHistory implements MessageReactor {
  private messages = [];

  onUserMessage(event) {
    this.messages.push({
      role: "user",
      content: event.data.content,
      timestamp: event.timestamp
    });
  }

  onAssistantMessage(event) {
    this.messages.push({
      role: "assistant",
      content: event.data.content,
      timestamp: event.timestamp
    });
  }

  onToolUseMessage(event) {
    this.messages.push({
      role: "tool-use",
      call: event.data.toolCall.name,
      result: event.data.toolResult.output,
      timestamp: event.timestamp
    });
  }

  onErrorMessage(event) {
    console.error("Error:", event.data.message);
  }
}

const unbind = bindMessageReactor(consumer, new ChatHistory());
```

#### 4. ExchangeReactor - Handle All Exchange Events

```typescript
import { bindExchangeReactor, type ExchangeReactor } from "@deepractice-ai/agentx-event";

class AnalyticsDashboard implements ExchangeReactor {
  private activeExchanges = new Map();
  private stats = {
    totalCost: 0,
    totalTokens: 0,
    avgDuration: 0,
    count: 0
  };

  onExchangeRequest(event) {
    this.activeExchanges.set(event.uuid, {
      startTime: event.data.requestedAt,
      userMessage: event.data.userMessage
    });
  }

  onExchangeResponse(event) {
    this.stats.count++;
    this.stats.totalCost += event.data.cost || 0;
    this.stats.totalTokens += event.data.tokens?.total || 0;
    this.stats.avgDuration =
      (this.stats.avgDuration * (this.stats.count - 1) + event.data.duration)
      / this.stats.count;

    this.updateDashboard(this.stats);
  }
}

const unbind = bindExchangeReactor(consumer, new AnalyticsDashboard());
```

### Partial Reactors - Implement Only What You Need

If you don't want to implement ALL methods, use `Partial*Reactor`:

```typescript
import { bindPartialMessageReactor, type PartialMessageReactor } from "@deepractice-ai/agentx-event";

// Only implement the events you care about
const simpleLogger: PartialMessageReactor = {
  onUserMessage(event) {
    console.log("User:", event.data.content);
  },

  onAssistantMessage(event) {
    console.log("Assistant:", event.data.content);
  }

  // Omit onToolUseMessage and onErrorMessage - that's OK!
};

const unbind = bindPartialMessageReactor(consumer, simpleLogger);
```

### Benefits of Reactors

✅ **Compile-Time Safety**: TypeScript will error if you forget to implement a method
✅ **Clear Contract**: Explicit interface showing all events you must handle
✅ **Auto-Binding**: No need to write manual `consumeByType` calls
✅ **Easy Unbind**: Single `unbind()` function removes all subscriptions
✅ **Self-Documenting**: Interface acts as documentation of all event types

### Reactor vs Manual Subscriptions

| Approach | Compile-Time Safety | Easy to Forget Events | Auto-Binding | Clear Contract |
|----------|---------------------|----------------------|--------------|----------------|
| **Manual `consumeByType`** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Full Reactor** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Partial Reactor** | ⚠️ Optional fields | ⚠️ Partial | ✅ Yes | ✅ Yes |

### When to Use Which?

- **Full Reactor**: When building critical systems (state machines, analytics) where missing an event could cause bugs
- **Partial Reactor**: When building UI components that only care about specific events
- **Manual `consumeByType`**: For quick prototyping or one-off event handlers

---

## 🔗 Related Packages

- **[@deepractice-ai/agentx-types](../agentx-types)** - Message and content type definitions
- **[@deepractice-ai/agentx-core](../agentx-core)** - Agent core logic and EventBus implementation
- **[@deepractice-ai/agentx-node](../agentx-node)** - Node.js provider (Claude SDK adapter)
- **[@deepractice-ai/agentx-browser](../agentx-browser)** - Browser WebSocket client

---

## 📄 License

MIT
