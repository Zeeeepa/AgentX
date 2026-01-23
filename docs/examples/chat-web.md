# Web Chat Application Example

This guide demonstrates how to build a complete web chat application using AgentX. You will create a React-based chat interface that connects to an AgentX server via WebSocket for real-time AI conversations.

## Overview

The application consists of two parts:

1. **Server**: Node.js server with AgentX runtime and WebSocket support
2. **Client**: React application with `@agentxjs/ui` components

Architecture:

```
Browser (React + @agentxjs/ui)
    |
    | WebSocket
    v
Server (Node.js + agentxjs + Claude API)
    |
    | HTTP
    v
Claude API (Anthropic)
```

## Prerequisites

- Node.js 18+ or Bun
- Anthropic API key
- Basic knowledge of React and TypeScript

## Project Setup

### Initialize the Project

```bash
mkdir chat-web-example
cd chat-web-example
bun init -y
```

### Install Dependencies

```bash
# Server dependencies
bun add agentxjs hono @hono/node-server

# Client dependencies
bun add @agentxjs/ui agentxjs react react-dom

# Dev dependencies
bun add -d typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

### Project Structure

```
chat-web-example/
├── server/
│   └── main.ts           # AgentX server with WebSocket
├── client/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main app component
│   └── ChatPage.tsx      # Chat interface
├── vite.config.ts        # Vite configuration
├── index.html            # HTML entry point
└── package.json
```

---

## Server Setup

The server runs AgentX in local mode with Claude API and exposes a WebSocket endpoint for client connections.

### server/main.ts

```typescript
/**
 * AgentX Chat Server
 *
 * Provides:
 * - WebSocket endpoint for real-time communication
 * - Health check endpoint
 * - CORS support for development
 */

import { createServer } from "http";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getRequestListener } from "@hono/node-server";
import { createAgentX, defineAgent } from "agentxjs";

// Configuration
const PORT = parseInt(process.env.PORT || "5200", 10);
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is required");
  console.log("Set it via: export ANTHROPIC_API_KEY=sk-ant-xxx");
  process.exit(1);
}

// Define a simple chat agent
const ChatAssistant = defineAgent({
  name: "ChatAssistant",
  systemPrompt: `You are a helpful AI assistant. Be concise and friendly.
Respond in the same language as the user's message.`,
});

async function main() {
  // Create Hono app for HTTP routes
  const app = new Hono();

  // Enable CORS for development
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Health check endpoint
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: Date.now(),
    })
  );

  // Server info endpoint (for client to discover WebSocket path)
  app.get("/info", (c) =>
    c.json({
      version: "1.0.0",
      wsPath: "/ws",
    })
  );

  // Create HTTP server
  const listener = getRequestListener(app.fetch);
  const httpServer = createServer(listener);

  // Create AgentX instance with WebSocket attached to HTTP server
  const agentx = await createAgentX({
    llm: {
      apiKey: API_KEY,
      // Optional: specify model
      // model: "claude-sonnet-4-20250514",
    },
    server: httpServer, // Attach WebSocket to HTTP server
  });

  // Register the chat agent definition
  agentx.definitions.register(ChatAssistant);

  // Start server
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`
    Chat Server Started
    -------------------
    HTTP:      http://localhost:${PORT}
    WebSocket: ws://localhost:${PORT}/ws
    Health:    http://localhost:${PORT}/health
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await agentx.dispose();
    httpServer.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(console.error);
```

### Running the Server

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-xxx

# Run server
bun run server/main.ts
```

---

## Client Setup

The client uses React with `@agentxjs/ui` components for a complete chat interface.

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgentX Chat</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/main.tsx"></script>
  </body>
</html>
```

### client/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// Import AgentX UI styles
import "@agentxjs/ui/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### client/App.tsx

```tsx
/**
 * Main App Component
 *
 * Manages WebSocket connection and renders chat interface.
 */

import { useState, useEffect } from "react";
import type { AgentX } from "agentxjs";
import { createAgentX } from "agentxjs";
import { ChatPage } from "./ChatPage";

// Server configuration
const SERVER_URL = "ws://localhost:5200";

/**
 * Loading screen while connecting
 */
function LoadingScreen() {
  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse text-muted-foreground">...</div>
        <p className="text-muted-foreground">Connecting to server...</p>
      </div>
    </div>
  );
}

/**
 * Error screen with retry option
 */
function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h2 className="text-xl font-semibold text-foreground mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [agentx, setAgentx] = useState<AgentX | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  // Initialize AgentX connection
  useEffect(() => {
    let mounted = true;
    let instance: AgentX | null = null;

    const connect = async () => {
      try {
        // Create AgentX in remote mode (WebSocket)
        instance = await createAgentX({
          serverUrl: SERVER_URL,
        });

        if (!mounted) {
          await instance.dispose();
          return;
        }

        setAgentx(instance);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error("Connection error:", err);
        setError("Cannot connect to server. Is the server running?");
      } finally {
        if (mounted) {
          setIsConnecting(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (instance) {
        instance.dispose();
      }
    };
  }, []);

  const handleRetry = () => {
    setIsConnecting(true);
    setError(null);
    window.location.reload();
  };

  if (isConnecting) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={handleRetry} />;
  }

  if (!agentx) {
    return <ErrorScreen message="Failed to initialize" onRetry={handleRetry} />;
  }

  return <ChatPage agentx={agentx} />;
}
```

### client/ChatPage.tsx

```tsx
/**
 * Chat Page Component
 *
 * Uses @agentxjs/ui components for a complete chat interface.
 * ResponsiveStudio automatically handles desktop and mobile layouts.
 */

import type { AgentX } from "agentxjs";
import { ResponsiveStudio, useIsMobile } from "@agentxjs/ui";

interface ChatPageProps {
  agentx: AgentX;
}

/**
 * Header with title
 */
function Header() {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-4">
      <span className="text-lg font-semibold text-foreground">AgentX Chat</span>
    </div>
  );
}

export function ChatPage({ agentx }: ChatPageProps) {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Hide header on mobile - MobileStudio has its own header */}
      {!isMobile && <Header />}
      <div className="flex-1 overflow-hidden">
        {/* ResponsiveStudio provides complete chat UI */}
        <ResponsiveStudio
          agentx={agentx}
          containerId="default"
          sidebarWidth={280}
          searchable={true}
        />
      </div>
    </div>
  );
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend
      "/health": "http://localhost:5200",
      "/info": "http://localhost:5200",
    },
  },
});
```

---

## Building a Custom Chat Interface

If you need more control over the UI, you can build a custom chat interface using lower-level hooks and components.

### Custom Chat with useAgent Hook

```tsx
/**
 * Custom Chat Component
 *
 * Uses useAgent hook for full control over the chat interface.
 */

import { useState, useEffect } from "react";
import type { AgentX } from "agentxjs";
import {
  useAgent,
  useImages,
  MessagePane,
  InputPane,
  UserEntry,
  AssistantEntry,
  ErrorEntry,
  type ConversationData,
  type ToolBarItem,
} from "@agentxjs/ui";
import { Smile, FolderOpen } from "lucide-react";

interface CustomChatProps {
  agentx: AgentX;
}

export function CustomChat({ agentx }: CustomChatProps) {
  // Manage image selection
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // Load images (conversations) for this container
  const { images, createImage } = useImages(agentx, {
    containerId: "default",
    autoLoad: true,
  });

  // Bind to agent events
  const { conversations, streamingText, currentTextBlockId, status, send, interrupt, isLoading } =
    useAgent(agentx, currentImageId);

  // Create new conversation on first load if none exists
  useEffect(() => {
    if (images.length === 0 && !currentImageId) {
      createImage({ name: "New Chat" }).then((image) => {
        if (image) {
          setCurrentImageId(image.imageId);
        }
      });
    } else if (images.length > 0 && !currentImageId) {
      setCurrentImageId(images[0].imageId);
    }
  }, [images, currentImageId, createImage]);

  // Render conversation entries
  const renderConversation = (conv: ConversationData) => {
    switch (conv.type) {
      case "user":
        return <UserEntry key={conv.id} entry={conv} />;
      case "assistant":
        return (
          <AssistantEntry
            key={conv.id}
            entry={conv}
            streamingText={streamingText}
            currentTextBlockId={currentTextBlockId}
            onStop={interrupt}
          />
        );
      case "error":
        return <ErrorEntry key={conv.id} entry={conv} />;
      default:
        return null;
    }
  };

  // Toolbar items for input
  const toolbarItems: ToolBarItem[] = [
    { id: "emoji", icon: <Smile className="w-4 h-4" />, label: "Emoji" },
    { id: "folder", icon: <FolderOpen className="w-4 h-4" />, label: "File" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with status */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <span className="font-semibold">Chat</span>
        <span className="text-sm text-muted-foreground capitalize">{status}</span>
      </div>

      {/* Message area */}
      <div className="flex-1 min-h-0">
        <MessagePane>{conversations.map(renderConversation)}</MessagePane>
      </div>

      {/* Input area */}
      <div className="h-[25%] min-h-0">
        <InputPane
          onSend={send}
          onStop={interrupt}
          isLoading={isLoading}
          placeholder="Type a message..."
          toolbarItems={toolbarItems}
        />
      </div>
    </div>
  );
}
```

---

## Authentication Support

For production applications, you will want to add authentication. AgentX supports passing authentication headers during connection.

### Connecting with Auth Headers

```tsx
import { createAgentX } from "agentxjs";

// Static configuration
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});

// Dynamic configuration (evaluated on connect/reconnect)
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: () => ({
    Authorization: `Bearer ${getAccessToken()}`,
  }),
});

// Async dynamic configuration
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: async () => ({
    Authorization: `Bearer ${await refreshTokenIfNeeded()}`,
  }),
});
```

### Passing Business Context

You can also pass business context that will be included in all requests:

```tsx
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: { Authorization: `Bearer ${token}` },
  context: {
    userId: "user-123",
    tenantId: "tenant-abc",
    permissions: ["read", "write"],
  },
});
```

---

## Error Handling

### Connection Error Handling

```tsx
import { useState, useEffect } from "react";
import type { AgentX } from "agentxjs";
import { createAgentX } from "agentxjs";

function useAgentXConnection(serverUrl: string) {
  const [agentx, setAgentx] = useState<AgentX | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">(
    "connecting"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let instance: AgentX | null = null;
    let mounted = true;

    const connect = async () => {
      setStatus("connecting");
      setError(null);

      try {
        instance = await createAgentX({ serverUrl });

        if (!mounted) {
          await instance.dispose();
          return;
        }

        // Listen for system errors
        instance.on("system_error", (event) => {
          const data = event.data as { message: string };
          console.error("System error:", data.message);
          setError(data.message);
        });

        setAgentx(instance);
        setStatus("connected");
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setStatus("error");
      }
    };

    connect();

    return () => {
      mounted = false;
      if (instance) {
        instance.dispose();
      }
    };
  }, [serverUrl]);

  return { agentx, status, error };
}
```

### UI Error Display with Toast

```tsx
import { useEffect } from "react";
import type { AgentX } from "agentxjs";
import { ResponsiveStudio, useToast, ToastContainer } from "@agentxjs/ui";

function ChatWithErrorHandling({ agentx }: { agentx: AgentX }) {
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    // Subscribe to system errors
    const unsubscribe = agentx.on("system_error", (event) => {
      const data = event.data as {
        message: string;
        severity?: "info" | "warn" | "error";
      };
      showToast(data.message, data.severity || "error");
    });

    return () => unsubscribe();
  }, [agentx, showToast]);

  return (
    <div className="h-screen relative">
      <ResponsiveStudio agentx={agentx} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
```

---

## Running the Application

### Start the Server

```bash
# Terminal 1: Start the server
export ANTHROPIC_API_KEY=sk-ant-xxx
bun run server/main.ts
```

### Start the Client

```bash
# Terminal 2: Start Vite dev server
bun run vite
```

### Access the Application

Open `http://localhost:3000` in your browser.

---

## Features Summary

The complete web chat application includes:

- **Real-time Streaming**: Text appears character-by-character as the AI generates responses
- **Responsive Design**: Automatically switches between desktop and mobile layouts
- **Conversation Management**: Create, switch, and persist multiple conversations
- **File Attachments**: Support for images and documents via drag-and-drop or file picker
- **Emoji Picker**: Built-in emoji selection toolbar
- **Error Handling**: Graceful error display and connection recovery
- **Authentication**: Support for JWT tokens and custom headers
- **Business Context**: Pass user info, tenant ID, and permissions with requests

---

## Component Reference

| Component          | Description                                   |
| ------------------ | --------------------------------------------- |
| `ResponsiveStudio` | Complete chat workspace (auto desktop/mobile) |
| `Studio`           | Desktop chat layout with sidebar              |
| `MobileStudio`     | Mobile-optimized chat layout                  |
| `Chat`             | Chat interface with messages and input        |
| `MessagePane`      | Scrollable message container                  |
| `InputPane`        | Text input with toolbar and attachments       |
| `UserEntry`        | User message display                          |
| `AssistantEntry`   | AI response with streaming support            |
| `ErrorEntry`       | Error message display                         |

## Hook Reference

| Hook          | Description                                        |
| ------------- | -------------------------------------------------- |
| `useAgentX`   | Create and manage AgentX connection                |
| `useAgent`    | Bind to agent events and manage conversation state |
| `useImages`   | Load and manage conversation images                |
| `useIsMobile` | Detect mobile viewport                             |
| `useToast`    | Toast notification management                      |

---

## Next Steps

- Add user authentication with JWT
- Implement conversation history persistence
- Add support for tool calling (MCP servers)
- Customize the theme with CSS variables
- Deploy to production with HTTPS and WSS
