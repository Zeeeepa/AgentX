<div align="center">
  <h1>AgentX</h1>
  <p>
    <strong>Next-generation open-source AI agent development framework and runtime platform</strong>
  </p>
  <p>下一代开源 AI 智能体开发框架与运行时平台</p>

  <p>
    <b>Event-driven Runtime</b> · <b>Simple Framework</b> · <b>Minimal UI</b> · <b>Ready-to-use Portal</b>
  </p>
  <p>
    <b>事件驱动</b> · <b>简易开发</b> · <b>界面简约</b> · <b>开箱即用</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/AgentX"><img src="https://img.shields.io/github/stars/Deepractice/AgentX?style=social" alt="Stars"/></a>
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Deepractice.AgentX" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/AgentX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/agentxjs"><img src="https://img.shields.io/npm/v/agentxjs?color=cb3837&logo=npm" alt="npm"/></a>
    <a href="https://hub.docker.com/r/deepracticexs/portagent"><img src="https://img.shields.io/docker/pulls/deepracticexs/portagent?logo=docker" alt="Docker"/></a>
  </p>

  <p>
    <a href="README.md"><strong>English</strong></a> |
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

---

## 🚀 Quick Start

### Option 1: npx (One-liner)

Quick try with Node.js 20+:

```bash
LLM_PROVIDER_KEY=sk-ant-xxxxx \
LLM_PROVIDER_URL=https://api.anthropic.com \
npx @agentxjs/portagent
```

### Option 2: Docker (Recommended for Production)

Stable, no compilation required:

```bash
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -e LLM_PROVIDER_URL=https://api.anthropic.com \
  -v ./data:/home/node/.agentx \
  deepracticexs/portagent:latest
```

Open <http://localhost:5200> and start chatting!

![Portagent Demo](./apps/portagent/public/Portagent.gif)

### What You Get

- **Multi-User Support** - User registration (invite code optional)
- **Session Persistence** - Resume conversations anytime
- **Real-time Streaming** - WebSocket-based communication
- **Docker Ready** - Production-ready with health checks

> **Tip:** Add `-e INVITE_CODE_REQUIRED=true` to enable invite code protection.

👉 **[Full Portagent Documentation](./apps/portagent/README.md)** - Configuration, deployment, API reference

---

## 🛠️ Build with AgentX

AgentX is a TypeScript framework for building AI Agent applications with event-driven architecture.

**Server-side (Node.js)**

```typescript
import { createServer } from "http";
import { createAgentX, defineAgent } from "agentxjs";

// Define your Agent
const MyAgent = defineAgent({
  name: "MyAgent",
  systemPrompt: "You are a helpful assistant.",
  mcpServers: {
    // Optional: Add MCP servers for tools
    filesystem: {
      command: "npx",
      args: ["-y", "@anthropic/mcp-server-filesystem", "/tmp"],
    },
  },
});

// Create HTTP server
const server = createServer();

// Create AgentX instance
const agentx = await createAgentX({
  llm: {
    apiKey: process.env.LLM_PROVIDER_KEY,
    baseUrl: process.env.LLM_PROVIDER_URL,
  },
  agentxDir: "~/.agentx", // Auto-configures SQLite storage
  server, // Attach WebSocket to HTTP server
  defaultAgent: MyAgent, // Default agent for new conversations
});

// Start server
server.listen(5200, () => {
  console.log("✓ Server running at http://localhost:5200");
  console.log("✓ WebSocket available at ws://localhost:5200/ws");
});
```

**Client-side (Browser/React)**

```typescript
import { useAgentX, ResponsiveStudio } from "@agentxjs/ui";
import "@agentxjs/ui/styles.css";

function App() {
  const agentx = useAgentX("ws://localhost:5200/ws");

  if (!agentx) return <div>Connecting...</div>;

  return <ResponsiveStudio agentx={agentx} />;
}
```

### 📚 Documentation

- **[Getting Started](./docs/getting-started/)**
  - [Installation](./docs/getting-started/installation.md)
  - [Quick Start](./docs/getting-started/quickstart.md)
  - [First Agent](./docs/getting-started/first-agent.md)
- **[Core Concepts](./docs/concepts/)**
  - [Architecture Overview](./docs/concepts/overview.md)
  - [Event System](./docs/concepts/event-system.md)
  - [Lifecycle](./docs/concepts/lifecycle.md)
  - [Mealy Machine](./docs/concepts/mealy-machine.md)
- **[Guides](./docs/guides/)**
  - [Event Subscription](./docs/guides/events.md)
  - [Session Management](./docs/guides/sessions.md)
  - [Persistence](./docs/guides/persistence.md)
  - [MCP Tools](./docs/guides/tools.md)
- **[API Reference](./docs/api/)**
  - [AgentX API](./docs/api/agentx.md)
  - [Runtime API](./docs/api/runtime.md)
  - [Agent API](./docs/api/agent.md)
  - [Event Types](./docs/api/events.md)
- **[Packages](./docs/packages/)**
  - [@agentxjs/types](./docs/packages/types.md)
  - [@agentxjs/common](./docs/packages/common.md)
  - [@agentxjs/agent](./docs/packages/agent.md)
  - [@agentxjs/runtime](./docs/packages/runtime.md)
  - [agentxjs](./docs/packages/agentx.md)
  - [@agentxjs/ui](./docs/packages/ui.md)
- **[Examples](./docs/examples/)**
  - [CLI Chat](./docs/examples/chat-cli.md)
  - [Web Chat](./docs/examples/chat-web.md)
  - [Tool Usage](./docs/examples/tool-use.md)

👉 **[Full Documentation](./docs/README.md)** - Learning paths and more

---

## 🏗️ Architecture

Event-driven architecture with layered design:

```
SERVER SIDE                      SYSTEMBUS                   CLIENT SIDE
═══════════════════════════════════════════════════════════════════════════

                                     ║
┌─────────────────┐                  ║
│  Environment    │                  ║
│  • LLMProvider  │      emit        ║
│  • Sandbox      │─────────────────>║
└─────────────────┘                  ║
                                     ║
                                     ║
┌─────────────────┐    subscribe     ║
│  Agent Layer    │<─────────────────║
│  • AgentEngine  │                  ║
│  • Agent        │      emit        ║
│                 │─────────────────>║         ┌─────────────────┐
│  4-Layer Events │                  ║         │                 │
│  • Stream       │                  ║ broadcast │  WebSocket   │
│  • State        │                  ║════════>│ (Event Stream)  │
│  • Message      │                  ║<════════│                 │
│  • Turn         │                  ║  input  │  AgentX API     │
└─────────────────┘                  ║         └─────────────────┘
                                     ║
                                     ║
┌─────────────────┐                  ║
│  Runtime Layer  │                  ║
│                 │      emit        ║
│  • Persistence  │─────────────────>║
│  • Container    │                  ║
│  • WebSocket    │<─────────────────╫
│                 │─────────────────>║
└─────────────────┘                  ║
                                     ║
                              [ Event Bus ]
                             [ RxJS Pub/Sub ]

Event Flow:
  → Input:  Client → WebSocket → BUS → Claude SDK
  ← Output: SDK → BUS → AgentEngine → BUS → Client
```

---

## 💬 About

AgentX is in early development. We welcome your ideas, feedback, and feature requests!

### 🌐 Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI Agent infrastructure:

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent context platform
- **[ResourceX](https://github.com/Deepractice/ResourceX)** - Unified resource manager (ARP)
- **[ToolX](https://github.com/Deepractice/ToolX)** - Tool integration
- **[UIX](https://github.com/Deepractice/UIX)** - AI-to-UI protocol layer
- **[SandboX](https://github.com/Deepractice/SandboX)** - Agent sandbox

### 📞 Connect

<div align="center">
  <p><strong>Connect with the Founder</strong></p>
  <p>📧 <a href="mailto:sean@deepractice.ai">sean@deepractice.ai</a></p>
  <img src="https://brands.deepractice.ai/images/sean-wechat-qrcode.jpg" alt="WeChat QR Code" width="200"/>
  <p><em>Scan to connect with Sean (Founder & CEO) on WeChat</em></p>
</div>

---

<div align="center">
  <p>
    Built with ❤️ by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
