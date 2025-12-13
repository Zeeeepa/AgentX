<div align="center">
  <h1>AgentX</h1>
  <p>
    <strong>下一代开源 AI 智能体开发框架与运行时平台</strong>
  </p>
  <p>Next-generation open-source AI agent development framework and runtime platform</p>

  <p>
    <b>事件驱动</b> · <b>简易开发</b> · <b>界面简约</b> · <b>开箱即用</b>
  </p>
  <p>
    <b>Event-driven Runtime</b> · <b>Simple Framework</b> · <b>Minimal UI</b> · <b>Ready-to-use Portal</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/AgentX"><img src="https://img.shields.io/github/stars/Deepractice/AgentX?style=social" alt="Stars"/></a>
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Deepractice.AgentX" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/AgentX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/agentxjs"><img src="https://img.shields.io/npm/v/agentxjs?color=cb3837&logo=npm" alt="npm"/></a>
    <a href="https://hub.docker.com/r/deepracticexs/portagent"><img src="https://img.shields.io/docker/pulls/deepracticexs/portagent?logo=docker" alt="Docker"/></a>
  </p>

  <p>
    <a href="README.md">English</a> |
    <a href="README.zh-CN.md"><strong>简体中文</strong></a>
  </p>
</div>

---

## 🚀 快速开始

### 方式一：npx（一键启动）

需要 Node.js 20+：

```bash
LLM_PROVIDER_KEY=sk-ant-xxxxx \
LLM_PROVIDER_URL=https://api.anthropic.com \
npx @agentxjs/portagent
```

### 方式二：Docker（生产环境推荐）

无需编译，开箱即用：

```bash
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -e LLM_PROVIDER_URL=https://api.anthropic.com \
  -v ./data:/home/node/.agentx \
  deepracticexs/portagent:latest
```

打开 <http://localhost:5200> 开始对话！

![Portagent Demo](./apps/portagent/public/Portagent.gif)

### 开箱即用

- **多用户支持** - 用户注册（可选邀请码）
- **会话持久化** - 随时恢复对话
- **实时流式传输** - 基于 WebSocket 的通信
- **Docker 就绪** - 生产级健康检查

> **提示：** 添加 `-e INVITE_CODE_REQUIRED=true` 启用邀请码保护。

👉 **[完整 Portagent 文档](./apps/portagent/README.md)** - 配置、部署、API 参考

---

## 🛠️ 使用 AgentX 构建

AgentX 是一个基于事件驱动架构的 TypeScript 框架，用于构建 AI Agent 应用。

**服务端（Node.js）**

```typescript
import { createAgentX } from "agentxjs";

// 创建 AgentX 实例和 WebSocket 服务器
const agentx = await createAgentX({
  llm: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  },
  storage: { driver: "fs", path: "./data" },
});

// 创建容器
await agentx.request("container_create_request", {
  containerId: "default",
});

// 启动 WebSocket 服务器
await agentx.listen(5200);
console.log("✓ 服务器运行在 ws://localhost:5200");
```

**客户端（浏览器/React）**

```typescript
import { useAgentX } from "@agentxjs/ui";

function ChatApp() {
  const agentx = useAgentX("ws://localhost:5200");

  if (!agentx) return <div>连接中...</div>;

  return <Studio agentx={agentx} />;
}
```

**UI 组件**

```bash
npm install @agentxjs/ui
```

生产就绪的 React 组件（Tailwind CSS）：

- `<Studio>` - 完整聊天工作区（AgentList + Chat）
- `<Chat>` - 聊天界面和消息历史
- `<AgentList>` - Agent/会话列表（带搜索）
- `useAgentX()` - 服务器连接 React hook

👉 **[完整 AgentX 文档](./docs/README.md)** - 架构、API 参考、指南和示例

---

## 🏗️ 架构

事件驱动架构与分层设计：

```
服务端                           SYSTEMBUS                    客户端
═══════════════════════════════════════════════════════════════════════════

                                     ║
┌─────────────────┐                  ║
│  环境层         │                  ║
│  • LLMProvider  │      emit        ║
│  • Sandbox      │─────────────────>║
└─────────────────┘                  ║
                                     ║
                                     ║
┌─────────────────┐    subscribe     ║
│  Agent 层       │<─────────────────║
│  • AgentEngine  │                  ║
│  • Agent        │      emit        ║
│                 │─────────────────>║         ┌─────────────────┐
│  4 层事件       │                  ║         │                 │
│  • Stream       │                  ║ broadcast │  WebSocket   │
│  • State        │                  ║════════>│ (事件流)        │
│  • Message      │                  ║<════════│                 │
│  • Turn         │                  ║  input  │  AgentX API     │
└─────────────────┘                  ║         └─────────────────┘
                                     ║
                                     ║
┌─────────────────┐                  ║
│  运行时层       │                  ║
│                 │      emit        ║
│  • Persistence  │─────────────────>║
│  • Container    │                  ║
│  • WebSocket    │<─────────────────╫
│                 │─────────────────>║
└─────────────────┘                  ║
                                     ║
                              [ 事件总线 ]
                            [ RxJS Pub/Sub ]

事件流:
  → 输入:  客户端 → WebSocket → BUS → Claude SDK
  ← 输出: SDK → BUS → AgentEngine → BUS → 客户端
```

---

## 💬 关于

AgentX 处于早期开发阶段。我们欢迎您的想法、反馈和功能需求！

### 🌐 生态系统

Deepractice AI 开发生态的一部分：

- **[PromptX](https://github.com/Deepractice/PromptX)** - 提示词工程和管理框架
- **[DPML](https://github.com/Deepractice/dpml)** - Deepractice 标记语言（用于 AI 工作流）
- **[DARP](https://github.com/Deepractice/DARP)** - Deepractice Agent 运行时协议
- **[Lucid-UI](https://github.com/Deepractice/Lucid-UI)** - AI 驱动的 UI 组件库

### 📞 联系方式

<div align="center">
  <p><strong>联系创始人</strong></p>
  <p>📧 <a href="mailto:sean@deepractice.ai">sean@deepractice.ai</a></p>
  <img src="https://brands.deepractice.ai/images/sean-wechat-qrcode.jpg" alt="微信二维码" width="200"/>
  <p><em>扫码添加 Sean（创始人兼 CEO）微信</em></p>
</div>

---

<div align="center">
  <p>
    用 ❤️ 构建 by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
