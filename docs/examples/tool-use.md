# Tool Usage Examples

This guide demonstrates how to configure and use tools with AgentX agents using the Model Context Protocol (MCP).

## Overview

AgentX integrates with MCP (Model Context Protocol) to provide tool capabilities to AI agents. Tools allow agents to:

- Interact with external systems (APIs, databases, file systems)
- Perform calculations and data transformations
- Execute commands and retrieve information
- Extend agent capabilities beyond text generation

## Basic Tool Configuration

### Defining an Agent with Tools

Tools are configured using the `mcpServers` field in the agent definition:

```typescript
import { defineAgent, createAgentX } from "agentxjs";

// Define an agent with MCP tools
const ToolAgent = defineAgent({
  name: "ToolAgent",
  description: "An agent with tool capabilities",
  systemPrompt: "You are a helpful assistant with access to tools.",
  mcpServers: {
    // Configure MCP servers here
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    },
  },
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Create container
  await agentx.request("container_create_request", {
    containerId: "tool-demo",
  });

  // Create image with the agent definition
  const imageRes = await agentx.request("image_create_request", {
    containerId: "tool-demo",
    name: ToolAgent.name,
    systemPrompt: ToolAgent.systemPrompt,
    mcpServers: ToolAgent.mcpServers,
  });

  // Run the agent
  const agentRes = await agentx.request("image_run_request", {
    imageId: imageRes.data.imageId,
  });

  console.log("Agent running:", agentRes.data.agentId);

  await agentx.dispose();
}

main().catch(console.error);
```

## MCP Server Transport Types

AgentX supports four transport types for MCP servers:

### 1. Stdio Transport (Local Process)

Most common for local tools. Spawns a subprocess and communicates via stdin/stdout:

```typescript
const agent = defineAgent({
  name: "LocalToolsAgent",
  systemPrompt: "You can access the file system.",
  mcpServers: {
    filesystem: {
      // type: "stdio" is optional (default)
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      env: {
        DEBUG: "mcp:*",
      },
    },
  },
});
```

### 2. SSE Transport (Remote with Streaming)

For remote servers that support Server-Sent Events:

```typescript
const agent = defineAgent({
  name: "RemoteToolsAgent",
  systemPrompt: "You can access remote services.",
  mcpServers: {
    weather: {
      type: "sse",
      url: "https://api.example.com/mcp/sse",
      headers: {
        Authorization: "Bearer your-api-key",
      },
    },
  },
});
```

### 3. HTTP Transport (Stateless Remote)

For simple request/response style remote servers:

```typescript
const agent = defineAgent({
  name: "ApiAgent",
  systemPrompt: "You can call external APIs.",
  mcpServers: {
    database: {
      type: "http",
      url: "https://api.example.com/mcp",
      headers: {
        "X-API-Key": "your-api-key",
      },
    },
  },
});
```

### 4. SDK Transport (In-Process)

For embedded MCP servers running in the same process:

```typescript
const agent = defineAgent({
  name: "EmbeddedToolsAgent",
  systemPrompt: "You have embedded tools.",
  mcpServers: {
    embedded: {
      type: "sdk",
      name: "embedded-server",
      instance: mcpServerInstance, // Your MCP server instance
    },
  },
});
```

## Handling Tool Events

AgentX emits events throughout the tool execution lifecycle. Subscribe to these events for real-time feedback:

### Tool Lifecycle Events

```typescript
import { createAgentX } from "agentxjs";

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Tool is planned (agent decided to use a tool)
  agentx.on("tool_planned", (e) => {
    console.log("Tool planned:", e.data.toolName);
    console.log("Tool ID:", e.data.toolId);
  });

  // Tool is executing
  agentx.on("tool_executing", (e) => {
    console.log("Executing tool:", e.data.toolName);
    console.log("Input:", JSON.stringify(e.data.input, null, 2));
  });

  // Tool completed successfully
  agentx.on("tool_completed", (e) => {
    console.log("Tool completed:", e.data.toolName);
    console.log("Result:", e.data.result);
  });

  // Tool execution failed
  agentx.on("tool_failed", (e) => {
    console.error("Tool failed:", e.data.toolName);
    console.error("Error:", e.data.error);
  });

  // ... agent setup code ...
}
```

### Stream-Level Tool Events

For lower-level control, listen to stream events:

```typescript
// Tool use block starts (agent begins describing tool call)
agentx.on("tool_use_content_block_start", (e) => {
  console.log("Tool call starting:", e.data.name);
  console.log("Tool call ID:", e.data.id);
});

// Tool input JSON streaming (incremental tool parameters)
agentx.on("input_json_delta", (e) => {
  process.stdout.write(e.data.partialJson);
});

// Tool use block ends (tool parameters complete)
agentx.on("tool_use_content_block_stop", (e) => {
  console.log("\nTool parameters complete");
});

// Tool result received
agentx.on("tool_result", (e) => {
  console.log("Tool result:", e.data.result);
  console.log("Is error:", e.data.isError);
});
```

### Message-Level Tool Events

For structured tool message handling:

```typescript
// Tool call message (complete tool call with parameters)
agentx.on("tool_call_message", (e) => {
  const { toolCall } = e.data;
  console.log("Tool call message:");
  console.log("  ID:", toolCall.id);
  console.log("  Name:", toolCall.name);
  console.log("  Input:", JSON.stringify(toolCall.input, null, 2));
});

// Tool result message (complete tool result)
agentx.on("tool_result_message", (e) => {
  const { toolResult } = e.data;
  console.log("Tool result message:");
  console.log("  ID:", toolResult.id);
  console.log("  Name:", toolResult.name);
  console.log("  Output:", toolResult.output);
});
```

## Complete Example: Calculator Tool

A complete example using the filesystem MCP server to create a simple calculator:

```typescript
import { defineAgent, createAgentX } from "agentxjs";

const CalculatorAgent = defineAgent({
  name: "CalculatorAgent",
  description: "An agent that can perform calculations",
  systemPrompt: `You are a helpful calculator assistant.
When asked to perform calculations, use the available tools.
Always explain your calculations step by step.`,
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Event handlers for real-time feedback
  let isThinking = false;
  let currentResponse = "";

  agentx.on("conversation_start", () => {
    isThinking = true;
    console.log("\nCalculator is thinking...\n");
  });

  agentx.on("text_delta", (e) => {
    if (!isThinking) {
      process.stdout.write(e.data.text);
    }
    currentResponse += e.data.text;
  });

  agentx.on("tool_executing", (e) => {
    console.log(`\n[Executing: ${e.data.toolName}]`);
    console.log(`Input: ${JSON.stringify(e.data.input)}`);
  });

  agentx.on("tool_completed", (e) => {
    console.log(`[Result: ${e.data.result}]\n`);
  });

  agentx.on("conversation_end", () => {
    isThinking = false;
    console.log("\n");
    currentResponse = "";
  });

  // Setup agent
  await agentx.request("container_create_request", {
    containerId: "calculator",
  });

  const imageRes = await agentx.request("image_create_request", {
    containerId: "calculator",
    name: CalculatorAgent.name,
    systemPrompt: CalculatorAgent.systemPrompt,
  });

  const agentRes = await agentx.request("image_run_request", {
    imageId: imageRes.data.imageId,
  });

  // Send calculation request
  await agentx.request("message_send_request", {
    agentId: agentRes.data.agentId,
    content: "What is 15 * 23 + 42?",
  });

  // Wait for response
  await new Promise((resolve) => setTimeout(resolve, 10000));

  await agentx.dispose();
}

main().catch(console.error);
```

## Complete Example: Weather API Tool

Using a remote weather API via MCP:

```typescript
import { defineAgent, createAgentX } from "agentxjs";

const WeatherAgent = defineAgent({
  name: "WeatherAgent",
  description: "An agent that can check weather",
  systemPrompt: `You are a weather assistant.
When users ask about weather, use the weather tool to get current conditions.
Always provide helpful context about the weather conditions.`,
  mcpServers: {
    weather: {
      type: "sse",
      url: "https://weather-mcp.example.com/sse",
      headers: {
        Authorization: `Bearer ${process.env.WEATHER_API_KEY}`,
      },
    },
  },
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Track tool usage
  const toolCalls: Array<{
    name: string;
    input: unknown;
    output: unknown;
    duration: number;
  }> = [];

  let toolStartTime: number;

  agentx.on("tool_executing", (e) => {
    toolStartTime = Date.now();
    console.log(`\nFetching weather for: ${JSON.stringify(e.data.input)}`);
  });

  agentx.on("tool_completed", (e) => {
    const duration = Date.now() - toolStartTime;
    toolCalls.push({
      name: e.data.toolName,
      input: {},
      output: e.data.result,
      duration,
    });
    console.log(`Weather data received (${duration}ms)\n`);
  });

  agentx.on("tool_failed", (e) => {
    console.error(`\nFailed to fetch weather: ${e.data.error}\n`);
  });

  agentx.on("text_delta", (e) => {
    process.stdout.write(e.data.text);
  });

  agentx.on("conversation_end", () => {
    console.log("\n\n--- Tool Usage Summary ---");
    for (const call of toolCalls) {
      console.log(`${call.name}: ${call.duration}ms`);
    }
    console.log("-------------------------\n");
  });

  // Setup agent
  await agentx.request("container_create_request", {
    containerId: "weather",
  });

  const imageRes = await agentx.request("image_create_request", {
    containerId: "weather",
    name: WeatherAgent.name,
    systemPrompt: WeatherAgent.systemPrompt,
    mcpServers: WeatherAgent.mcpServers,
  });

  const agentRes = await agentx.request("image_run_request", {
    imageId: imageRes.data.imageId,
  });

  // Ask about weather
  await agentx.request("message_send_request", {
    agentId: agentRes.data.agentId,
    content: "What's the weather like in San Francisco and should I bring an umbrella?",
  });

  // Wait for response
  await new Promise((resolve) => setTimeout(resolve, 15000));

  await agentx.dispose();
}

main().catch(console.error);
```

## Complete Example: File System Tool

Using the official MCP filesystem server:

```typescript
import { defineAgent, createAgentX } from "agentxjs";

const FileAgent = defineAgent({
  name: "FileAgent",
  description: "An agent that can read and write files",
  systemPrompt: `You are a file management assistant.
You can read, write, and manipulate files in the /workspace directory.
Always confirm actions before making changes.`,
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
    },
  },
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Detailed tool execution logging
  agentx.on("tool_planned", (e) => {
    console.log("\n--- Tool Planned ---");
    console.log("Tool:", e.data.toolName);
    console.log("ID:", e.data.toolId);
    console.log("--------------------\n");
  });

  agentx.on("tool_executing", (e) => {
    console.log("\n--- Executing Tool ---");
    console.log("Tool:", e.data.toolName);
    console.log("Input:", JSON.stringify(e.data.input, null, 2));
    console.log("----------------------\n");
  });

  agentx.on("tool_completed", (e) => {
    console.log("\n--- Tool Completed ---");
    console.log("Tool:", e.data.toolName);
    console.log("Result:", e.data.result);
    console.log("-----------------------\n");
  });

  agentx.on("tool_failed", (e) => {
    console.log("\n--- Tool Failed ---");
    console.log("Tool:", e.data.toolName);
    console.log("Error:", e.data.error);
    console.log("-------------------\n");
  });

  agentx.on("text_delta", (e) => {
    process.stdout.write(e.data.text);
  });

  // Setup agent
  await agentx.request("container_create_request", {
    containerId: "files",
  });

  const imageRes = await agentx.request("image_create_request", {
    containerId: "files",
    name: FileAgent.name,
    systemPrompt: FileAgent.systemPrompt,
    mcpServers: FileAgent.mcpServers,
  });

  const agentRes = await agentx.request("image_run_request", {
    imageId: imageRes.data.imageId,
  });

  // Ask to list files
  await agentx.request("message_send_request", {
    agentId: agentRes.data.agentId,
    content:
      "List all files in the current directory and show me the contents of README.md if it exists.",
  });

  // Wait for response
  await new Promise((resolve) => setTimeout(resolve, 20000));

  await agentx.dispose();
}

main().catch(console.error);
```

## Complete Example: Multiple Tools

An agent with access to multiple MCP servers:

```typescript
import { defineAgent, createAgentX } from "agentxjs";

const MultiToolAgent = defineAgent({
  name: "MultiToolAgent",
  description: "An agent with access to multiple tools",
  systemPrompt: `You are a versatile assistant with access to multiple tools:
- File system operations (read, write, list files)
- Web search capabilities
- Database queries

Choose the appropriate tool based on the user's request.
You can combine multiple tools to accomplish complex tasks.`,
  mcpServers: {
    // Local filesystem
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
    },
    // Web search
    search: {
      type: "sse",
      url: "https://search-mcp.example.com/sse",
      headers: {
        Authorization: `Bearer ${process.env.SEARCH_API_KEY}`,
      },
    },
    // Database
    database: {
      type: "http",
      url: "https://db-mcp.example.com/mcp",
      headers: {
        "X-DB-Key": process.env.DB_API_KEY!,
      },
    },
  },
});

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Track all tool executions
  const toolHistory: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    input: unknown;
    output?: unknown;
    error?: string;
    status: "executing" | "completed" | "failed";
  }> = [];

  agentx.on("tool_executing", (e) => {
    toolHistory.push({
      name: e.data.toolName,
      startTime: Date.now(),
      input: e.data.input,
      status: "executing",
    });
    console.log(`\n[${e.data.toolName}] Executing...`);
  });

  agentx.on("tool_completed", (e) => {
    const tool = toolHistory.find((t) => t.name === e.data.toolName && t.status === "executing");
    if (tool) {
      tool.endTime = Date.now();
      tool.output = e.data.result;
      tool.status = "completed";
    }
    console.log(`[${e.data.toolName}] Completed`);
  });

  agentx.on("tool_failed", (e) => {
    const tool = toolHistory.find((t) => t.name === e.data.toolName && t.status === "executing");
    if (tool) {
      tool.endTime = Date.now();
      tool.error = e.data.error;
      tool.status = "failed";
    }
    console.error(`[${e.data.toolName}] Failed: ${e.data.error}`);
  });

  agentx.on("text_delta", (e) => {
    process.stdout.write(e.data.text);
  });

  agentx.on("turn_response", (e) => {
    console.log("\n\n=== Turn Complete ===");
    console.log("Duration:", e.data.durationMs, "ms");
    if (e.data.usage) {
      console.log("Tokens:", e.data.usage.totalTokens);
    }
    console.log("\nTool History:");
    for (const tool of toolHistory) {
      const duration = tool.endTime ? tool.endTime - tool.startTime : "N/A";
      console.log(`  - ${tool.name}: ${tool.status} (${duration}ms)`);
    }
    console.log("=====================\n");
  });

  // Setup agent
  await agentx.request("container_create_request", {
    containerId: "multi-tool",
  });

  const imageRes = await agentx.request("image_create_request", {
    containerId: "multi-tool",
    name: MultiToolAgent.name,
    systemPrompt: MultiToolAgent.systemPrompt,
    mcpServers: MultiToolAgent.mcpServers,
  });

  const agentRes = await agentx.request("image_run_request", {
    imageId: imageRes.data.imageId,
  });

  // Complex request requiring multiple tools
  await agentx.request("message_send_request", {
    agentId: agentRes.data.agentId,
    content: `Search for the latest news about AI,
              save a summary to /workspace/ai-news.txt,
              and store the article titles in the database.`,
  });

  // Wait for response
  await new Promise((resolve) => setTimeout(resolve, 30000));

  await agentx.dispose();
}

main().catch(console.error);
```

## Error Handling

Proper error handling for tool execution:

```typescript
import { createAgentX } from "agentxjs";

async function main() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  // Global error handler
  agentx.on("error_occurred", (e) => {
    console.error("Global error:", e.data.message);
    console.error("Error code:", e.data.code);
    console.error("Recoverable:", e.data.recoverable);
  });

  // Tool-specific error handling
  agentx.on("tool_failed", (e) => {
    console.error(`Tool "${e.data.toolName}" failed with error: ${e.data.error}`);

    // Implement retry logic, fallback, or user notification
    if (e.data.error.includes("timeout")) {
      console.log("Consider retrying with increased timeout...");
    } else if (e.data.error.includes("permission")) {
      console.log("Check tool permissions and access rights...");
    }
  });

  // Handle tool result errors (tool executed but returned error)
  agentx.on("tool_result", (e) => {
    if (e.data.isError) {
      console.warn(`Tool returned error result: ${e.data.result}`);
    }
  });

  // ... rest of setup ...
}
```

## Tool Execution Logging

Comprehensive logging for debugging tool execution:

```typescript
import { createAgentX } from "agentxjs";

interface ToolLog {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  status: "planned" | "executing" | "completed" | "failed";
}

async function createLoggingAgent() {
  const agentx = await createAgentX({
    llm: { apiKey: process.env.ANTHROPIC_API_KEY! },
  });

  const toolLogs: Map<string, ToolLog> = new Map();

  agentx.on("tool_planned", (e) => {
    const log: ToolLog = {
      id: e.data.toolId,
      name: e.data.toolName,
      input: {},
      startTime: Date.now(),
      status: "planned",
    };
    toolLogs.set(e.data.toolId, log);

    console.log(`[PLAN] Tool: ${e.data.toolName} (${e.data.toolId})`);
  });

  agentx.on("tool_executing", (e) => {
    const log = toolLogs.get(e.data.toolId);
    if (log) {
      log.input = e.data.input;
      log.status = "executing";
    }

    console.log(`[EXEC] Tool: ${e.data.toolName}`);
    console.log(`       Input: ${JSON.stringify(e.data.input)}`);
  });

  agentx.on("tool_completed", (e) => {
    const log = toolLogs.get(e.data.toolId);
    if (log) {
      log.output = e.data.result;
      log.endTime = Date.now();
      log.status = "completed";

      const duration = log.endTime - log.startTime;
      console.log(`[DONE] Tool: ${e.data.toolName} (${duration}ms)`);
    }
  });

  agentx.on("tool_failed", (e) => {
    const log = toolLogs.get(e.data.toolId);
    if (log) {
      log.error = e.data.error;
      log.endTime = Date.now();
      log.status = "failed";

      console.log(`[FAIL] Tool: ${e.data.toolName}`);
      console.log(`       Error: ${e.data.error}`);
    }
  });

  // Export logs after conversation
  agentx.on("conversation_end", () => {
    console.log("\n=== Tool Execution Log ===");
    for (const [id, log] of toolLogs) {
      const duration = log.endTime ? log.endTime - log.startTime : "N/A";
      console.log(`\nTool: ${log.name}`);
      console.log(`  ID: ${id}`);
      console.log(`  Status: ${log.status}`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Input: ${JSON.stringify(log.input, null, 2)}`);
      if (log.output) {
        console.log(`  Output: ${JSON.stringify(log.output, null, 2)}`);
      }
      if (log.error) {
        console.log(`  Error: ${log.error}`);
      }
    }
    console.log("===========================\n");
  });

  return { agentx, toolLogs };
}
```

## MCP Tool Definition Format

For reference, here is the MCP tool definition format used by servers:

```typescript
interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<
      string,
      {
        type: "string" | "number" | "boolean" | "object" | "array" | "null";
        description?: string;
        enum?: unknown[];
        items?: object;
        properties?: Record<string, object>;
        required?: string[];
        default?: unknown;
      }
    >;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations?: {
    title?: string;
    [key: string]: unknown;
  };
}

// Example tool definition
const weatherTool: McpTool = {
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name (e.g., 'San Francisco, CA')",
      },
      units: {
        type: "string",
        description: "Temperature units",
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
      },
    },
    required: ["location"],
  },
};
```

## Best Practices

1. **Use descriptive tool names**: Tool names should clearly indicate their function.

2. **Provide detailed system prompts**: Guide the agent on when and how to use tools.

3. **Handle all error cases**: Implement handlers for `tool_failed` and error results.

4. **Log tool executions**: Track tool usage for debugging and analytics.

5. **Set appropriate timeouts**: Remote tools may need longer timeouts.

6. **Validate tool inputs**: Ensure agents provide valid parameters.

7. **Monitor token usage**: Tool calls can significantly increase token consumption.

## Next Steps

- [Event System](../concepts/event-system.md) - Understand all event types in depth
- [First Agent](../getting-started/first-agent.md) - Build your first agent step by step
- [MCP Documentation](https://modelcontextprotocol.io/) - Official MCP specification
