# AgentImage 架构设计

## 背景

当前架构中，`AgentDefinition` 直接创建 `Agent` 实例，存在以下问题：

1. **Definition 无管理入口** - UI 需要展示可用 definitions，但没有统一的查询 API
2. **AgentRecord 存储冗余** - 每次创建 agent 都存储完整 definition JSON
3. **版本问题** - Session resume 时，如果 definition 更新了，行为会改变

## Docker 类比

| Docker     | AgentX          | 说明                 |
| ---------- | --------------- | -------------------- |
| Dockerfile | AgentDefinition | 开发者写的"源码"模板 |
| Image      | **AgentImage**  | 构建后的镜像，持久化 |
| Container  | Agent           | 运行中的实例         |

## 当前架构

```
AgentDefinition ──create──► Agent
                            │
                            └── Session (关联 agentId)
```

问题：

- definition 变了，resume 的 session 也跟着变
- 没有"构建"这个概念，无法固化配置

## 提议的架构

```
AgentDefinition ──build──► AgentImage ──run──► Agent
        │                      │                │
     (代码)                 (持久化)         (运行时)
                               │
                               └── Session (关联 imageId)
```

### 核心概念

```typescript
// 1. AgentDefinition - 开发者定义的模板（代码级别，不持久化）
interface AgentDefinition {
  name: string;
  description?: string;
  systemPrompt?: string;
}

// 2. AgentImage - 构建后的镜像（持久化）
interface AgentImage {
  imageId: string;
  definitionName: string;      // 来自哪个 definition
  definitionSnapshot?: {...};  // 可选：构建时的 definition 快照
  config: Record<string, unknown>;  // 构建时的配置
  createdAt: Date;
}

// 3. Agent - 运行中的实例
interface Agent {
  agentId: string;
  imageId: string;  // 关联 image
  // ... runtime 状态
}

// 4. Session - 关联 image 而非 agent
interface SessionRecord {
  sessionId: string;
  imageId: string;   // 改为关联 image
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### API 设计

```typescript
// Definition 管理（只读，从 Runtime 获取）
agentx.definitions.list(); // → AgentDefinition[]
agentx.definitions.get("Claude"); // → AgentDefinition | undefined

// Image 管理（持久化）
agentx.images.build(definition, config); // → AgentImage
agentx.images.get(imageId); // → AgentImage | undefined
agentx.images.list(); // → AgentImage[]
agentx.images.delete(imageId); // → void

// Session 关联 image
agentx.sessions.create(imageId); // → Session
session.resume(); // → Agent (从 image 启动)
```

### 用户流程

```typescript
// 1. 开发者注册 definitions（启动时）
runtime.registerDefinition(ClaudeAgent);
runtime.registerDefinition(GPTAgent);

// 2. 用户选择 definition，构建 image
const image = await agentx.images.build(ClaudeAgent, {
  apiKey: "xxx",
});

// 3. 用户创建 session（关联 image）
const session = await agentx.sessions.create(image.imageId);

// 4. 开始对话
const agent = await session.resume();
await agent.receive("Hello!");

// 5. 下次恢复（使用相同的 image 配置）
const session2 = await agentx.sessions.get(sessionId);
const agent2 = await session2.resume(); // 使用构建时的 image 配置
```

## 待讨论问题

### 1. AgentImage 是否就是 AgentRecord 改名？

当前 `AgentRecord` 存储：

- agentId, definition (JSON), config, lifecycle, createdAt, updatedAt

新的 `AgentImage` 存储：

- imageId, definitionName, definitionSnapshot?, config, createdAt

区别：

- AgentRecord 存完整 definition JSON
- AgentImage 只存 definitionName + 可选快照

### 2. 一个 Image 可以有多个 Session？

```
AgentImage (Claude + apiKey配置)
  ├── Session 1 (对话A)
  ├── Session 2 (对话B)
  └── Session 3 (对话C)
```

这意味着同一个"镜像"可以启动多个独立的对话，共享配置但独立历史。

### 3. Container 管理什么？

选项 A：只管理 Agent 实例（当前）

```typescript
container.register(agent);
container.get(agentId);
```

选项 B：也管理 AgentImage

```typescript
container.registerImage(image);
container.getImage(imageId);
container.registerAgent(agent);
container.getAgent(agentId);
```

### 4. Definition 注册时机

选项 A：Runtime 构造时

```typescript
const runtime = new NodeRuntime({
  definitions: [ClaudeAgent, GPTAgent],
});
```

选项 B：运行时注册

```typescript
runtime.registerDefinition(ClaudeAgent);
```

### 5. 是否需要 definitionSnapshot？

如果存快照：

- 优点：Session resume 时使用创建时的 definition 版本
- 缺点：存储冗余

如果不存快照：

- 优点：简单，存储小
- 缺点：definition 更新会影响已有 session

## 实现计划

1. **Phase 1**: Definition 管理
   - Runtime 添加 registerDefinition/getDefinition/listDefinitions
   - AgentX 添加 definitions API

2. **Phase 2**: AgentImage 概念
   - 新增 AgentImage 类型
   - Repository 添加 image 相关方法
   - AgentRecord → AgentImage 迁移

3. **Phase 3**: Session 关联调整
   - SessionRecord.agentId → SessionRecord.imageId
   - Session.resume() 从 image 获取 definition

## 相关改动

本次 Session 简化改动（已完成）：

- 删除 SessionStatus，Session 只是历史记录容器
- Session 添加 title, updatedAt, setTitle()
- UI SessionItem 简化

这些改动为 AgentImage 架构奠定基础。
