# 026: Three-Layer Architecture - Structure, Process, Relation

## 哲学基础

AgentX 类型系统基于三个本体论范畴：

| 范畴     | 层次        | 本质           | 协议             |
| -------- | ----------- | -------------- | ---------------- |
| **结构** | Application | 静态形式、蓝图 | HTTP             |
| **过程** | Ecosystem   | 动态活动、生命 | WebSocket Event  |
| **关系** | Network     | 连接、通信     | HTTP + WebSocket |

### 结构 (Application)

结构是**静态的形式**，是事物的定义和规范：

- Definition - 定义模板（如 Dockerfile）
- Image - 构建产物（如 Docker Image）
- User - 用户身份
- Manager - API 接口

结构本身不变化，只能被 CRUD。

### 过程 (Ecosystem)

过程是**动态的活动**，是生命的展开：

- Agent - 智能体（对话、思考、行动）
- Session - 会话（记忆的延续）
- Container - 容器（隔离的环境）
- Event - 事件（状态的变迁）

过程是实时的、流动的、不可逆的。

### 关系 (Network)

关系是**连接的纽带**，是个体与整体的桥梁：

- Server - 监听（等待连接）
- Client - 连接（建立关系）
- Channel - 通道（双向通信）
- Endpoint - 端点（API 契约）

关系使孤立的个体成为互联的整体。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│   (AgentX API, Definition, Image, User)                     │
│   本质: 结构 - 静态形式                                       │
│   协议: HTTP (CRUD)                                         │
├─────────────────────────────────────────────────────────────┤
│                    Network Layer                            │
│   (Server, Client, Channel, Endpoints)                      │
│   本质: 关系 - 连接纽带                                       │
│   协议: HTTP + WebSocket                                    │
├─────────────────────────────────────────────────────────────┤
│                    Ecosystem Layer                          │
│   (Runtime, Container, Session, Agent)                      │
│   本质: 过程 - 动态活动                                       │
│   协议: WebSocket Events                                    │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
packages/types/src/
├── application/          # 结构层 (Structure)
│   ├── spec/             # Definition, Image
│   ├── agentx/           # Managers
│   ├── user/             # User types
│   ├── common/           # Utilities
│   ├── error/            # Error types
│   └── guards/           # Type guards
│
├── network/              # 关系层 (Relation)
│   ├── server/           # ChannelServer
│   ├── client/           # ChannelClient
│   ├── channel/          # Channel
│   └── endpoint/         # HTTP Endpoints
│
└── ecosystem/            # 过程层 (Process)
    ├── agent/            # Agent, Message, Events
    ├── session/          # Session
    ├── container/        # Container, Sandbox
    ├── repository/       # Storage
    ├── receptors/        # Event receptors
    └── event/            # Runtime events
```

## 协议分层

### HTTP (Application Layer)

静态资源 CRUD，无状态：

```typescript
// Definition
GET    /definitions
POST   /definitions
DELETE /definitions/:name

// Image
GET    /images
DELETE /images/:imageId
```

### WebSocket (Network + Ecosystem)

实时双向通信，有状态：

```typescript
// Network: 建立连接
Channel.connect()
Channel.disconnect()

// Ecosystem: 事件流
{ type: "session_created", data: { sessionId } }
{ type: "agent_started", data: { agentId } }
{ type: "text_delta", data: { text } }
```

## 三层 Ecosystem

从生态系统视角，存在三层嵌套：

```
Network Ecosystem
└── Runtime Ecosystem
    └── Agent Ecosystem
```

- **Network Ecosystem** - 节点互联（Server/Client 组成网络）
- **Runtime Ecosystem** - 资源隔离（Container/Session 管理 Agent）
- **Agent Ecosystem** - 智能活动（Message/Event 驱动对话）

每一层都是一个 Ecosystem，有自己的：

- Receptor - 感知外部信号
- Effector - 发出内部事件
- Event - 状态变迁

## 同构性

**Ecosystem 层是同构主体**：

| 环境    | Runtime        | 实现              |
| ------- | -------------- | ----------------- |
| Node.js | Local Runtime  | 直接执行 Agent    |
| Browser | Remote Runtime | 通过 Channel 代理 |

Application 层不同构（Node.js 有 Server，Browser 有 Client）。
Network 层提供桥梁（Channel 连接两端）。

## 哲学意义

这三层架构对应了认识事物的三个维度：

1. **结构** - 事物是什么（What）
2. **过程** - 事物如何运作（How）
3. **关系** - 事物如何关联（With）

AgentX 不仅是技术架构，也是一种世界观的映射。
