# CLI Chat Application

Build a complete command-line chat application with AgentX. This example demonstrates real-time streaming, conversation history, SQLite persistence, graceful shutdown, error handling, and custom commands.

## What You Will Build

A fully-featured CLI chat application with:

- Real-time streaming output (typewriter effect)
- Conversation history management
- SQLite persistence for chat history
- Graceful shutdown handling
- Error handling and recovery
- Custom commands (/help, /clear, /history, /quit)
- Token usage tracking

## Prerequisites

- Node.js >= 20.0.0
- An Anthropic API key from [Anthropic Console](https://console.anthropic.com/)
- Basic TypeScript knowledge

## Project Setup

### 1. Create Project Directory

```bash
mkdir chat-cli
cd chat-cli
```

### 2. Initialize Project

Create `package.json`:

```json
{
  "name": "chat-cli",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/main.ts",
    "dev": "tsx watch src/main.ts"
  },
  "dependencies": {
    "agentxjs": "latest",
    "@agentxjs/runtime": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

### 4. Install Dependencies

```bash
pnpm install
```

## Complete Source Code

Create `src/main.ts`:

```typescript
/**
 * CLI Chat Application with AgentX
 *
 * Features:
 * - Real-time streaming output
 * - Conversation history
 * - SQLite persistence
 * - Graceful shutdown
 * - Error handling
 * - Custom commands
 */

import { createAgentX, type AgentX } from "agentxjs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  dbPath: "./data/chat-history.db",
  agentName: "ChatAssistant",
  systemPrompt: `You are a helpful, friendly, and knowledgeable assistant.

You can help with:
- Answering questions on various topics
- Writing and explaining code
- Brainstorming ideas
- Proofreading and editing text
- General conversation

Be concise but thorough. Use markdown formatting when appropriate.`,
};

// ============================================================================
// Types
// ============================================================================

interface ChatStats {
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  startTime: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDataDirectory(dbPath: string): void {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function printWelcome(): void {
  console.log("\n========================================");
  console.log("       AgentX CLI Chat Application");
  console.log("========================================\n");
  console.log("Commands:");
  console.log("  /help    - Show this help message");
  console.log("  /clear   - Clear the screen");
  console.log("  /history - Show conversation history");
  console.log("  /stats   - Show session statistics");
  console.log("  /quit    - Exit the application\n");
  console.log("Type your message and press Enter to chat.\n");
  console.log("----------------------------------------\n");
}

function printHelp(): void {
  console.log("\nAvailable Commands:");
  console.log("  /help    - Show this help message");
  console.log("  /clear   - Clear the screen and show welcome");
  console.log("  /history - Display recent conversation history");
  console.log("  /stats   - Show session statistics (tokens, duration)");
  console.log("  /quit    - Gracefully exit the application");
  console.log("\nTips:");
  console.log("  - Press Ctrl+C to interrupt a response");
  console.log("  - Your conversation is saved automatically");
  console.log("  - Use markdown for code blocks\n");
}

// ============================================================================
// Chat Application Class
// ============================================================================

class ChatApplication {
  private agentx: AgentX | null = null;
  private agentId: string | null = null;
  private rl: readline.Interface | null = null;
  private isResponding = false;
  private stats: ChatStats;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.stats = {
      messageCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      startTime: Date.now(),
    };
  }

  async initialize(): Promise<void> {
    // Validate API key
    if (!CONFIG.apiKey) {
      console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
      console.error("Please set it with: export ANTHROPIC_API_KEY=sk-ant-xxxxx");
      process.exit(1);
    }

    // Ensure data directory exists
    ensureDataDirectory(CONFIG.dbPath);

    console.log("Initializing AgentX...");

    try {
      // Create AgentX with SQLite persistence
      this.agentx = await createAgentX({
        llm: {
          apiKey: CONFIG.apiKey,
        },
        storage: {
          driver: "sqlite",
          path: CONFIG.dbPath,
        },
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Create container
      await this.agentx.request("container_create_request", {
        containerId: "chat-container",
      });

      // Run agent
      const agentRes = await this.agentx.request("agent_run_request", {
        containerId: "chat-container",
        config: {
          name: CONFIG.agentName,
          systemPrompt: CONFIG.systemPrompt,
        },
      });

      this.agentId = agentRes.data.agentId;
      console.log("AgentX initialized successfully.\n");
    } catch (error) {
      console.error("Failed to initialize AgentX:", error);
      process.exit(1);
    }
  }

  private setupEventHandlers(): void {
    if (!this.agentx) return;

    // Stream text in real-time (typewriter effect)
    this.agentx.on("text_delta", (e) => {
      process.stdout.write(e.data.text);
    });

    // Show when agent starts responding
    this.agentx.on("conversation_start", () => {
      this.isResponding = true;
      process.stdout.write("\nAssistant: ");
    });

    // Handle conversation end
    this.agentx.on("conversation_end", () => {
      this.isResponding = false;
      console.log("\n");
    });

    // Handle interruption
    this.agentx.on("conversation_interrupted", () => {
      this.isResponding = false;
      console.log("\n[Interrupted]\n");
    });

    // Track tool usage
    this.agentx.on("tool_planned", (e) => {
      console.log(`\n[Using tool: ${e.data.toolCall.name}]`);
    });

    this.agentx.on("tool_completed", (e) => {
      console.log(`[Tool completed: ${e.data.toolResult.name}]`);
    });

    // Track token usage
    this.agentx.on("turn_response", (e) => {
      if (e.data.usage) {
        this.stats.totalInputTokens += e.data.usage.inputTokens;
        this.stats.totalOutputTokens += e.data.usage.outputTokens;
      }
      this.stats.messageCount++;
    });

    // Store messages in history
    this.agentx.on("user_message", (e) => {
      this.conversationHistory.push({
        role: "user",
        content: e.data.content as string,
      });
    });

    this.agentx.on("assistant_message", (e) => {
      this.conversationHistory.push({
        role: "assistant",
        content: e.data.content as string,
      });
    });

    // Handle errors
    this.agentx.on("error_occurred", (e) => {
      console.error("\n[Error]:", e.data.error.message);
      this.isResponding = false;
    });
  }

  async handleCommand(command: string): Promise<boolean> {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case "/help":
        printHelp();
        return true;

      case "/clear":
        console.clear();
        printWelcome();
        return true;

      case "/history":
        this.showHistory();
        return true;

      case "/stats":
        this.showStats();
        return true;

      case "/quit":
      case "/exit":
      case "/q":
        return false;

      default:
        if (cmd.startsWith("/")) {
          console.log(`Unknown command: ${cmd}`);
          console.log("Type /help for available commands.\n");
          return true;
        }
        return true;
    }
  }

  private showHistory(): void {
    console.log("\n--- Conversation History ---\n");

    if (this.conversationHistory.length === 0) {
      console.log("No messages yet.\n");
      return;
    }

    // Show last 10 messages
    const recentHistory = this.conversationHistory.slice(-10);

    for (const msg of recentHistory) {
      const prefix = msg.role === "user" ? "You" : "Assistant";
      const content =
        msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
      console.log(`${prefix}: ${content}`);
    }

    if (this.conversationHistory.length > 10) {
      console.log(`\n... and ${this.conversationHistory.length - 10} more messages`);
    }

    console.log("\n----------------------------\n");
  }

  private showStats(): void {
    const duration = Date.now() - this.stats.startTime;

    console.log("\n--- Session Statistics ---\n");
    console.log(`Messages:      ${this.stats.messageCount}`);
    console.log(`Input tokens:  ${this.stats.totalInputTokens.toLocaleString()}`);
    console.log(`Output tokens: ${this.stats.totalOutputTokens.toLocaleString()}`);
    console.log(
      `Total tokens:  ${(this.stats.totalInputTokens + this.stats.totalOutputTokens).toLocaleString()}`
    );
    console.log(`Duration:      ${formatDuration(duration)}`);
    console.log(`Database:      ${CONFIG.dbPath}`);
    console.log("\n--------------------------\n");
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.agentx || !this.agentId) {
      console.error("AgentX not initialized");
      return;
    }

    try {
      await this.agentx.request("agent_receive_request", {
        agentId: this.agentId,
        content,
      });
    } catch (error) {
      console.error("\nFailed to send message:", error);
      this.isResponding = false;
    }
  }

  async interruptResponse(): Promise<void> {
    if (!this.agentx || !this.agentId || !this.isResponding) {
      return;
    }

    try {
      await this.agentx.request("agent_interrupt_request", {
        agentId: this.agentId,
      });
    } catch (error) {
      // Ignore interrupt errors
    }
  }

  async run(): Promise<void> {
    await this.initialize();
    printWelcome();

    // Create readline interface
    this.rl = readline.createInterface({ input, output });

    // Main chat loop
    let running = true;

    while (running) {
      try {
        const userInput = await this.rl.question("You: ");

        // Skip empty input
        if (!userInput.trim()) {
          continue;
        }

        // Handle commands
        if (userInput.startsWith("/")) {
          running = await this.handleCommand(userInput);
          continue;
        }

        // Send message to agent
        await this.sendMessage(userInput);

        // Wait for response to complete
        while (this.isResponding) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        // Handle readline close (Ctrl+D)
        if ((error as NodeJS.ErrnoException).code === "ERR_USE_AFTER_CLOSE") {
          running = false;
        } else {
          console.error("\nError:", error);
        }
      }
    }

    await this.shutdown();
  }

  async shutdown(): Promise<void> {
    console.log("\nShutting down...");

    // Show final stats
    this.showStats();

    // Close readline
    if (this.rl) {
      this.rl.close();
    }

    // Dispose AgentX
    if (this.agentx) {
      try {
        await this.agentx.dispose();
        console.log("Chat history saved to:", CONFIG.dbPath);
      } catch (error) {
        console.error("Error during shutdown:", error);
      }
    }

    console.log("Goodbye!\n");
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const app = new ChatApplication();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await app.interruptResponse();
    console.log("\n");
    await app.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await app.shutdown();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("\nUncaught exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("\nUnhandled rejection:", reason);
    process.exit(1);
  });

  // Run the application
  await app.run();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

## Code Walkthrough

### Configuration

The `CONFIG` object centralizes all application settings:

```typescript
const CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  dbPath: "./data/chat-history.db",
  agentName: "ChatAssistant",
  systemPrompt: "...",
};
```

This makes it easy to modify settings without searching through the code.

### Initialization

The `initialize()` method sets up AgentX with SQLite persistence:

```typescript
this.agentx = await createAgentX({
  llm: { apiKey: CONFIG.apiKey },
  storage: {
    driver: "sqlite",
    path: CONFIG.dbPath,
  },
});
```

SQLite persistence ensures your conversation history survives application restarts.

### Event Handling

The application subscribes to multiple event types:

| Event                                | Purpose                                       |
| ------------------------------------ | --------------------------------------------- |
| `text_delta`                         | Stream text in real-time (typewriter effect)  |
| `conversation_start`                 | Show "Assistant:" prefix when response begins |
| `conversation_end`                   | Add newlines when response completes          |
| `turn_response`                      | Track token usage statistics                  |
| `user_message` / `assistant_message` | Store conversation history                    |
| `error_occurred`                     | Handle and display errors                     |

### Real-Time Streaming

The typewriter effect is achieved by writing text deltas directly to stdout:

```typescript
this.agentx.on("text_delta", (e) => {
  process.stdout.write(e.data.text);
});
```

This creates a smooth, character-by-character output as the AI generates its response.

### Command Handling

The `/` prefix triggers command handling:

```typescript
if (userInput.startsWith("/")) {
  running = await this.handleCommand(userInput);
  continue;
}
```

Commands like `/help`, `/clear`, `/history`, `/stats`, and `/quit` provide utility functions.

### Graceful Shutdown

The application handles multiple shutdown signals:

```typescript
process.on("SIGINT", async () => {
  await app.interruptResponse();
  await app.shutdown();
  process.exit(0);
});
```

This ensures:

- In-progress responses are interrupted
- Statistics are displayed
- Database connections are closed
- Resources are cleaned up

## Running the Example

### 1. Set Your API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 2. Start the Application

```bash
pnpm start
```

### 3. Example Session

```
========================================
       AgentX CLI Chat Application
========================================

Commands:
  /help    - Show this help message
  /clear   - Clear the screen
  /history - Show conversation history
  /stats   - Show session statistics
  /quit    - Exit the application

Type your message and press Enter to chat.

----------------------------------------

You: Hello! What can you help me with?

Assistant: Hello! I'm your AI assistant, and I can help you with a wide variety of tasks:

- **Questions & Research**: I can answer questions on many topics
- **Coding**: Write, explain, and debug code
- **Writing**: Draft emails, articles, or creative content
- **Brainstorming**: Help generate ideas for projects
- **Math & Analysis**: Solve problems and explain concepts

Just type your question or request, and I'll do my best to help!

You: /stats

--- Session Statistics ---

Messages:      1
Input tokens:  150
Output tokens: 89
Total tokens:  239
Duration:      45s
Database:      ./data/chat-history.db

--------------------------

You: /quit

Shutting down...

--- Session Statistics ---

Messages:      1
Input tokens:  150
Output tokens: 89
Total tokens:  239
Duration:      52s
Database:      ./data/chat-history.db

--------------------------

Chat history saved to: ./data/chat-history.db
Goodbye!
```

## Extending the Example

### Add More Commands

You can easily add custom commands:

```typescript
case "/model":
  console.log(`Current model: Claude`);
  return true;

case "/export":
  await this.exportHistory();
  return true;
```

### Add Colored Output

Install a colors library for better visual feedback:

```bash
pnpm add chalk
```

```typescript
import chalk from "chalk";

// In printWelcome()
console.log(chalk.cyan("========================================"));
console.log(chalk.cyan.bold("       AgentX CLI Chat Application"));
console.log(chalk.cyan("========================================"));

// In setupEventHandlers()
this.agentx.on("error_occurred", (e) => {
  console.error(chalk.red("\n[Error]:"), e.data.error.message);
});
```

### Add Multi-line Input

For longer messages, you can implement multi-line input:

````typescript
// Check for multi-line mode trigger
if (userInput === "```") {
  let multiLineContent = "";
  console.log("Enter your multi-line message (type ``` to finish):");

  while (true) {
    const line = await this.rl.question("");
    if (line === "```") break;
    multiLineContent += line + "\n";
  }

  await this.sendMessage(multiLineContent.trim());
}
````

## Troubleshooting

### API Key Not Set

```
Error: ANTHROPIC_API_KEY environment variable is not set.
```

Solution: Set your API key before running:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Database Errors

If you encounter SQLite errors, try:

1. Delete the database file: `rm -rf ./data/chat-history.db`
2. Restart the application

### Connection Issues

If the agent is not responding:

1. Check your internet connection
2. Verify your API key is valid
3. Check the Anthropic API status

## Next Steps

- **[Event System](../concepts/event-system.md)** - Learn about all event types
- **[First Agent Tutorial](../getting-started/first-agent.md)** - More detailed walkthrough
- **[Tool Integration](../guides/tools.md)** - Add custom tools to your agent
