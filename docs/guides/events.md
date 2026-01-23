# Event Subscription Guide

Learn how to subscribe to events in AgentX for real-time updates, streaming, and state tracking.

## Overview

AgentX uses an event-driven architecture where all agent activities emit events. You can subscribe to these events to:

- Stream text in real-time (typewriter effect)
- Track agent state (thinking, responding, executing tools)
- Log complete messages for chat history
- Monitor usage and analytics

## Basic Subscription

### Subscribe to a Specific Event

Use `on()` to subscribe to a specific event type:

```typescript
import { createAgentX } from "agentxjs";

const agentx = await createAgentX({
  llm: { apiKey: "sk-ant-xxxxx" },
});

// Subscribe to text streaming
const unsubscribe = agentx.on("text_delta", (event) => {
  process.stdout.write(event.data.text);
});

// Later: stop listening
unsubscribe();
```

The `on()` method returns an unsubscribe function that you can call to stop receiving events.

### Subscribe to Multiple Event Types

Pass an array of event types to subscribe to multiple events with a single handler:

```typescript
agentx.on(["message_start", "message_stop"], (event) => {
  if (event.type === "message_start") {
    console.log("Response starting...");
  } else {
    console.log("Response complete");
  }
});
```

### Subscribe to All Events

Use `onAny()` to receive all events (useful for debugging or logging):

```typescript
agentx.onAny((event) => {
  console.log(`[${event.type}]`, event.data);
});
```

### One-Time Subscription

Use `once()` to automatically unsubscribe after the first event:

```typescript
agentx.once("conversation_end", () => {
  console.log("First conversation completed!");
  // Handler is automatically removed after this
});
```

## Event Types Reference

AgentX has four layers of events:

| Layer   | Events                                          | Use Case              |
| ------- | ----------------------------------------------- | --------------------- |
| Stream  | `text_delta`, `message_start`, `tool_use_start` | Real-time UI updates  |
| State   | `conversation_start`, `tool_executing`          | Loading indicators    |
| Message | `user_message`, `assistant_message`             | Chat history          |
| Turn    | `turn_request`, `turn_response`                 | Analytics and billing |

## Text Streaming Pattern

The most common pattern is streaming text as it's generated:

```typescript
let responseText = "";

agentx.on("message_start", () => {
  responseText = "";
  console.log("Assistant: ");
});

agentx.on("text_delta", (event) => {
  responseText += event.data.text;
  process.stdout.write(event.data.text);
});

agentx.on("message_stop", (event) => {
  console.log("\n");
  console.log("Stop reason:", event.data.stopReason);
  // responseText now contains the complete response
});
```

### Browser Implementation

For browser applications, update the DOM incrementally:

```typescript
const outputElement = document.getElementById("output");
let currentText = "";

agentx.on("text_delta", (event) => {
  currentText += event.data.text;
  outputElement.textContent = currentText;
});

agentx.on("message_stop", () => {
  currentText = "";
});
```

## State Tracking Pattern

Track agent state for loading indicators and UI state management:

```typescript
let isLoading = false;
let currentState = "idle";

agentx.on("conversation_start", () => {
  isLoading = true;
  currentState = "starting";
  showLoadingIndicator();
});

agentx.on("conversation_thinking", () => {
  currentState = "thinking";
  updateStatus("Thinking...");
});

agentx.on("conversation_responding", () => {
  currentState = "responding";
  updateStatus("Responding...");
});

agentx.on("conversation_end", () => {
  isLoading = false;
  currentState = "idle";
  hideLoadingIndicator();
});

agentx.on("conversation_interrupted", () => {
  isLoading = false;
  currentState = "interrupted";
  hideLoadingIndicator();
});
```

## Tool Execution Pattern

Track tool calls and their results:

```typescript
const pendingTools = new Map();

agentx.on("tool_use_start", (event) => {
  const { id, name } = event.data;
  console.log(`Tool requested: ${name}`);
  pendingTools.set(id, { name, startTime: Date.now() });
});

agentx.on("tool_executing", (event) => {
  const { toolCall } = event.data;
  console.log(`Executing: ${toolCall.name}`);
  console.log(`Input: ${JSON.stringify(toolCall.input)}`);
});

agentx.on("tool_completed", (event) => {
  const { toolResult } = event.data;
  const pending = pendingTools.get(toolResult.id);

  if (pending) {
    const duration = Date.now() - pending.startTime;
    console.log(`Tool ${toolResult.name} completed in ${duration}ms`);
    console.log(`Output: ${toolResult.output}`);
    pendingTools.delete(toolResult.id);
  }
});

agentx.on("tool_failed", (event) => {
  console.error("Tool failed:", event.data.error);
});
```

## Message History Pattern

Build chat history from message events:

```typescript
const messages = [];

agentx.on("user_message", (event) => {
  messages.push({
    role: "user",
    content: event.data.content,
    timestamp: event.timestamp,
  });
});

agentx.on("assistant_message", (event) => {
  messages.push({
    role: "assistant",
    content: event.data.content,
    timestamp: event.timestamp,
  });
});

agentx.on("tool_call_message", (event) => {
  messages.push({
    role: "assistant",
    type: "tool_call",
    toolCall: event.data.toolCall,
    timestamp: event.timestamp,
  });
});

agentx.on("tool_result_message", (event) => {
  messages.push({
    role: "tool",
    toolResult: event.data.toolResult,
    timestamp: event.timestamp,
  });
});
```

## Usage Analytics Pattern

Track token usage and costs:

```typescript
const usageStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCost: 0,
  turnCount: 0,
};

agentx.on("turn_request", (event) => {
  console.log("Turn started:", event.data.turnId);
});

agentx.on("turn_response", (event) => {
  const { durationMs, usage, costUsd } = event.data;

  usageStats.turnCount++;

  if (usage) {
    usageStats.totalInputTokens += usage.inputTokens;
    usageStats.totalOutputTokens += usage.outputTokens;
    console.log(`Turn ${usageStats.turnCount}: ${usage.totalTokens} tokens in ${durationMs}ms`);
  }

  if (costUsd) {
    usageStats.totalCost += costUsd;
    console.log(`Cost: $${costUsd.toFixed(4)}`);
  }
});
```

## Error Handling Pattern

Handle errors gracefully:

```typescript
agentx.on("error_occurred", (event) => {
  const { message, code, details } = event.data;

  console.error(`Error [${code}]: ${message}`);

  if (details) {
    console.error("Details:", details);
  }

  // Update UI
  showErrorNotification(message);
});

agentx.on("error_message", (event) => {
  // Error message in conversation
  const { content } = event.data;
  addErrorToChat(content);
});
```

## Filtering Events

### Filter by Agent ID

Filter events for a specific agent:

```typescript
const targetAgentId = "agent_123";

agentx.on("text_delta", (event) => {
  // Check event context
  if (event.context?.agentId !== targetAgentId) {
    return;
  }
  process.stdout.write(event.data.text);
});
```

### Filter by Session ID

Filter events for a specific session:

```typescript
const sessionId = "session_456";

agentx.on("assistant_message", (event) => {
  if (event.context?.sessionId !== sessionId) {
    return;
  }
  saveToSessionHistory(sessionId, event.data);
});
```

### Filter by Image ID (React Pattern)

In React applications, filter by imageId:

```typescript
function useAgentEvents(agentx, imageId) {
  useEffect(() => {
    if (!agentx || !imageId) return;

    const isForThisImage = (event) => {
      return event.context?.imageId === imageId;
    };

    const unsubscribes = [];

    unsubscribes.push(
      agentx.on("text_delta", (event) => {
        if (!isForThisImage(event)) return;
        // Handle event for this image only
      })
    );

    unsubscribes.push(
      agentx.on("conversation_end", (event) => {
        if (!isForThisImage(event)) return;
        // Handle event for this image only
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [agentx, imageId]);
}
```

## React Integration

### Using the useAgent Hook

The `@agentxjs/ui` package provides hooks that handle event subscriptions automatically:

```tsx
import { useAgentX, useAgent } from "@agentxjs/ui";

function ChatPage({ imageId }) {
  const agentx = useAgentX("ws://localhost:5200");

  const { conversations, streamingText, status, send, interrupt, isLoading } = useAgent(
    agentx,
    imageId
  );

  if (!agentx) return <div>Connecting...</div>;

  return (
    <div>
      {conversations.map((conv) => (
        <Message key={conv.id} data={conv} />
      ))}

      {isLoading && <LoadingIndicator status={status} />}

      <input
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            send(e.target.value);
          }
        }}
      />
    </div>
  );
}
```

### Manual Event Subscription in React

For custom implementations:

```tsx
import { useEffect, useState } from "react";
import { useAgentX } from "@agentxjs/ui";

function CustomChat({ imageId }) {
  const agentx = useAgentX("ws://localhost:5200");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState("");

  useEffect(() => {
    if (!agentx) return;

    const unsubscribes = [];

    unsubscribes.push(
      agentx.on("text_delta", (event) => {
        if (event.context?.imageId !== imageId) return;
        setStreaming((prev) => prev + event.data.text);
      })
    );

    unsubscribes.push(
      agentx.on("assistant_message", (event) => {
        if (event.context?.imageId !== imageId) return;
        setMessages((prev) => [...prev, event.data]);
        setStreaming("");
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [agentx, imageId]);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {streaming && <div className="streaming">{streaming}</div>}
    </div>
  );
}
```

## Unsubscribing from Events

### Manual Unsubscription

Always unsubscribe when the component unmounts or when you no longer need events:

```typescript
// Store the unsubscribe function
const unsubscribe = agentx.on("text_delta", handler);

// Later, when done
unsubscribe();
```

### Batch Unsubscription

For multiple subscriptions:

```typescript
const unsubscribes = [];

unsubscribes.push(agentx.on("text_delta", handleTextDelta));
unsubscribes.push(agentx.on("conversation_start", handleStart));
unsubscribes.push(agentx.on("conversation_end", handleEnd));

// Cleanup all at once
function cleanup() {
  unsubscribes.forEach((unsub) => unsub());
  unsubscribes.length = 0;
}
```

### React Cleanup Pattern

```tsx
useEffect(() => {
  const unsubscribes = [];

  unsubscribes.push(agentx.on("text_delta", handler1));
  unsubscribes.push(agentx.on("message_stop", handler2));

  // Cleanup function runs on unmount or dependency change
  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}, [agentx, dependency]);
```

## Best Practices

### 1. Always Unsubscribe

Prevent memory leaks by unsubscribing when done:

```typescript
// Bad - memory leak
agentx.on("text_delta", handler);

// Good - store and call unsubscribe
const unsubscribe = agentx.on("text_delta", handler);
// ... later
unsubscribe();
```

### 2. Filter Events Early

Check event context at the start of handlers:

```typescript
agentx.on("text_delta", (event) => {
  // Early return for irrelevant events
  if (event.context?.agentId !== myAgentId) return;

  // Process relevant events
  handleText(event.data.text);
});
```

### 3. Handle Errors Gracefully

Always subscribe to error events:

```typescript
agentx.on("error_occurred", (event) => {
  console.error("Agent error:", event.data.message);
  // Show user-friendly error
  showNotification("An error occurred. Please try again.");
});
```

### 4. Use Appropriate Event Layers

Choose the right event layer for your use case:

```typescript
// For real-time UI updates - use Stream events
agentx.on("text_delta", updateUI);

// For loading indicators - use State events
agentx.on("conversation_start", showLoader);

// For chat history - use Message events
agentx.on("assistant_message", saveToHistory);

// For analytics - use Turn events
agentx.on("turn_response", trackUsage);
```

### 5. Batch State Updates in React

Avoid excessive re-renders by batching updates:

```typescript
// Bad - triggers re-render on every delta
agentx.on("text_delta", (event) => {
  setText((prev) => prev + event.data.text);
});

// Better - use a ref for streaming, update state on complete
const streamingRef = useRef("");

agentx.on("text_delta", (event) => {
  streamingRef.current += event.data.text;
  // Update UI without re-render (e.g., direct DOM manipulation)
  outputRef.current.textContent = streamingRef.current;
});

agentx.on("message_stop", () => {
  // Single state update at the end
  setFinalText(streamingRef.current);
  streamingRef.current = "";
});
```

## Complete Example

Here's a complete example combining all patterns:

```typescript
import { createAgentX } from "agentxjs";

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: "sk-ant-xxxxx" },
  });

  // State tracking
  let status = "idle";
  let currentResponse = "";
  const messages = [];
  const usageStats = { tokens: 0, cost: 0 };

  // Stream layer - real-time text
  agentx.on("text_delta", (event) => {
    currentResponse += event.data.text;
    process.stdout.write(event.data.text);
  });

  // State layer - loading indicators
  agentx.on("conversation_start", () => {
    status = "thinking";
    currentResponse = "";
    console.log("\nAssistant: ");
  });

  agentx.on("conversation_end", () => {
    status = "idle";
    console.log("\n");
  });

  // Message layer - history
  agentx.on("assistant_message", (event) => {
    messages.push({
      role: "assistant",
      content: event.data.content,
    });
  });

  // Turn layer - analytics
  agentx.on("turn_response", (event) => {
    if (event.data.usage) {
      usageStats.tokens += event.data.usage.totalTokens;
    }
    if (event.data.costUsd) {
      usageStats.cost += event.data.costUsd;
    }
  });

  // Error handling
  agentx.on("error_occurred", (event) => {
    console.error("\nError:", event.data.message);
    status = "error";
  });

  // Setup and send message
  await agentx.request("container_create_request", {
    containerId: "main",
  });

  const agentRes = await agentx.request("agent_run_request", {
    containerId: "main",
    config: {
      name: "Assistant",
      systemPrompt: "You are a helpful assistant.",
    },
  });

  await agentx.request("agent_receive_request", {
    agentId: agentRes.data.agentId,
    content: "Hello!",
  });

  // Wait for completion
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\nUsage:", usageStats);
  await agentx.dispose();
}

main().catch(console.error);
```

## Next Steps

- **[Event System Concepts](../concepts/event-system.md)** - Deep dive into the 4-layer architecture
- **[First Agent Tutorial](../getting-started/first-agent.md)** - Build a complete agent
- **[Lifecycle Management](../concepts/lifecycle.md)** - Agent lifecycle (run, stop, resume)
