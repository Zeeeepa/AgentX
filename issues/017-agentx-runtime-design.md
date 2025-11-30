# AgentX Runtime 设计讨论

## 背景

### 商业模式驱动

核心理念：**极致的成本低**

```
传统智能体产品商 (Coze/Dify)
  Token × 1.3 + 平台费 $20-50/月
  功能多，但贵

我们的定位
  Token × 1.05 + $0
  功能一样多，但便宜 → 靠运维成本极低实现

LLM 代理商 (OpenRouter)
  Token × 1.1
  便宜，但没有智能体功能
```

**本质**：不是卖智能体产品，是卖 LLM Token。智能体功能免费送,只收 Token 钱。运维成本压到极致 = 价格可以比任何人低。

### 技术目标

基于 Cloudflare 全家桶（Workers + R2 + D1 + KV + Containers）构建百万级用户平台，月成本控制在 $200 以内。

关键策略：

- 分层执行：能用 Workers（免费）就不用 Container
- Container 按需启动、用完即销
- 智能调度：自动选择最便宜的执行方式

## 核心设计：两层架构

### 设计决策

从 ClaudeConfig 分析 Agent 真正需要的资源，区分**业务组件**和**资源组件**：

- **业务组件**：Agent 特有的逻辑（Driver, Presenter, Middleware）
- **资源组件**：基础设施能力（LLM, 文件系统, 进程执行）

资源组件应该放到 Runtime 管理，形成两层架构：

```
┌─────────────────────────────────────────────────────────────┐
│  Sandbox 层（环境抽象）                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ NodeRuntime │  │  Workspace  │  │   Browser   │         │
│  │             │  │             │  │   Runtime   │         │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘         │
│         │                │                                  │
│         │    组合        │                                  │
└─────────┼────────────────┼──────────────────────────────────┘
          ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│  Resource 层（原子资源）                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │LLMProvider│  │FileSystem │  │   Disk    │  │   Env    │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
│  ┌───────────┐                                              │
│  │  Process  │                                              │
│  └───────────┘                                              │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│  底层（OS / Cloud）                                          │
│  本地: node:fs, child_process, process.env                  │
│  云端: R2, Containers, KV, Workers Secrets                  │
└─────────────────────────────────────────────────────────────┘
```

### Resource 层

原子的、可替换的资源。接口固定，实现可换。

| 资源        | 职责       | 本地实现      | 云端实现        |
| ----------- | ---------- | ------------- | --------------- |
| LLMProvider | 大模型供应 | API Key       | Workers Secrets |
| FileSystem  | 文件操作   | node:fs       | R2              |
| Disk        | 存储挂载   | 本地目录      | R2 挂载         |
| Env         | 环境变量   | process.env   | KV / Secrets    |
| Process     | 命令执行   | child_process | Containers      |

### Sandbox 层（TODO）

组合 Resource，形成具体执行环境：

- **NodeRuntime**：组合 FileSystem + Env + Process，提供 Node.js 执行环境，包括 cwd
- **Workspace**：组合 FileSystem，提供业务级文件管理（temp, projects, output）

## 已完成

### 1. Resource 层类型定义

位置：`packages/agentx-types/src/runtime/resource/`

```
runtime/
├── index.ts
└── resource/
    ├── index.ts
    ├── LLMProvider.ts   # 大模型供应（泛型，Supply 可自定义）
    ├── FileSystem.ts    # 文件操作接口（固定，类似 node:fs）
    ├── Disk.ts          # 存储挂载（mount/unmount）
    ├── Env.ts           # 环境变量（get/getAll）
    └── Process.ts       # 命令执行（exec）
```

### 2. 接口设计

**LLMProvider** - 泛型，因为供应物不确定（可以是 apiKey、client、token）

```typescript
interface LLMProvider<TSupply = unknown> {
  readonly name: string;
  provide(): TSupply;
}
```

**FileSystem** - 固定接口，fs API 几十年没变

```typescript
interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  rm(path: string, options?: { recursive?: boolean }): Promise<void>;
  // ...
}
```

**Disk** - 挂载接口

```typescript
interface Disk {
  readonly name: string;
  mount(): Promise<string>; // 返回挂载路径
  unmount(): Promise<void>;
}
```

**Env** - 环境变量

```typescript
interface Env {
  get(key: string): Promise<string | undefined>;
  getAll(): Promise<Record<string, string>>;
}
```

**Process** - 命令执行

```typescript
interface Process {
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;
}
```

### 3. 重命名 llm/LLMProvider → llm/LLM

避免与 runtime/LLMProvider 冲突：

- `llm/LLM` - 大模型定义（能力描述：supportsStreaming, supportsTools...）
- `runtime/LLMProvider` - 大模型供应服务（提供 apiKey, baseUrl...）

## 分层执行策略

有了资源抽象后，Driver 可以上云：

| 场景     | 运行环境  | 资源需求    |
| -------- | --------- | ----------- |
| 纯对话   | Workers   | LLMProvider |
| 工具调用 | Container | 全部资源    |

- **Workers**：轻量 Driver（直接调 API，不用 Claude SDK）
- **Container**：完整 Driver（Claude SDK + 所有资源）

Claude SDK 本身依赖 node:fs 和 child_process，不能直接跑在 Workers。

## 下一步

- [ ] 设计 Sandbox 层（NodeRuntime, Workspace）
- [ ] Resource 层实现（LocalFileSystem, LocalDisk, LocalEnv, LocalProcess）
- [ ] 集成到 ClaudeDriver
- [ ] Workers 轻量 Driver 实现

## 相关文件

- `packages/agentx-types/src/runtime/` - Runtime 类型定义
- `packages/agentx-runtime/` - Runtime 实现（TODO）
- `packages/agentx-agent/` - Agent 运行时
- `packages/agentx-claude/` - Claude Driver

## 日期

2024-11-30（更新）
