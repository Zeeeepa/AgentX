# 057 - createAgentX 统一入口：Driver 与 Provider 分离

## 背景

当前架构中，`createDriver` 工厂函数耦合在 `AgentXProvider` 内部：

```
NodeProvider = Repositories + EventBus + createDriver(耦合)
```

用户使用 AgentX 需要经过 Provider → Server → Client 的完整链路，即使只是本地跑一个简单对话也需要起 Server。

## 目标

`createAgentX` 成为统一入口，支持本地模式和远程模式：

```typescript
// 本地模式：Driver + Provider 分开注入
const agentx = await createAgentX({
  apiKey: "sk-xxx",
  provider: "anthropic",
});

// 远程模式：Server 是 Driver + Provider 的合体
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
});
```

两种模式暴露相同的 `AgentX` 接口。

## 核心设计

### 1. Driver 与 Provider 平级，分开注入

当前：

```
AgentXProvider {
  repositories    // 持久化
  eventBus        // 事件
  createDriver    // LLM 通信 ← 耦合在 Provider 里
}
```

改为：

```
AgentXProvider {
  repositories    // 持久化
  eventBus        // 事件
}

Driver            // LLM 通信，独立注入
```

`AgentXProvider` 不再持有 `createDriver`。Driver 和 Provider 是两个独立的能力维度：

- **Driver** — 跟 LLM 对话（MonoDriver、ClaudeDriver）
- **Provider** — 持久化数据（NodeProvider、MemoryProvider）

### 2. createAgentX 配置

```typescript
interface AgentXConfig {
  // ===== 本地模式 =====

  /** API key (有此字段 → 本地模式) */
  apiKey?: string;

  /** LLM 提供商 */
  provider?: MonoProvider;  // "anthropic" | "openai" | "google" | ...

  /** Model ID */
  model?: string;

  /** Base URL (代理/私有部署) */
  baseUrl?: string;

  /** 数据存储路径 (默认内存) */
  dataPath?: string;

  // ===== 远程模式 =====

  /** Server URL (有此字段 → 远程模式) */
  serverUrl?: string;

  /** 认证头 */
  headers?: MaybeAsync<Record<string, string>>;

  /** 业务上下文 */
  context?: MaybeAsync<Record<string, unknown>>;
}
```

模式判断：
- `serverUrl` 存在 → **远程模式**（RemoteClient，走 WebSocket）
- `apiKey` 存在 → **本地模式**（LocalClient，内嵌 Runtime + MonoDriver）

### 3. 本地模式内部结构

```
createAgentX({ apiKey, provider: "anthropic" })
  │
  ├─ createMonoDriver({ apiKey, provider })     ← Driver
  ├─ createNodeProvider({ dataPath })            ← Provider (无 createDriver)
  ├─ createAgentXRuntime(provider, createDriver) ← Runtime 接收两个参数
  │
  └─ return LocalClient (implements AgentX)
```

`LocalClient` 实现 `AgentX` 接口，直接调用 Runtime，不经过网络。

### 4. Server 基于 createAgentX 构建

```typescript
// 改造前
const server = createServer({
  provider: await createNodeProvider({ createDriver }),
  port: 5200,
});

// 改造后
const server = createServer({
  apiKey: "sk-xxx",
  provider: "anthropic",
  port: 5200,
});
// 内部：createAgentX(本地模式) + WebSocket 层
```

Server 变成：**本地 AgentX + WebSocket 传输层**。

### 5. 远程模式 = Driver + Provider 的合体

远程模式下，Server 端同时提供了：
- Driver 能力（LLM 对话）→ 通过 `message.send` RPC
- Provider 能力（持久化）→ 通过 `container.*`, `image.*`, `agent.*` RPC

客户端不需要知道这些是怎么实现的，只需要一个 `serverUrl`。

## 改动范围

### Phase 1：Provider 解耦 createDriver

1. **`core/runtime/types.ts`** — `AgentXProvider` 移除 `createDriver` 字段
2. **`core/runtime/AgentXRuntime.ts`** — `createAgentXRuntime(provider, createDriver)` 接收两个参数
3. **`node-provider`** — `createNodeProvider` 不再接受 `createDriver` 选项
4. **`server`** — 适配新的 Runtime 创建方式

### Phase 2：createAgentX 本地模式

5. **`agentx`** — 新增 `LocalClient` 实现
6. **`agentx`** — `createAgentX` 支持本地模式配置
7. **`agentx`** — 本地模式自动创建 NodeProvider + MonoDriver + Runtime

### Phase 3：Server 改造

8. **`server`** — 基于 createAgentX 本地模式重构
9. **`server`** — 只保留 WebSocket 传输层逻辑

## API 示例

### 最简用法（本地）

```typescript
import { createAgentX } from "agentxjs";

const agentx = await createAgentX({
  apiKey: process.env.ANTHROPIC_API_KEY,
  provider: "anthropic",
});

const container = await agentx.createContainer("my-app");
const { record: image } = await agentx.createImage({
  containerId: "my-app",
  systemPrompt: "You are helpful",
});
const { agentId } = await agentx.createAgent({ imageId: image.imageId });

agentx.on("text_delta", (e) => process.stdout.write(e.data.text));
await agentx.sendMessage(agentId, "Hello!");
```

### Server 部署

```typescript
import { createServer } from "@agentxjs/server";

const server = createServer({
  apiKey: process.env.ANTHROPIC_API_KEY,
  provider: "anthropic",
  port: 5200,
});

await server.listen();
```

### 客户端连接

```typescript
import { createAgentX } from "agentxjs";

const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
});
```

## 验收标准

- [ ] `AgentXProvider` 不再包含 `createDriver`
- [ ] `createAgentXRuntime` 接受独立的 `createDriver` 参数
- [ ] `createAgentX({ apiKey })` 本地模式可用
- [ ] `createAgentX({ serverUrl })` 远程模式不受影响
- [ ] `createServer` 内部基于本地模式 AgentX
- [ ] 现有 BDD 测试全部通过
- [ ] MonoDriver 作为本地模式默认 Driver
