# 架构设计

本文档介绍 Portagent 的系统架构、数据模型和 API 设计。

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           浏览器                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  LoginPage  │  │ RegisterPage │  │  ChatPage   │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
│         │                │                │                          │
│         └────────────────┼────────────────┘                          │
│                          │                                           │
│                    ┌─────▼─────┐                                     │
│                    │ AuthContext│ (React Context)                    │
│                    └─────┬─────┘                                     │
│                          │                                           │
│              ┌───────────┴───────────┐                               │
│              │                       │                               │
│         HTTP │                  WebSocket                            │
│              │                       │                               │
└──────────────┼───────────────────────┼───────────────────────────────┘
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Portagent Server                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Hono HTTP Server                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │   /health  │  │ /api/auth/* │  │    /agentx/*          │  │   │
│  │  │  (public)  │  │  (public)   │  │ (auth required)       │  │   │
│  │  └────────────┘  └──────┬─────┘  └──────────┬─────────────┘  │   │
│  │                         │                   │                 │   │
│  │                   ┌─────▼─────┐       ┌─────▼─────┐          │   │
│  │                   │ authRoutes │       │authMiddleware│       │   │
│  │                   └─────┬─────┘       └───────────┘          │   │
│  │                         │                                     │   │
│  │                   ┌─────▼─────┐                               │   │
│  │                   │UserRepository│                            │   │
│  │                   └─────┬─────┘                               │   │
│  │                         │                                     │   │
│  │                   ┌─────▼─────┐                               │   │
│  │                   │portagent.db│                              │   │
│  │                   └───────────┘                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                         AgentX                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │WebSocket /ws│  │ Containers │  │       Images          │  │   │
│  │  └──────┬─────┘  └──────┬─────┘  └──────────┬─────────────┘  │   │
│  │         │               │                    │                │   │
│  │         └───────────────┴────────────────────┘                │   │
│  │                         │                                     │   │
│  │                   ┌─────▼─────┐                               │   │
│  │                   │ agentx.db │                               │   │
│  │                   └───────────┘                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Claude API        │
                    │   (Anthropic)       │
                    └─────────────────────┘
```

### 三层架构

| 层         | 组件                 | 职责                         |
| ---------- | -------------------- | ---------------------------- |
| **表示层** | React 前端           | 用户界面、认证状态管理       |
| **业务层** | Hono Server + AgentX | HTTP 路由、认证、Agent 管理  |
| **数据层** | SQLite               | 用户数据、会话数据、事件存储 |

---

## 服务端架构

### 核心模块

```
src/server/
├── index.ts           # 服务器入口，路由配置
├── main.ts            # 开发入口（加载 .env）
├── auth.ts            # 认证模块（JWT、邀请码）
├── logger.ts          # 日志模块（LogTape 适配）
├── defaultAgent.ts    # 默认 Agent 配置
├── database/
│   ├── index.ts       # 数据库导出
│   └── SQLiteUserRepository.ts  # 用户数据访问
└── user/
    ├── types.ts       # 用户类型定义
    ├── UserRepository.ts  # 用户仓库接口
    └── index.ts       # 用户模块导出
```

### 请求处理流程

```
HTTP Request
     │
     ▼
┌─────────────┐
│    CORS     │  允许跨域请求
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│                    路由分发                       │
├──────────────┬──────────────┬───────────────────┤
│   /health    │  /api/auth/* │    /agentx/*      │
│   (公开)      │   (公开)      │  (需要认证)        │
└──────────────┴──────┬───────┴────────┬──────────┘
                      │                │
                      ▼                ▼
               ┌──────────┐     ┌─────────────┐
               │authRoutes│     │authMiddleware│
               └──────────┘     └──────┬──────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ AgentX Routes │
                                └──────────────┘
```

### WebSocket 处理

WebSocket 连接由 AgentX 在 `/ws` 路径处理：

```typescript
const agentx = await createAgentX({
  llm: { apiKey, baseUrl, model },
  server, // HTTP server 实例
  // WebSocket 自动在 /ws 路径启用
});
```

---

## User-Container 关系模型

### 概念

每个用户拥有专属的 Container，Container 是 Agent 的隔离边界。

```
┌─────────────────────────────────────────────────────────┐
│                      User (john)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Container (user-uuid-xxx)             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │  │
│  │  │  Image  │  │  Image  │  │  Image  │           │  │
│  │  │  (助手)  │  │ (代码)   │  │ (翻译)  │           │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘           │  │
│  │       │            │            │                 │  │
│  │  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐           │  │
│  │  │ Session │  │ Session │  │ Session │           │  │
│  │  │  (会话)  │  │  (会话)  │  │  (会话)  │           │  │
│  │  └─────────┘  └─────────┘  └─────────┘           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 数据流

1. **注册时**: 创建 User 记录 → 创建 Container → 关联 `containerId`
2. **登录后**: 返回 `containerId` 给前端
3. **创建会话**: 前端使用 `containerId` 创建 Image/Session

### 代码实现

```typescript
// 注册时创建 Container
const containerId = `user-${crypto.randomUUID()}`;
const containerRes = await agentx.request("container_create_request", { containerId });

// 创建用户时关联 Container
const user = await userRepository.createUser({
  username,
  password,
  containerId,
  // ...
});
```

---

## 数据库 Schema

### portagent.db（用户数据）

```sql
CREATE TABLE users (
  userId TEXT PRIMARY KEY,            -- UUID
  username TEXT UNIQUE NOT NULL,      -- 登录用户名
  email TEXT UNIQUE NOT NULL,         -- 邮箱
  passwordHash TEXT NOT NULL,         -- bcrypt 哈希
  containerId TEXT NOT NULL,          -- 关联的 Container ID
  displayName TEXT,                   -- 显示名称
  avatar TEXT,                        -- 头像 URL
  isActive INTEGER NOT NULL DEFAULT 1,-- 账户状态
  createdAt INTEGER NOT NULL,         -- 创建时间戳
  updatedAt INTEGER NOT NULL          -- 更新时间戳
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_containerId ON users(containerId);
```

### agentx.db（AgentX 数据）

由 AgentX 管理，包含：

- `containers` - 容器记录
- `images` - 镜像记录
- `sessions` - 会话记录
- `messages` - 消息记录

---

## API 端点

### 公开端点

| 方法 | 路径                 | 说明                   |
| ---- | -------------------- | ---------------------- |
| GET  | `/health`            | 健康检查               |
| GET  | `/api/auth/config`   | 获取认证配置           |
| POST | `/api/auth/register` | 用户注册               |
| POST | `/api/auth/login`    | 用户登录               |
| POST | `/api/auth/logout`   | 用户登出（客户端操作） |

### 受保护端点

| 方法 | 路径               | 说明           |
| ---- | ------------------ | -------------- |
| GET  | `/api/auth/verify` | 验证 Token     |
| GET  | `/agentx/info`     | 获取平台信息   |
| WS   | `/ws`              | WebSocket 连接 |

### 健康检查

```
GET /health

Response:
{
  "status": "ok",
  "timestamp": 1736899200000
}
```

### 认证配置

```
GET /api/auth/config

Response:
{
  "inviteCodeRequired": true
}
```

### 平台信息

```
GET /agentx/info
Authorization: Bearer <token>

Response:
{
  "version": "0.1.0",
  "wsPath": "/ws"
}
```

---

## WebSocket 协议

### 连接

```javascript
const token = getAuthToken();
const ws = new WebSocket(`ws://localhost:5200/ws?token=${token}`);
```

### 消息格式

AgentX 使用 JSON-RPC 风格的消息格式：

**请求**:

```json
{
  "id": "req-uuid",
  "type": "agent_receive_request",
  "data": {
    "agentId": "agent-uuid",
    "content": "Hello!"
  }
}
```

**响应**:

```json
{
  "id": "req-uuid",
  "type": "agent_receive_response",
  "data": {
    "success": true
  }
}
```

**事件**:

```json
{
  "type": "text_delta",
  "data": {
    "text": "Hello"
  },
  "context": {
    "agentId": "agent-uuid",
    "sessionId": "session-uuid"
  }
}
```

### 事件类型

| 事件类型           | 说明         |
| ------------------ | ------------ |
| `message_start`    | 消息开始     |
| `text_delta`       | 文本增量     |
| `tool_use_start`   | 工具调用开始 |
| `tool_result`      | 工具结果     |
| `message_stop`     | 消息结束     |
| `conversation_end` | 对话结束     |

---

## 前端架构

### 组件结构

```
src/client/
├── main.tsx           # 应用入口
├── App.tsx            # 路由配置
├── input.css          # Tailwind 入口
├── hooks/
│   └── useAuth.tsx    # 认证 Hook
└── pages/
    ├── LoginPage.tsx  # 登录页
    ├── RegisterPage.tsx  # 注册页
    └── ChatPage.tsx   # 聊天页（主界面）
```

### 路由设计

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/studio" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
  <Route path="/" element={<Navigate to="/studio" />} />
  <Route path="*" element={<Navigate to="/studio" />} />
</Routes>
```

### 认证上下文

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: UserInfo | null;
  login: (usernameOrEmail: string, password: string) => Promise<Result>;
  register: (username: string, password: string, inviteCode: string, ...) => Promise<Result>;
  logout: () => void;
}
```

### UI 组件

ChatPage 使用 `@agentxjs/ui` 的 `ResponsiveStudio` 组件：

```typescript
<ResponsiveStudio agentx={agentx} containerId={user.containerId} />
```

---

## 日志架构

### LogTape 集成

Portagent 使用 LogTape 作为日志后端：

```typescript
const loggerFactory = new LogTapeLoggerFactory({
  level: logLevel, // debug/info/warn/error
  logDir: paths.logsDirPath,
  pretty: process.env.NODE_ENV !== "production",
});
```

### 日志输出

- **控制台**: 格式化输出（开发环境）
- **文件**: 轮转日志（生产环境）
  - 最大 10MB 每文件
  - 保留 7 个文件

### 日志级别映射

| AgentX 级别 | LogTape 级别 |
| ----------- | ------------ |
| debug       | debug        |
| info        | info         |
| warn        | warning      |
| error       | error        |

---

## 构建产物

### 目录结构

```
dist/
├── bin/                      # 平台二进制
│   ├── portagent-darwin-arm64
│   ├── portagent-darwin-x64
│   ├── portagent-linux-x64
│   ├── portagent-linux-arm64
│   └── portagent-windows-x64.exe
├── public/                   # 静态资源
│   ├── index.html
│   ├── favicon.svg
│   └── assets/
│       ├── main-[hash].js
│       └── styles.css
├── claude-code/              # Claude Code SDK
└── cli.js                    # CLI 入口
```

### 构建流程

1. **前端构建**: Bun 打包 React 应用
2. **CSS 生成**: PostCSS + Tailwind
3. **二进制构建**: Bun --compile 生成各平台二进制
4. **Claude Code 打包**: 复制 SDK 到 dist

---

## 扩展点

### 自定义 Agent

修改 `src/server/defaultAgent.ts`：

```typescript
export const defaultAgent: AgentDefinition = {
  name: "CustomAssistant",
  systemPrompt: "Your custom system prompt",
  mcpServers: {
    // 添加自定义 MCP 服务器
  },
};
```

### 添加路由

在 `src/server/index.ts` 中：

```typescript
// 公开路由
app.get("/api/custom", (c) => c.json({ data: "custom" }));

// 受保护路由
app.use("/api/protected/*", authMiddleware);
app.get("/api/protected/data", (c) => {
  const userId = c.get("userId");
  return c.json({ userId });
});
```

---

## 下一步

- 查看 [开发指南](./development.md) 了解本地开发
- 查看 [运维指南](./operations.md) 了解生产运维
