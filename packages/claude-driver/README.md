# @agentxjs/claude-driver

Claude Code SDK-based driver for AgentX. This package provides a `Driver` implementation that connects AgentX to Claude via the `@anthropic-ai/claude-code` SDK, enabling agentic conversations with tool use through a subprocess-based architecture.

> **Note:** MonoDriver (`@agentxjs/mono-driver`) is now the recommended default driver for most use cases. ClaudeDriver is intended for advanced scenarios that specifically require Claude Code SDK features, such as subprocess-based execution, built-in permission management, or Claude Code CLI integration.

## Installation

```bash
bun add @agentxjs/claude-driver
```

### Peer Dependencies

This package depends on `@agentxjs/core` and the Claude Code SDK:

- `@agentxjs/core` (workspace dependency)
- `@anthropic-ai/claude-code`
- `@anthropic-ai/claude-agent-sdk`

## Overview

ClaudeDriver wraps the `@anthropic-ai/claude-code` SDK to provide:

- **Subprocess-based execution** -- Claude Code runs as a separate process managed by the SDK
- **Streaming via AsyncIterable** -- `receive()` returns `AsyncIterable<DriverStreamEvent>` for real-time text deltas, tool calls, and results
- **Session continuity** -- Resume previous conversations via `resumeSessionId`
- **MCP server support** -- Configure MCP tool servers that Claude can invoke during conversations
- **Interrupt support** -- Gracefully stop an active conversation mid-stream
- **Zero-config CLI path resolution** -- Automatically resolves the Claude Code executable from the installed `@anthropic-ai/claude-code` package

### Architecture

```
      UserMessage
           |
           v
  +------------------+
  |   ClaudeDriver   |
  |                  |
  |   receive()      |---> AsyncIterable<DriverStreamEvent>
  |       |          |
  |       v          |
  |   SDK Query      |
  +------------------+
           |
           v
     Claude Code SDK
      (subprocess)
```

ClaudeDriver implements the `Driver` interface from `@agentxjs/core/driver`. It manages a single session and translates Claude SDK messages into the standard `DriverStreamEvent` types used throughout AgentX.

## Configuration

ClaudeDriver accepts a `DriverConfig<ClaudeDriverOptions>` object. The base `DriverConfig` fields are defined in `@agentxjs/core/driver`.

### Base Configuration (DriverConfig)

| Field | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | Yes | Anthropic API key |
| `agentId` | `string` | Yes | Agent identifier for logging |
| `model` | `string` | No | Model to use (e.g., `"claude-sonnet-4-20250514"`) |
| `systemPrompt` | `string` | No | System prompt for the agent |
| `baseUrl` | `string` | No | Custom API endpoint URL |
| `cwd` | `string` | No | Working directory for tool execution |
| `timeout` | `number` | No | Request timeout in milliseconds (default: 600000) |
| `mcpServers` | `Record<string, McpServerConfig>` | No | MCP server configurations |
| `resumeSessionId` | `string` | No | Session ID to resume a prior conversation |
| `onSessionIdCaptured` | `(sessionId: string) => void` | No | Callback invoked when the SDK session ID is captured |

### ClaudeDriver-Specific Options

These are passed via the `options` field of `DriverConfig`:

| Field | Type | Default | Description |
|---|---|---|---|
| `claudeCodePath` | `string` | Auto-resolved | Path to Claude Code executable. If omitted, resolved from the installed `@anthropic-ai/claude-code` package. |
| `maxTurns` | `number` | SDK default | Maximum number of agentic loop turns before stopping |

## Usage

### Basic Usage

```typescript
import { createClaudeDriver } from "@agentxjs/claude-driver";

const driver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
  systemPrompt: "You are a helpful assistant.",
});

await driver.initialize();

for await (const event of driver.receive({ content: "Hello!" })) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
}

await driver.dispose();
```

### Handling Stream Events

The driver emits a variety of `DriverStreamEvent` types:

```typescript
for await (const event of driver.receive({ content: "Summarize this file." })) {
  switch (event.type) {
    case "message_start":
      // Conversation turn started: event.data.messageId, event.data.model
      break;
    case "text_delta":
      // Incremental text: event.data.text
      process.stdout.write(event.data.text);
      break;
    case "tool_use_start":
      // Tool invocation started: event.data.toolName, event.data.toolCallId
      break;
    case "input_json_delta":
      // Partial tool input JSON: event.data.partialJson
      break;
    case "tool_use_stop":
      // Tool invocation complete: event.data.toolName, event.data.input
      break;
    case "tool_result":
      // Tool execution result: event.data.result, event.data.isError
      break;
    case "message_stop":
      // Conversation turn ended: event.data.stopReason
      break;
    case "error":
      // Error occurred: event.data.message, event.data.errorCode
      break;
    case "interrupted":
      // Operation was interrupted: event.data.reason
      break;
  }
}
```

### Session Resumption

```typescript
let savedSessionId: string | undefined;

const driver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
  onSessionIdCaptured: (sessionId) => {
    savedSessionId = sessionId;
  },
});

await driver.initialize();

// First conversation
for await (const event of driver.receive({ content: "Remember my name is Alice." })) {
  // process events...
}

await driver.dispose();

// Later: resume the session
const resumedDriver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
  resumeSessionId: savedSessionId,
});

await resumedDriver.initialize();

for await (const event of resumedDriver.receive({ content: "What is my name?" })) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
}

await resumedDriver.dispose();
```

### Configuring MCP Servers

```typescript
const driver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "tool-agent",
  systemPrompt: "You can use tools to help the user.",
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    },
  },
});
```

### Interrupting a Conversation

```typescript
const driver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
});

await driver.initialize();

// Start receiving in background
const iter = driver.receive({ content: "Write a long essay." });

// Interrupt after 3 seconds
setTimeout(() => driver.interrupt(), 3000);

for await (const event of iter) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
  if (event.type === "interrupted") {
    console.log("\nInterrupted:", event.data.reason);
  }
}

await driver.dispose();
```

### Custom Claude Code Path

```typescript
const driver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
  options: {
    claudeCodePath: "/usr/local/bin/claude",
    maxTurns: 10,
  },
});
```

## Driver Lifecycle

1. **Create** -- `createClaudeDriver(config)` returns a `Driver` instance
2. **Initialize** -- `driver.initialize()` validates configuration (SDK subprocess is lazily started on first `receive()`)
3. **Receive** -- `driver.receive(message)` sends a user message and yields stream events
4. **Interrupt** (optional) -- `driver.interrupt()` gracefully stops an active operation
5. **Dispose** -- `driver.dispose()` terminates the subprocess and releases all resources

## Exports

### Main

| Export | Description |
|---|---|
| `ClaudeDriver` | Driver class implementation |
| `createClaudeDriver` | Factory function (conforms to `CreateDriver` type) |
| `ClaudeDriverOptions` | Type for driver-specific options |
| `ClaudeDriverConfig` | Type alias for `DriverConfig<ClaudeDriverOptions>` |

### Re-exported from @agentxjs/core

| Export | Description |
|---|---|
| `Driver` | Driver interface |
| `DriverConfig` | Configuration interface |
| `DriverState` | State type (`"idle"` / `"active"` / `"disposed"`) |
| `CreateDriver` | Factory function type |
| `DriverStreamEvent` | Union of all stream event types |
| `StopReason` | Why the LLM stopped generating |

### Internal Utilities

| Export | Description |
|---|---|
| `SDKQueryLifecycle` | Low-level SDK query lifecycle manager |
| `buildSDKContent` | Converts AgentX messages to Claude API format |
| `buildSDKUserMessage` | Builds SDK-compatible user messages |

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (can also be passed via `apiKey` config) |
| `ANTHROPIC_BASE_URL` | Custom API endpoint (can also be passed via `baseUrl` config) |

## License

See the root repository for license information.
