# Event Types Reference

Complete API reference for all event types in the AgentX event system.

## Overview

AgentX uses a 4-layer event architecture where different event layers serve different purposes:

| Layer   | Category | Purpose                       | Use Case            |
| ------- | -------- | ----------------------------- | ------------------- |
| Layer 1 | Stream   | Real-time incremental updates | UI rendering        |
| Layer 2 | State    | Agent state transitions       | Loading indicators  |
| Layer 3 | Message  | Complete conversation records | Chat history        |
| Layer 4 | Turn     | Analytics and metrics         | Billing, monitoring |

Additionally, **Command Events** provide request/response pairs for runtime operations.

---

## Base Event Structure

All events in AgentX extend the `SystemEvent` interface:

```typescript
interface SystemEvent<
  T extends string = string,
  D = unknown,
  S extends EventSource = EventSource,
  C extends EventCategory = EventCategory,
  I extends EventIntent = EventIntent,
> {
  /** Event type identifier (e.g., "text_delta", "session_saved") */
  readonly type: T;

  /** Event timestamp (Unix milliseconds) */
  readonly timestamp: number;

  /** Event payload data */
  readonly data: D;

  /** Event source - where the event originated */
  readonly source: S;

  /** Event category - fine-grained classification */
  readonly category: C;

  /** Event intent - what the event represents */
  readonly intent: I;

  /** Event context - scope information (optional) */
  readonly context?: EventContext;

  /** Whether to broadcast to external clients (default: true) */
  readonly broadcastable?: boolean;
}
```

### Event Sources

```typescript
type EventSource =
  | "environment" // External world (Claude API, Network)
  | "agent" // Agent internal
  | "session" // Session operations
  | "container" // Container operations
  | "sandbox" // Sandbox resources (Workspace, MCP)
  | "command"; // Command request/response (API operations)
```

### Event Intents

```typescript
type EventIntent =
  | "request" // Request to perform action
  | "result" // Result of completed action
  | "notification"; // State change notification (no action needed)
```

### Event Context

```typescript
interface EventContext {
  /** Container ID (isolation boundary) */
  containerId?: string;

  /** Image ID (persistent conversation identity) */
  imageId?: string;

  /** Agent ID (if event is agent-scoped) */
  agentId?: string;

  /** Session ID (if event is session-scoped) */
  sessionId?: string;

  /** Turn ID (for correlating events within a single turn) */
  turnId?: string;

  /** Correlation ID (for request-response tracking) */
  correlationId?: string;
}
```

---

## Layer 1: Stream Events

Real-time streaming events from LLM. Used for typewriter effects, progress indicators, and live updates.

- **source**: `"agent"`
- **category**: `"stream"`
- **intent**: `"notification"`

### MessageStartEvent

Emitted when LLM streaming response begins.

```typescript
interface AgentMessageStartEvent {
  type: "message_start";
  timestamp: number;
  data: {
    /** Unique message identifier */
    messageId: string;
    /** Model used for this response */
    model: string;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### TextDeltaEvent

Emitted for each incremental text chunk during streaming.

```typescript
interface AgentTextDeltaEvent {
  type: "text_delta";
  timestamp: number;
  data: {
    /** Incremental text content */
    text: string;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### MessageDeltaEvent

Emitted for message-level updates during streaming.

```typescript
interface AgentMessageDeltaEvent {
  type: "message_delta";
  timestamp: number;
  data: {
    /** Token usage information */
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### MessageStopEvent

Emitted when LLM streaming response completes.

```typescript
interface AgentMessageStopEvent {
  type: "message_stop";
  timestamp: number;
  data: {
    /** Reason the message stopped */
    stopReason?: StopReason;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}

type StopReason = "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
```

### ToolUseStartEvent

Emitted when tool use block begins.

```typescript
interface AgentToolUseStartEvent {
  type: "tool_use_start";
  timestamp: number;
  data: {
    /** Unique identifier for this tool call */
    toolCallId: string;
    /** Name of the tool being called */
    toolName: string;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### InputJsonDeltaEvent

Emitted for incremental tool input JSON during streaming.

```typescript
interface AgentInputJsonDeltaEvent {
  type: "input_json_delta";
  timestamp: number;
  data: {
    /** Partial JSON string to concatenate */
    partialJson: string;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### ToolUseStopEvent

Emitted when tool use block completes with full parameters.

```typescript
interface AgentToolUseStopEvent {
  type: "tool_use_stop";
  timestamp: number;
  data: {
    /** Tool call identifier */
    toolCallId: string;
    /** Tool name */
    toolName: string;
    /** Complete tool input parameters */
    input: Record<string, unknown>;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### ToolResultEvent

Emitted after tool execution completes.

```typescript
interface AgentToolResultEvent {
  type: "tool_result";
  timestamp: number;
  data: {
    /** Tool call identifier */
    toolCallId: string;
    /** Tool execution result */
    result: unknown;
    /** Whether the result is an error */
    isError?: boolean;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### ErrorReceivedEvent

Emitted when an error is received from the environment.

```typescript
interface AgentErrorReceivedEvent {
  type: "error_received";
  timestamp: number;
  data: {
    /** Error message (human-readable) */
    message: string;
    /** Error code (e.g., "rate_limit_error", "api_error") */
    errorCode?: string;
  };
  source: "agent";
  category: "stream";
  intent: "notification";
}
```

### Stream Events Union

```typescript
type AgentStreamEvent =
  | AgentMessageStartEvent
  | AgentMessageDeltaEvent
  | AgentMessageStopEvent
  | AgentTextDeltaEvent
  | AgentToolUseStartEvent
  | AgentInputJsonDeltaEvent
  | AgentToolUseStopEvent
  | AgentToolResultEvent
  | AgentErrorReceivedEvent;
```

---

## Layer 2: State Events

Events that track agent state transitions and lifecycle. Used for loading indicators and UI state management.

- **source**: `"agent"`
- **category**: `"state"`
- **intent**: `"notification"`

### ConversationQueuedEvent

Emitted when a message is queued for processing.

```typescript
interface ConversationQueuedEvent {
  type: "conversation_queued";
  timestamp: number;
  data: {
    /** ID of the queued message */
    messageId: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ConversationStartEvent

Emitted when conversation processing begins.

```typescript
interface ConversationStartEvent {
  type: "conversation_start";
  timestamp: number;
  data: {
    /** ID of the message being processed */
    messageId: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ConversationThinkingEvent

Emitted when agent enters thinking state.

```typescript
interface ConversationThinkingEvent {
  type: "conversation_thinking";
  timestamp: number;
  data: Record<string, never>; // Empty object
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ConversationRespondingEvent

Emitted when agent begins generating response.

```typescript
interface ConversationRespondingEvent {
  type: "conversation_responding";
  timestamp: number;
  data: Record<string, never>; // Empty object
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ConversationEndEvent

Emitted when conversation processing completes.

```typescript
interface ConversationEndEvent {
  type: "conversation_end";
  timestamp: number;
  data: {
    /** Reason the conversation ended */
    reason: "completed" | "interrupted" | "error";
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ConversationInterruptedEvent

Emitted when conversation is interrupted by user.

```typescript
interface ConversationInterruptedEvent {
  type: "conversation_interrupted";
  timestamp: number;
  data: {
    /** Reason for interruption */
    reason: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ToolPlannedEvent

Emitted when a tool call is planned.

```typescript
interface ToolPlannedEvent {
  type: "tool_planned";
  timestamp: number;
  data: {
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ToolExecutingEvent

Emitted when tool execution begins.

```typescript
interface ToolExecutingEvent {
  type: "tool_executing";
  timestamp: number;
  data: {
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** Tool input parameters */
    input: Record<string, unknown>;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ToolCompletedEvent

Emitted when tool execution completes successfully.

```typescript
interface ToolCompletedEvent {
  type: "tool_completed";
  timestamp: number;
  data: {
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** Tool execution result */
    result: unknown;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ToolFailedEvent

Emitted when tool execution fails.

```typescript
interface ToolFailedEvent {
  type: "tool_failed";
  timestamp: number;
  data: {
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** Error message */
    error: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### ErrorOccurredEvent

Emitted when an error occurs during processing.

```typescript
interface ErrorOccurredEvent {
  type: "error_occurred";
  timestamp: number;
  data: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Error category */
    category?: string;
  };
  source: "agent";
  category: "state";
  intent: "notification";
}
```

### State Events Union

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

---

## Layer 3: Message Events

Complete, structured conversation records. Used for chat history, persistence, and logging.

- **source**: `"agent"`
- **category**: `"message"`
- **intent**: `"notification"`

### UserMessageEvent

Emitted when a user sends a message.

```typescript
interface UserMessageEvent {
  type: "user_message";
  timestamp: number;
  data: UserMessage;
  source: "agent";
  category: "message";
  intent: "notification";
}

interface UserMessage {
  /** Unique identifier */
  id: string;
  /** Message role */
  role: "user";
  /** Message subtype for serialization */
  subtype: "user";
  /** Message content - string or array of parts */
  content: string | UserContentPart[];
  /** When this message was created (Unix timestamp ms) */
  timestamp: number;
  /** Parent message ID for threading */
  parentId?: string;
}

type UserContentPart = TextPart | ImagePart | FilePart;
```

### AssistantMessageEvent

Emitted when assistant completes a response.

```typescript
interface AssistantMessageEvent {
  type: "assistant_message";
  timestamp: number;
  data: AssistantMessage;
  source: "agent";
  category: "message";
  intent: "notification";
}

interface AssistantMessage {
  /** Unique identifier */
  id: string;
  /** Message role */
  role: "assistant";
  /** Message subtype for serialization */
  subtype: "assistant";
  /** Message content - string or array of parts */
  content: string | Array<TextPart | ThinkingPart | FilePart>;
  /** When this message was created (Unix timestamp ms) */
  timestamp: number;
  /** Parent message ID for threading */
  parentId?: string;
  /** Token usage for this AI response */
  usage?: TokenUsage;
}
```

### ToolCallMessageEvent

Emitted when assistant requests a tool invocation.

```typescript
interface ToolCallMessageEvent {
  type: "tool_call_message";
  timestamp: number;
  data: ToolCallMessage;
  source: "agent";
  category: "message";
  intent: "notification";
}

interface ToolCallMessage {
  /** Unique message identifier */
  id: string;
  /** Message role - assistant initiates tool calls */
  role: "assistant";
  /** Message subtype for serialization */
  subtype: "tool-call";
  /** Tool call details */
  toolCall: ToolCallPart;
  /** When this message was created (Unix timestamp ms) */
  timestamp: number;
  /** Parent message ID */
  parentId?: string;
}

interface ToolCallPart {
  /** Content type discriminator */
  type: "tool-call";
  /** Unique identifier for this tool call */
  id: string;
  /** Tool name */
  name: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
}
```

### ToolResultMessageEvent

Emitted when tool execution completes.

```typescript
interface ToolResultMessageEvent {
  type: "tool_result_message";
  timestamp: number;
  data: ToolResultMessage;
  source: "agent";
  category: "message";
  intent: "notification";
}

interface ToolResultMessage {
  /** Unique message identifier */
  id: string;
  /** Message role - tool returns results */
  role: "tool";
  /** Message subtype for serialization */
  subtype: "tool-result";
  /** Tool result details */
  toolResult: ToolResultPart;
  /** ID of the corresponding tool call */
  toolCallId: string;
  /** When this message was created (Unix timestamp ms) */
  timestamp: number;
}

interface ToolResultPart {
  /** Content type discriminator */
  type: "tool-result";
  /** Tool call ID this result corresponds to */
  id: string;
  /** Tool name */
  name: string;
  /** Tool execution output */
  output: ToolResultOutput;
}

type ToolResultOutput =
  | { type: "text"; value: string }
  | { type: "json"; value: unknown }
  | { type: "error-text"; value: string }
  | { type: "error-json"; value: unknown }
  | { type: "execution-denied"; reason?: string }
  | { type: "content"; value: Array<TextPart | ImagePart | FilePart> };
```

### ErrorMessageEvent

Emitted when an error occurs and should be displayed in chat.

```typescript
interface ErrorMessageEvent {
  type: "error_message";
  timestamp: number;
  data: ErrorMessage;
  source: "agent";
  category: "message";
  intent: "notification";
}

interface ErrorMessage {
  /** Unique identifier */
  id: string;
  /** Message role */
  role: "error";
  /** Message subtype for serialization */
  subtype: "error";
  /** Error message content (human-readable) */
  content: string;
  /** Error code (e.g., "rate_limit_error") */
  errorCode?: string;
  /** When this error occurred (Unix timestamp ms) */
  timestamp: number;
  /** Parent message ID for threading */
  parentId?: string;
}
```

### Message Events Union

```typescript
type AgentMessageEvent =
  | UserMessageEvent
  | AssistantMessageEvent
  | ToolCallMessageEvent
  | ToolResultMessageEvent
  | ErrorMessageEvent;
```

---

## Layer 4: Turn Events

Turn-level events for analytics, metrics, and billing. A turn represents one user message plus the assistant's complete response cycle.

- **source**: `"agent"`
- **category**: `"turn"`
- **intent**: `"notification"`

### TurnRequestEvent

Emitted when a turn begins (user message received).

```typescript
interface TurnRequestEvent {
  type: "turn_request";
  timestamp: number;
  data: {
    /** Unique turn identifier */
    turnId: string;
    /** Message identifier */
    messageId: string;
    /** User message content */
    content: string;
    /** Turn start timestamp (Unix ms) */
    timestamp: number;
  };
  source: "agent";
  category: "turn";
  intent: "notification";
}
```

### TurnResponseEvent

Emitted when a turn completes (assistant response finished).

```typescript
interface TurnResponseEvent {
  type: "turn_response";
  timestamp: number;
  data: {
    /** Unique turn identifier */
    turnId: string;
    /** Message identifier */
    messageId: string;
    /** Turn duration in milliseconds */
    duration: number;
    /** Token usage information */
    usage?: TokenUsage;
    /** Model used for this turn */
    model?: string;
    /** Why the response stopped */
    stopReason?: string;
    /** Turn completion timestamp (Unix ms) */
    timestamp: number;
  };
  source: "agent";
  category: "turn";
  intent: "notification";
}

interface TokenUsage {
  /** Number of input tokens */
  inputTokens: number;
  /** Number of output tokens */
  outputTokens: number;
  /** Total tokens (optional, can be computed) */
  totalTokens?: number;
}
```

### Turn Events Union

```typescript
type AgentTurnEvent = TurnRequestEvent | TurnResponseEvent;
```

---

## Content Part Types

Content parts are building blocks for rich, multi-modal messages.

### TextPart

Plain text content.

```typescript
interface TextPart {
  /** Content type discriminator */
  type: "text";
  /** The text content (supports Markdown) */
  text: string;
}
```

### ThinkingPart

AI's reasoning/thinking process (extended thinking).

```typescript
interface ThinkingPart {
  /** Content type discriminator */
  type: "thinking";
  /** The reasoning text */
  reasoning: string;
  /** Tokens used for thinking */
  tokenCount?: number;
}
```

### ImagePart

Image content.

```typescript
interface ImagePart {
  /** Content type discriminator */
  type: "image";
  /** Image data (base64-encoded string or URL) */
  data: string;
  /** Image MIME type */
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  /** Optional image name/filename */
  name?: string;
}
```

### FilePart

File attachment.

```typescript
interface FilePart {
  /** Content type discriminator */
  type: "file";
  /** File data (base64-encoded string or URL) */
  data: string;
  /** File MIME type (IANA media type) */
  mediaType: string;
  /** Optional filename */
  filename?: string;
}
```

---

## Command Events

Request/response events for runtime operations. These enable unified operation API for both local and remote modes.

- **source**: `"command"`
- **category**: `"request"` | `"response"`
- **intent**: `"request"` | `"result"`

### Container Commands

#### ContainerCreateRequest / ContainerCreateResponse

```typescript
interface ContainerCreateRequest {
  type: "container_create_request";
  data: {
    requestId: string;
    containerId: string;
  };
  source: "command";
  category: "request";
  intent: "request";
}

interface ContainerCreateResponse {
  type: "container_create_response";
  data: {
    requestId: string;
    containerId: string;
    error?: { code: string; message: string };
  };
  source: "command";
  category: "response";
  intent: "result";
}
```

#### ContainerGetRequest / ContainerGetResponse

```typescript
interface ContainerGetRequest {
  type: "container_get_request";
  data: {
    requestId: string;
    containerId: string;
  };
}

interface ContainerGetResponse {
  type: "container_get_response";
  data: {
    requestId: string;
    containerId?: string;
    exists: boolean;
    error?: { code: string; message: string };
  };
}
```

#### ContainerListRequest / ContainerListResponse

```typescript
interface ContainerListRequest {
  type: "container_list_request";
  data: {
    requestId: string;
  };
}

interface ContainerListResponse {
  type: "container_list_response";
  data: {
    requestId: string;
    containerIds: string[];
    error?: { code: string; message: string };
  };
}
```

### Agent Commands

#### AgentGetRequest / AgentGetResponse

```typescript
interface AgentGetRequest {
  type: "agent_get_request";
  data: {
    requestId: string;
    agentId: string;
  };
}

interface AgentGetResponse {
  type: "agent_get_response";
  data: {
    requestId: string;
    agentId?: string;
    containerId?: string;
    exists: boolean;
    error?: { code: string; message: string };
  };
}
```

#### AgentListRequest / AgentListResponse

```typescript
interface AgentListRequest {
  type: "agent_list_request";
  data: {
    requestId: string;
    containerId: string;
  };
}

interface AgentListResponse {
  type: "agent_list_response";
  data: {
    requestId: string;
    agents: Array<{
      agentId: string;
      containerId: string;
      imageId: string;
    }>;
    error?: { code: string; message: string };
  };
}
```

#### AgentDestroyRequest / AgentDestroyResponse

```typescript
interface AgentDestroyRequest {
  type: "agent_destroy_request";
  data: {
    requestId: string;
    agentId: string;
  };
}

interface AgentDestroyResponse {
  type: "agent_destroy_response";
  data: {
    requestId: string;
    agentId: string;
    success: boolean;
    error?: { code: string; message: string };
  };
}
```

#### MessageSendRequest / MessageSendResponse

```typescript
interface MessageSendRequest {
  type: "message_send_request";
  data: {
    requestId: string;
    /** Image ID (preferred) - will auto-activate if offline */
    imageId?: string;
    /** Agent ID (legacy) - must be already running */
    agentId?: string;
    /** Message content (text-only or multimodal) */
    content: string | UserContentPart[];
  };
}

interface MessageSendResponse {
  type: "message_send_response";
  data: {
    requestId: string;
    imageId?: string;
    agentId: string;
    error?: { code: string; message: string };
  };
}
```

#### AgentInterruptRequest / AgentInterruptResponse

```typescript
interface AgentInterruptRequest {
  type: "agent_interrupt_request";
  data: {
    requestId: string;
    imageId?: string;
    agentId?: string;
  };
}

interface AgentInterruptResponse {
  type: "agent_interrupt_response";
  data: {
    requestId: string;
    imageId?: string;
    agentId?: string;
    error?: { code: string; message: string };
  };
}
```

### Image Commands

#### ImageCreateRequest / ImageCreateResponse

```typescript
interface ImageCreateRequest {
  type: "image_create_request";
  data: {
    requestId: string;
    containerId: string;
    config: {
      name?: string;
      description?: string;
      systemPrompt?: string;
    };
  };
}

interface ImageCreateResponse {
  type: "image_create_response";
  data: {
    requestId: string;
    record?: ImageRecord;
    error?: { code: string; message: string };
  };
}
```

#### ImageRunRequest / ImageRunResponse

```typescript
interface ImageRunRequest {
  type: "image_run_request";
  data: {
    requestId: string;
    imageId: string;
  };
}

interface ImageRunResponse {
  type: "image_run_response";
  data: {
    requestId: string;
    imageId: string;
    agentId: string;
    /** true if reusing existing agent */
    reused: boolean;
    error?: { code: string; message: string };
  };
}
```

#### ImageStopRequest / ImageStopResponse

```typescript
interface ImageStopRequest {
  type: "image_stop_request";
  data: {
    requestId: string;
    imageId: string;
  };
}

interface ImageStopResponse {
  type: "image_stop_response";
  data: {
    requestId: string;
    imageId: string;
    error?: { code: string; message: string };
  };
}
```

#### ImageListRequest / ImageListResponse

```typescript
interface ImageListRequest {
  type: "image_list_request";
  data: {
    requestId: string;
    containerId?: string;
  };
}

interface ImageListResponse {
  type: "image_list_response";
  data: {
    requestId: string;
    records: ImageListItem[];
    error?: { code: string; message: string };
  };
}

interface ImageListItem extends ImageRecord {
  /** Whether an agent is currently running */
  online: boolean;
  /** Current agent ID if online */
  agentId?: string;
}
```

#### ImageGetRequest / ImageGetResponse

```typescript
interface ImageGetRequest {
  type: "image_get_request";
  data: {
    requestId: string;
    imageId: string;
  };
}

interface ImageGetResponse {
  type: "image_get_response";
  data: {
    requestId: string;
    record?: ImageListItem | null;
    error?: { code: string; message: string };
  };
}
```

#### ImageDeleteRequest / ImageDeleteResponse

```typescript
interface ImageDeleteRequest {
  type: "image_delete_request";
  data: {
    requestId: string;
    imageId: string;
  };
}

interface ImageDeleteResponse {
  type: "image_delete_response";
  data: {
    requestId: string;
    imageId: string;
    error?: { code: string; message: string };
  };
}
```

#### ImageMessagesRequest / ImageMessagesResponse

```typescript
interface ImageMessagesRequest {
  type: "image_messages_request";
  data: {
    requestId: string;
    imageId: string;
  };
}

interface ImageMessagesResponse {
  type: "image_messages_response";
  data: {
    requestId: string;
    imageId: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "tool_call" | "tool_result";
      content: unknown;
      timestamp: number;
    }>;
    error?: { code: string; message: string };
  };
}
```

### Command Events Union

```typescript
type CommandRequest =
  | ContainerCreateRequest
  | ContainerGetRequest
  | ContainerListRequest
  | AgentGetRequest
  | AgentListRequest
  | AgentDestroyRequest
  | AgentDestroyAllRequest
  | MessageSendRequest
  | AgentInterruptRequest
  | ImageCreateRequest
  | ImageRunRequest
  | ImageStopRequest
  | ImageUpdateRequest
  | ImageListRequest
  | ImageGetRequest
  | ImageDeleteRequest
  | ImageMessagesRequest;

type CommandResponse =
  | ContainerCreateResponse
  | ContainerGetResponse
  | ContainerListResponse
  | AgentGetResponse
  | AgentListResponse
  | AgentDestroyResponse
  | AgentDestroyAllResponse
  | MessageSendResponse
  | AgentInterruptResponse
  | ImageCreateResponse
  | ImageRunResponse
  | ImageStopResponse
  | ImageUpdateResponse
  | ImageListResponse
  | ImageGetResponse
  | ImageDeleteResponse
  | ImageMessagesResponse;

type CommandEvent = CommandRequest | CommandResponse;
```

---

## Type Guards

Utility functions for type checking events.

```typescript
// Stream events
function isAgentStreamEvent(event: { source?: string; category?: string }): boolean {
  return event.source === "agent" && event.category === "stream";
}

// State events
function isStateEvent(event: EngineEvent): event is AgentStateEvent {
  const stateTypes = [
    "conversation_queued",
    "conversation_start",
    "conversation_thinking",
    "conversation_responding",
    "conversation_end",
    "conversation_interrupted",
    "tool_planned",
    "tool_executing",
    "tool_completed",
    "tool_failed",
    "error_occurred",
  ];
  return stateTypes.includes(event.type);
}

// Message events
function isMessageEvent(event: EngineEvent): event is AgentMessageEvent {
  const messageTypes = [
    "user_message",
    "assistant_message",
    "tool_call_message",
    "tool_result_message",
    "error_message",
  ];
  return messageTypes.includes(event.type);
}

// Turn events
function isTurnEvent(event: EngineEvent): event is AgentTurnEvent {
  return event.type === "turn_request" || event.type === "turn_response";
}

// Command events
function isCommandEvent(event: { source?: string }): event is CommandEvent {
  return event.source === "command";
}

function isCommandRequest(event: { source?: string; category?: string }): boolean {
  return event.source === "command" && event.category === "request";
}

function isCommandResponse(event: { source?: string; category?: string }): boolean {
  return event.source === "command" && event.category === "response";
}
```

---

## Lightweight Engine Events

For internal use within `AgentEngine`, lightweight event types strip metadata fields:

```typescript
interface EngineEvent<T extends string = string, D = unknown> {
  readonly type: T;
  readonly timestamp: number;
  readonly data: D;
}

// Convert full event to lightweight
type ToEngineEvent<E> = E extends {
  type: infer T;
  timestamp: number;
  data: infer D;
}
  ? EngineEvent<T extends string ? T : string, D>
  : never;
```

---

## See Also

- [Event System Concepts](../concepts/event-system.md) - Conceptual overview and usage patterns
- [Lifecycle Management](../concepts/lifecycle.md) - Agent lifecycle (run, stop, resume)
- [Mealy Machine](../concepts/mealy-machine.md) - Event processing internals
