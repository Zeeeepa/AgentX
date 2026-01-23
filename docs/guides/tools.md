# MCP Tool Integration Guide

This guide covers how to integrate tools into your AgentX agents using the Model Context Protocol (MCP).

## What are Tools?

Tools are functions that AI agents can invoke to perform actions beyond text generation. In AgentX, tools are integrated via **MCP (Model Context Protocol)**, a standardized protocol that connects AI applications with external capabilities.

Common tool use cases:

- **File system access** - Read, write, and manage files
- **Web browsing** - Fetch and process web content
- **Database queries** - Execute SQL or NoSQL operations
- **API integrations** - Call external services
- **Code execution** - Run code in sandboxed environments
- **System commands** - Execute shell commands

## Quick Start

Add tools to an agent using `mcpServers` configuration:

```typescript
import { createAgentX, defineAgent } from "agentxjs";

// Define agent with tools
const MyAgent = defineAgent({
  name: "FileAssistant",
  systemPrompt: "You are a helpful assistant that can read and write files.",
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/docs"],
    },
  },
});

// Create AgentX
const agentx = await createAgentX({
  llm: { apiKey: "sk-ant-xxxxx" },
  defaultAgent: MyAgent,
});

// Listen for tool events
agentx.on("tool_planned", (e) => {
  console.log(`Tool requested: ${e.data.toolName}`);
});

agentx.on("tool_completed", (e) => {
  console.log(`Tool completed: ${e.data.toolName}`);
});

// Create container and run agent
await agentx.request("container_create_request", { containerId: "main" });

const agentRes = await agentx.request("agent_run_request", {
  containerId: "main",
  config: MyAgent,
});

// Send message - agent can now use filesystem tools
await agentx.request("agent_receive_request", {
  agentId: agentRes.data.agentId,
  content: "List all markdown files in the docs directory",
});
```

## MCP Server Configuration

AgentX supports four transport types for connecting to MCP servers.

### Stdio Transport (Local Servers)

The most common transport for local MCP servers. Spawns a process and communicates via stdin/stdout.

```typescript
const agent = defineAgent({
  name: "LocalToolAgent",
  mcpServers: {
    // Filesystem server
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"],
    },

    // GitHub server
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
      },
    },

    // Custom Python server
    custom: {
      command: "python",
      args: ["-m", "my_mcp_server"],
      cwd: "/path/to/server",
      env: {
        DEBUG: "true",
      },
    },
  },
});
```

**Stdio configuration options:**

| Option    | Type                     | Description                 |
| --------- | ------------------------ | --------------------------- |
| `command` | `string`                 | Command to execute          |
| `args`    | `string[]`               | Command arguments           |
| `env`     | `Record<string, string>` | Environment variables       |
| `cwd`     | `string`                 | Working directory (runtime) |

### SSE Transport (Remote Streaming)

For remote MCP servers with real-time streaming support:

```typescript
const agent = defineAgent({
  name: "RemoteToolAgent",
  mcpServers: {
    api: {
      type: "sse",
      url: "https://api.example.com/mcp/sse",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    },
  },
});
```

### HTTP Transport (Stateless)

For serverless or stateless MCP servers:

```typescript
const agent = defineAgent({
  name: "StatelessAgent",
  mcpServers: {
    lambda: {
      type: "http",
      url: "https://api.example.com/mcp",
      headers: {
        "X-API-Key": process.env.API_KEY,
      },
      timeout: 30000, // 30 seconds
    },
  },
});
```

### SDK Transport (In-Process)

For embedded MCP servers running in the same process:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk";

// Create in-process server
const server = new McpServer({ name: "embedded", version: "1.0.0" });

// Register tools
server.addTool({
  name: "calculate",
  description: "Perform calculations",
  inputSchema: { type: "object", properties: { expression: { type: "string" } } },
  handler: async ({ expression }) => ({ result: eval(expression) }),
});

const agent = defineAgent({
  name: "EmbeddedAgent",
  mcpServers: {
    embedded: {
      type: "sdk",
      name: "embedded-calculator",
      instance: server,
    },
  },
});
```

## Tool Execution Lifecycle

When an agent decides to use a tool, the following event sequence occurs:

```
User Message
     │
     ▼
conversation_start ─────────────────────────────────┐
     │                                               │
     ▼                                               │
conversation_thinking                                │
     │                                               │
     ▼                                               │
tool_use_start ──── Stream: Tool request begins     │
     │                                               │
     ▼                                               │
input_json_delta ── Stream: Tool input streaming    │
     │                                               │
     ▼                                               │
tool_use_stop ───── Stream: Tool input complete     │
     │                                               │
     ▼                                               │
tool_planned ────── State: Tool ready to execute    │
     │                                               │
     ▼                                               │
tool_executing ──── State: Tool running             │
     │                                               │
     ▼                                               │
tool_result ─────── Stream: Execution result        │
     │                                               │
     ▼                                               │
tool_completed ──── State: Execution finished       │
     │                                               │
     ▼                                               │
conversation_end ───────────────────────────────────┘
```

## Handling Tool Events

### Stream Events

Stream events provide real-time visibility into tool calls:

```typescript
// Tool call begins
agentx.on("tool_use_start", (e) => {
  console.log(`Tool requested: ${e.data.name}`);
  console.log(`Tool ID: ${e.data.id}`);
});

// Tool input streaming
let inputJson = "";
agentx.on("input_json_delta", (e) => {
  inputJson += e.data.delta;
});

// Tool input complete
agentx.on("tool_use_stop", (e) => {
  console.log(`Tool input ready: ${inputJson}`);
  inputJson = ""; // Reset for next tool
});

// Tool execution result
agentx.on("tool_result", (e) => {
  console.log(`Result from ${e.data.name}:`, e.data.output);
});
```

### State Events

State events track tool execution lifecycle:

```typescript
// Tool planned (ready to execute)
agentx.on("tool_planned", (e) => {
  console.log(`Planning: ${e.data.toolName}`);
});

// Tool executing
agentx.on("tool_executing", (e) => {
  console.log(`Executing: ${e.data.toolName}`);
  console.log(`Input:`, e.data.input);
  showSpinner("Running tool...");
});

// Tool completed successfully
agentx.on("tool_completed", (e) => {
  console.log(`Completed: ${e.data.toolName}`);
  console.log(`Result:`, e.data.result);
  hideSpinner();
});

// Tool failed
agentx.on("tool_failed", (e) => {
  console.error(`Failed: ${e.data.toolName}`);
  console.error(`Error:`, e.data.error);
  hideSpinner();
  showError(e.data.error);
});
```

### Message Events

Message events provide complete tool call/result records:

```typescript
// Complete tool call (for history)
agentx.on("tool_call_message", (e) => {
  const msg = e.data;
  saveToHistory({
    type: "tool_call",
    id: msg.toolCall.id,
    name: msg.toolCall.name,
    input: msg.toolCall.input,
    timestamp: msg.timestamp,
  });
});

// Complete tool result (for history)
agentx.on("tool_result_message", (e) => {
  const msg = e.data;
  saveToHistory({
    type: "tool_result",
    toolCallId: msg.toolCallId,
    name: msg.toolResult.name,
    output: msg.toolResult.output,
    timestamp: msg.timestamp,
  });
});
```

## Building Custom Tools

### Defining Tool Schema

Tools use JSON Schema for input validation:

```typescript
import type { McpTool, JsonSchema } from "agentxjs";

const calculateTool: McpTool = {
  name: "calculate",
  description: "Perform mathematical calculations",
  inputSchema: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Mathematical expression to evaluate (e.g., '2 + 2')",
      },
      precision: {
        type: "number",
        description: "Decimal precision for the result",
        default: 2,
      },
    },
    required: ["expression"],
  },
  annotations: {
    title: "Calculator",
    category: "math",
  },
};
```

### Tool Result Types

Tools can return different result types:

```typescript
import type { McpToolResult } from "agentxjs";

// Text result
const textResult: McpToolResult = {
  content: [
    {
      type: "text",
      text: "The result is 42",
    },
  ],
  isError: false,
};

// Image result
const imageResult: McpToolResult = {
  content: [
    {
      type: "image",
      data: "base64EncodedImageData...",
      mimeType: "image/png",
    },
  ],
};

// Resource reference
const resourceResult: McpToolResult = {
  content: [
    {
      type: "resource",
      resource: {
        uri: "file:///tmp/output.json",
        name: "Output Data",
        mimeType: "application/json",
        text: '{"status": "success"}',
      },
    },
  ],
};

// Error result
const errorResult: McpToolResult = {
  content: [
    {
      type: "text",
      text: "Error: Division by zero is not allowed",
    },
  ],
  isError: true,
};
```

### Creating an MCP Server

Build a custom MCP server using the SDK:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk";

// Create server
const server = new McpServer({
  name: "my-tools",
  version: "1.0.0",
});

// Add a tool
server.addTool({
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name (e.g., 'San Francisco')",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
      },
    },
    required: ["location"],
  },
  handler: async ({ location, units = "celsius" }) => {
    // Fetch weather from API
    const weather = await fetchWeather(location, units);

    return {
      content: [
        {
          type: "text",
          text: `Weather in ${location}: ${weather.temp}${units === "celsius" ? "C" : "F"}, ${weather.condition}`,
        },
      ],
    };
  },
});

// Add another tool
server.addTool({
  name: "search_web",
  description: "Search the web for information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results", default: 5 },
    },
    required: ["query"],
  },
  handler: async ({ query, limit = 5 }) => {
    const results = await searchWeb(query, limit);

    return {
      content: results.map((r) => ({
        type: "text",
        text: `${r.title}\n${r.url}\n${r.snippet}`,
      })),
    };
  },
});

// Export for use with SDK transport
export { server };
```

## Tool Error Handling

### Handling Tool Failures

```typescript
agentx.on("tool_failed", (e) => {
  const { toolName, error } = e.data;

  // Log the error
  console.error(`Tool ${toolName} failed:`, error);

  // Show user-friendly message
  if (error.includes("permission denied")) {
    notifyUser("The agent lacks permission to perform this action.");
  } else if (error.includes("timeout")) {
    notifyUser("The tool took too long to respond. Please try again.");
  } else {
    notifyUser(`Tool error: ${error}`);
  }
});

// Also handle execution errors in sandbox events
agentx.on("tool_execution_error", (e) => {
  const { toolName, code, message } = e.data;
  logError(`[${code}] ${toolName}: ${message}`);
});
```

### Implementing Tool Retries

```typescript
import { createAgentX } from "agentxjs";

async function runWithRetry(agentx, agentId, content, maxRetries = 3) {
  let attempts = 0;
  let lastError = null;

  while (attempts < maxRetries) {
    try {
      await agentx.request("agent_receive_request", {
        agentId,
        content,
      });
      return; // Success
    } catch (error) {
      lastError = error;
      attempts++;
      console.log(`Attempt ${attempts} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * attempts)); // Exponential backoff
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`);
}
```

## Tool Execution Logging

Track tool usage for debugging and analytics:

```typescript
interface ToolLog {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  status: "pending" | "executing" | "completed" | "failed";
  startTime: number;
  duration?: number;
}

const toolLogs: Map<string, ToolLog> = new Map();

// Track tool lifecycle
agentx.on("tool_planned", (e) => {
  toolLogs.set(e.data.toolId, {
    id: e.data.toolId,
    name: e.data.toolName,
    input: {},
    status: "pending",
    startTime: Date.now(),
  });
});

agentx.on("tool_executing", (e) => {
  const log = toolLogs.get(e.data.toolId);
  if (log) {
    log.input = e.data.input;
    log.status = "executing";
  }
});

agentx.on("tool_completed", (e) => {
  const log = toolLogs.get(e.data.toolId);
  if (log) {
    log.output = e.data.result;
    log.status = "completed";
    log.duration = Date.now() - log.startTime;
  }
});

agentx.on("tool_failed", (e) => {
  const log = toolLogs.get(e.data.toolId);
  if (log) {
    log.error = e.data.error;
    log.status = "failed";
    log.duration = Date.now() - log.startTime;
  }
});

// Report on conversation end
agentx.on("conversation_end", () => {
  const logs = Array.from(toolLogs.values());
  console.log("Tool usage summary:");
  logs.forEach((log) => {
    console.log(`  ${log.name}: ${log.status} (${log.duration}ms)`);
  });
  toolLogs.clear();
});
```

## Building a Tool-Enabled Chat UI

```typescript
import { createAgentX, defineAgent } from "agentxjs";

interface ToolStatus {
  name: string;
  status: "pending" | "executing" | "completed" | "failed";
}

async function createToolEnabledChat() {
  const CodeAssistant = defineAgent({
    name: "CodeAssistant",
    systemPrompt: `You are a coding assistant with access to the filesystem.
You can read and write code files to help users with their projects.`,
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
      },
    },
  });

  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY },
    defaultAgent: CodeAssistant,
  });

  // UI state
  let currentTool: ToolStatus | null = null;

  // Stream text
  agentx.on("text_delta", (e) => {
    process.stdout.write(e.data.text);
  });

  // Tool status updates
  agentx.on("tool_planned", (e) => {
    currentTool = { name: e.data.toolName, status: "pending" };
    console.log(`\n[Tool: ${e.data.toolName}] Planning...`);
  });

  agentx.on("tool_executing", (e) => {
    if (currentTool) {
      currentTool.status = "executing";
      console.log(`[Tool: ${e.data.toolName}] Executing...`);
    }
  });

  agentx.on("tool_completed", (e) => {
    if (currentTool) {
      currentTool.status = "completed";
      console.log(`[Tool: ${e.data.toolName}] Done`);
      currentTool = null;
    }
  });

  agentx.on("tool_failed", (e) => {
    if (currentTool) {
      currentTool.status = "failed";
      console.log(`[Tool: ${e.data.toolName}] Failed: ${e.data.error}`);
      currentTool = null;
    }
  });

  agentx.on("conversation_end", () => {
    console.log("\n");
  });

  // Setup
  await agentx.request("container_create_request", { containerId: "main" });

  const agentRes = await agentx.request("agent_run_request", {
    containerId: "main",
    config: CodeAssistant,
  });

  return { agentx, agentId: agentRes.data.agentId };
}

// Usage
const { agentx, agentId } = await createToolEnabledChat();

await agentx.request("agent_receive_request", {
  agentId,
  content: "Read the package.json file and tell me what dependencies are installed",
});
```

## MCP Server Events

Monitor MCP server connection status:

```typescript
// Server connected
agentx.on("mcp_server_connected", (e) => {
  console.log(`MCP Server connected: ${e.data.serverName}`);
  console.log(`  Version: ${e.data.version}`);
  console.log(`  Tools: ${e.data.toolCount}`);
  console.log(`  Resources: ${e.data.resourceCount}`);
});

// Server disconnected
agentx.on("mcp_server_disconnected", (e) => {
  console.warn(`MCP Server disconnected: ${e.data.serverName}`);
  if (e.data.reason) {
    console.warn(`  Reason: ${e.data.reason}`);
  }
});
```

## Popular MCP Servers

Here are commonly used MCP servers:

| Server                                             | Description         | Install Command                                           |
| -------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| `@modelcontextprotocol/server-filesystem`          | File system access  | `npx -y @modelcontextprotocol/server-filesystem /path`    |
| `@modelcontextprotocol/server-github`              | GitHub integration  | `npx -y @modelcontextprotocol/server-github`              |
| `@modelcontextprotocol/server-puppeteer`           | Web browser control | `npx -y @modelcontextprotocol/server-puppeteer`           |
| `@modelcontextprotocol/server-memory`              | Key-value storage   | `npx -y @modelcontextprotocol/server-memory`              |
| `@modelcontextprotocol/server-brave-search`        | Web search          | `npx -y @modelcontextprotocol/server-brave-search`        |
| `@modelcontextprotocol/server-slack`               | Slack integration   | `npx -y @modelcontextprotocol/server-slack`               |
| `@modelcontextprotocol/server-google-maps`         | Maps and directions | `npx -y @modelcontextprotocol/server-google-maps`         |
| `@modelcontextprotocol/server-sequential-thinking` | Structured thinking | `npx -y @modelcontextprotocol/server-sequential-thinking` |

## Best Practices

### 1. Limit Tool Scope

Give agents access only to tools they need:

```typescript
// Good: Specific, limited scope
const agent = defineAgent({
  name: "DocReader",
  mcpServers: {
    docs: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/docs"],
    },
  },
});

// Avoid: Overly broad access
const riskyAgent = defineAgent({
  name: "RiskyAgent",
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/"], // Root access
    },
  },
});
```

### 2. Handle Tool Timeouts

Set appropriate timeouts for remote tools:

```typescript
const agent = defineAgent({
  name: "APIAgent",
  mcpServers: {
    api: {
      type: "http",
      url: "https://api.example.com/mcp",
      timeout: 30000, // 30 second timeout
    },
  },
});
```

### 3. Secure Credentials

Use environment variables for sensitive data:

```typescript
const agent = defineAgent({
  name: "SecureAgent",
  mcpServers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN, // From env
      },
    },
  },
});
```

### 4. Provide Clear Tool Descriptions

Help the AI understand when to use tools:

```typescript
const server = new McpServer({ name: "tools", version: "1.0.0" });

server.addTool({
  name: "search_database",
  // Clear, specific description
  description: `Search the customer database by name or email.
Use this when the user asks about customer information, order history, or account details.
Do NOT use for general web searches.`,
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Customer name or email to search for",
      },
    },
    required: ["query"],
  },
  handler: searchDatabase,
});
```

## Next Steps

- **[Event System](../concepts/event-system.md)** - Deep dive into all event types
- **[Lifecycle Management](../concepts/lifecycle.md)** - Agent lifecycle (run, stop, resume)
- **[MCP Specification](https://modelcontextprotocol.io/)** - Official MCP documentation
