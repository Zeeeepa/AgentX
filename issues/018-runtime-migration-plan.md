# Issue 018: Runtime Layer Migration Plan

## Overview

This document outlines the migration plan from the current AgentContainer-based architecture to the new Container → Agent → Sandbox architecture.

## Architecture Summary

### New Architecture

```
┌─────────────────────────────────────────────────┐
│                  Container                       │
│  ┌───────────────────────────────────────────┐  │
│  │  Agent 1 ──────→ Sandbox 1 (OS + LLM)     │  │
│  │  Agent 2 ──────→ Sandbox 2 (OS + LLM)     │  │
│  │  Agent 3 ──────→ Sandbox 3 (OS + LLM)     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Concepts:**

- **Container**: Manages multiple Agents (1:N), platform abstraction
- **Agent**: Holds Sandbox reference, business logic
- **Sandbox**: Pure resource isolation (OS + LLM)

### Type Hierarchy

```
runtime/
├── container/
│   └── Container.ts       # Agent lifecycle management
└── sandbox/
    ├── Sandbox.ts         # OS + LLM resource isolation
    ├── os/
    │   ├── OS.ts          # Combined OS interface
    │   ├── FileSystem.ts  # File operations
    │   ├── Process.ts     # Command execution
    │   ├── Env.ts         # Environment variables
    │   └── Disk.ts        # Storage mounting
    └── llm/
        └── LLMProvider.ts # LLM supply service
```

## Completed Work

### Phase 0: Type Definitions (DONE)

- [x] Create `runtime/container/Container.ts`
- [x] Create `runtime/sandbox/Sandbox.ts`
- [x] Create `runtime/sandbox/os/` (FileSystem, Process, Env, Disk, OS)
- [x] Create `runtime/sandbox/llm/LLMProvider.ts`
- [x] Add `sandbox` field to `Agent` interface
- [x] Rename `llm/LLMProvider` to `llm/LLM` (model definition)

### Phase 1-6: Runtime Migration (DONE - 2024-11-30)

**Major architectural changes completed:**

- [x] **Unified Runtime API**: `createAgentX(runtime)` works for both server and browser
- [x] **Simplified AgentDefinition**: Only `name`, `description`, `systemPrompt` (removed driver, config, presenters)
- [x] **Runtime collects config from environment**: apiKey, baseUrl, model from env vars
- [x] **Deleted agentx-adk package**: Moved `defineAgent` to `agentx`
- [x] **Renamed agentx-claude to agentx-runtime**: Contains `NodeRuntime` and `ClaudeDriver`
- [x] **Created SSERuntime for browser**: Replaces `createRemoteAgent`
- [x] **Deleted redundant files**: createRemoteAgent, RemoteAgent, AgentXClient, SSEClientTransport

**Final Architecture - "Define Once, Run Anywhere":**

```typescript
// Server (Node.js)
import { createAgentX, defineAgent } from "agentxjs";
import { runtime } from "@agentxjs/node-runtime";

const MyAgent = defineAgent({
  name: "Assistant",
  systemPrompt: "You are a helpful assistant",
});

const agentx = createAgentX(runtime);
const agent = agentx.agents.create(MyAgent);

// Browser
import { createAgentX, defineAgent } from "agentxjs";
import { createSSERuntime } from "agentxjs/client";

const MyAgent = defineAgent({
  name: "Assistant",
  systemPrompt: "You are a helpful assistant",
});

const runtime = createSSERuntime({ serverUrl: "http://...", agentId });
const agentx = createAgentX(runtime);
const agent = agentx.agents.create(MyAgent); // Same API!
```

**Package Structure After Migration:**

```
packages/
├── agentx-types/           # Type definitions
│   └── src/
│       ├── agent/
│       │   ├── AgentDefinition.ts  # Simplified: name, description, systemPrompt
│       │   └── AgentConfig.ts      # Empty (for future use)
│       ├── agentx/
│       │   └── defineAgent.ts      # Type for defineAgent
│       └── runtime/
│           ├── Runtime.ts          # Runtime interface
│           ├── RuntimeDriver.ts    # Driver interface with sandbox
│           ├── container/
│           └── sandbox/
│
├── agentx/                 # Core API
│   └── src/
│       ├── defineAgent.ts          # defineAgent implementation
│       ├── AgentX.ts               # createAgentX(runtime)
│       ├── managers/
│       │   └── agent/AgentManager.ts  # Uses runtime.createDriver()
│       └── client/
│           ├── SSERuntime.ts       # Browser Runtime
│           └── SSEDriver.ts        # SSE Driver for browser
│
├── agentx-runtime/            # Node.js Runtime (was agentx-claude)
│   └── src/
│       ├── NodeRuntime.ts          # Runtime implementation
│       ├── ClaudeDriver.ts         # Claude SDK driver
│       └── index.ts                # exports runtime singleton
│
└── [DELETED]
    ├── agentx-adk/         # Merged into agentx
    ├── agentx-runtime/     # Merged into agentx-runtime
    └── agentx-claude/      # Renamed to agentx-runtime
```

**Key Design Principles:**

1. **AgentDefinition = Business Config**: name, description, systemPrompt
2. **RuntimeConfig = Infrastructure Config**: apiKey, baseUrl, model (from env vars)
3. **Runtime.createDriver()**: Merges AgentDefinition + RuntimeConfig → Driver
4. **Two Developer Roles**:
   - Application Developer: Uses `agentx` package (defineAgent, createAgentX)
   - Platform Developer: Implements `Runtime` interface

## Original Migration Plan (Superseded)

### Phase 1: Implement Local Sandbox

**Location**: `packages/agentx-runtime/`

**Tasks:**

1. Create `LocalFileSystem` implementation (using `node:fs`)
2. Create `LocalProcess` implementation (using `node:child_process`)
3. Create `LocalEnv` implementation (using `process.env`)
4. Create `LocalDisk` implementation (local directory mounting)
5. Create `LocalOS` combining all above
6. Create `LocalLLMProvider` implementation
7. Create `LocalSandbox` combining OS + LLM

**Structure:**

```
packages/agentx-runtime/
├── src/
│   ├── sandbox/
│   │   ├── LocalSandbox.ts
│   │   ├── os/
│   │   │   ├── LocalFileSystem.ts
│   │   │   ├── LocalProcess.ts
│   │   │   ├── LocalEnv.ts
│   │   │   ├── LocalDisk.ts
│   │   │   └── LocalOS.ts
│   │   └── llm/
│   │       └── LocalLLMProvider.ts
│   └── index.ts
```

### Phase 2: Update AgentInstance

**Location**: `packages/agentx-agent/src/agent/AgentInstance.ts`

**Tasks:**

1. Add `sandbox` property to `AgentInstance`
2. Update constructor to accept `Sandbox`
3. Pass `sandbox` to Driver via `AgentContext`
4. Update Driver interface if needed

**Changes:**

```typescript
// Before
export class AgentInstance implements Agent {
  constructor(
    definition: AgentDefinition,
    context: AgentContext,
    engine: AgentEngine
  ) { ... }
}

// After
export class AgentInstance implements Agent {
  readonly sandbox: Sandbox;

  constructor(
    definition: AgentDefinition,
    context: AgentContext,
    engine: AgentEngine,
    sandbox: Sandbox  // New parameter
  ) {
    this.sandbox = sandbox;
    // Pass sandbox to context for Driver access
  }
}
```

### Phase 3: Update LocalAgentManager

**Location**: `packages/agentx/src/managers/agent/LocalAgentManager.ts`

**Tasks:**

1. Create `Sandbox` when creating `Agent`
2. Pass `Sandbox` to `AgentInstance` constructor
3. Optionally support `Sandbox` configuration in `create()` method

**Changes:**

```typescript
// Before
create(definition, config): Agent {
  const agent = new AgentInstance(definition, context, engine);
  this.container.register(agent);
  return agent;
}

// After
create(definition, config, sandboxConfig?): Agent {
  // Create sandbox with OS + LLM resources
  const sandbox = this.createSandbox(config, sandboxConfig);
  const agent = new AgentInstance(definition, context, engine, sandbox);
  this.container.register(agent);
  return agent;
}
```

### Phase 4: Container Injection (Optional)

**Location**: `packages/agentx/src/AgentX.ts`

**Tasks:**

1. Support `Container` injection in `createAgentX()`
2. Different `Container` implementations for different platforms
3. Deprecate or remove `AgentContainer` interface

**Changes:**

```typescript
// Support container injection
function createAgentX(options?: AgentXOptions): AgentX {
  const container = options?.container ?? new LocalContainer();
  // ...
}

// Platform examples
createAgentX({ container: new LocalContainer() });
createAgentX({ container: new DockerContainer() });
createAgentX({ container: new CloudflareContainer() });
```

### Phase 5: Driver Updates

**Location**: `packages/agentx-claude/src/ClaudeDriver.ts`

**Tasks:**

1. Access LLM config from `context.sandbox.llm` instead of `context.config`
2. Use `sandbox.os` for file/process operations if needed
3. Update other drivers similarly

**Changes:**

```typescript
// Before
create: (context) => {
  const { apiKey, baseUrl, model } = context;
  // ...
};

// After
create: (context) => {
  const { apiKey, baseUrl } = context.sandbox.llm.provide();
  const { model } = context.config;
  // ...
};
```

### Phase 6: Cleanup

**Tasks:**

1. Deprecate `AgentContainer` interface (keep for backward compatibility)
2. Update documentation
3. Update CLAUDE.md
4. Add migration guide

## Impact Analysis

### Files to Modify

| Package       | File                    | Changes                                  |
| ------------- | ----------------------- | ---------------------------------------- |
| agentx-agent  | AgentInstance.ts        | Add sandbox property, update constructor |
| agentx-agent  | MemoryAgentContainer.ts | May be replaced by Container impl        |
| agentx        | LocalAgentManager.ts    | Create Sandbox when creating Agent       |
| agentx        | AgentX.ts               | Support Container injection              |
| agentx-claude | ClaudeDriver.ts         | Access LLM from sandbox                  |
| agentx-types  | AgentContext.ts         | May add sandbox reference                |

### New Files to Create

| Package        | File                | Description                       |
| -------------- | ------------------- | --------------------------------- |
| agentx-runtime | LocalFileSystem.ts  | node:fs implementation            |
| agentx-runtime | LocalProcess.ts     | node:child_process implementation |
| agentx-runtime | LocalEnv.ts         | process.env implementation        |
| agentx-runtime | LocalDisk.ts        | Local directory mounting          |
| agentx-runtime | LocalOS.ts          | Combined OS implementation        |
| agentx-runtime | LocalLLMProvider.ts | API-based LLM provider            |
| agentx-runtime | LocalSandbox.ts     | Local sandbox implementation      |

### Backward Compatibility

- `AgentContainer` interface kept but deprecated
- User-facing API (`agentx.agents.create()`) unchanged
- `Agent` interface gains `sandbox` property (additive change)

## Timeline

1. **Phase 1** (Local Sandbox): Foundation implementation
2. **Phase 2** (AgentInstance): Core integration
3. **Phase 3** (LocalAgentManager): Creation flow
4. **Phase 4** (Container Injection): Platform abstraction
5. **Phase 5** (Driver Updates): Resource access
6. **Phase 6** (Cleanup): Documentation and deprecation

## Benefits

1. **Platform Abstraction**: Different Container impl = different platform
2. **Resource Isolation**: Each Agent has isolated OS + LLM resources
3. **Testability**: Mock Sandbox for testing
4. **Cloud Ready**: Easy to implement Docker/Cloudflare containers
5. **Clear Hierarchy**: Container → Agent → Sandbox

---

## Design Decisions

### Decision 1: Runtime Package Split (Node vs Browser)

**Context**: Runtime implementations differ between Node.js and Browser environments.

**Decision**: Split into two packages:

- `@agentxjs/node-runtime-node` - Node.js implementation
- `@agentxjs/node-runtime-browser` - Browser implementation

**Architecture**:

```
┌─────────────────────────────────────────────────────┐
│                    AgentX (Unified API)             │
│         agent.sandbox.os.fs.readFile(...)           │
│         agent.sandbox.os.process.exec(...)          │
│         agent.sandbox.llm.provide()                 │
└──────────────────────┬──────────────────────────────┘
                       │ Inject different runtime
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐
│ agentx-runtime-node │   │agentx-runtime-browser│
├─────────────────────┤   ├─────────────────────┤
│ LocalFileSystem     │   │ RemoteFileSystem    │
│ (node:fs)           │   │ (HTTP → Server)     │
├─────────────────────┤   ├─────────────────────┤
│ LocalProcess        │   │ RemoteProcess       │
│ (child_process)     │   │ (HTTP → Server)     │
├─────────────────────┤   ├─────────────────────┤
│ LocalEnv            │   │ RemoteEnv           │
│ (process.env)       │   │ (HTTP → Server)     │
├─────────────────────┤   ├─────────────────────┤
│ LocalLLMProvider    │   │ RemoteLLMProvider   │
│ (direct API call)   │   │ (HTTP → Server)     │
└─────────────────────┘   └─────────────────────┘
```

**Benefits**:

- Unified API across environments
- Same Agent code runs on Node.js or Browser
- Clear separation of concerns

### Decision 2: Two-Layer Communication Architecture

**Context**: Current architecture only has business layer (StreamEvent) communication between Browser and Server.

**Decision**: Add resource layer communication alongside business layer.

**Before (Business Layer Only)**:

```
Browser                          Server
   │                                │
   │  ← StreamEvent (业务事件) ←    │
   │    text_delta, tool_call       │
   │                                │
   │  Browser can only subscribe    │
   │  to events, cannot access      │
   │  resources directly            │
```

**After (Business + Resource Layers)**:

```
Browser                          Server
   │                                │
   │  ══════ Business Layer ══════  │
   │  ← StreamEvent ←               │
   │    text_delta, tool_call       │
   │                                │
   │  ══════ Resource Layer ══════  │
   │  sandbox.os.fs.readFile() →   │
   │  ← file content ←              │
   │                                │
   │  sandbox.os.process.exec() →  │
   │  ← execution result ←          │
   │                                │
   │  Browser has FULL resource     │
   │  access capability!            │
```

**Benefits**:

- Browser Agent is a "real" Agent, not just an event listener
- Same code can run on both environments
- More flexible deployment options

### Decision 3: Directory Isolation (Not System Call Proxy)

**Context**: How does Claude SDK use Sandbox resources?

**Decision**: Use configuration-based isolation, not system call proxying.

**Claude SDK already supports these configurations**:

```typescript
// Container-scope configs in ClaudeConfig.ts
cwd: { scopes: ["container"] },           // Working directory
env: { scopes: ["container"] },           // Environment variables
executable: { scopes: ["container"] },    // JS runtime
abortController: { scopes: ["container"] }, // Cancellation
```

**Isolation Strategy**:

```
One Docker Image
├── Sandbox 1 (cwd: /sandbox/agent-1/, env: {...})
│   └── Agent 1 → Claude SDK uses cwd=/sandbox/agent-1/
├── Sandbox 2 (cwd: /sandbox/agent-2/, env: {...})
│   └── Agent 2 → Claude SDK uses cwd=/sandbox/agent-2/
└── Sandbox 3 (cwd: /sandbox/agent-3/, env: {...})
    └── Agent 3 → Claude SDK uses cwd=/sandbox/agent-3/
```

**Key Insight**:

- One Docker image can run multiple Containers (lightweight)
- Each Container/Sandbox assigns different `cwd` and `env`
- Claude SDK tools execute within isolated directories
- No need to proxy system calls - just configure paths

**Sandbox Responsibilities**:

1. `sandbox.os.disk.mount()` → Allocate directory as cwd
2. `sandbox.os.env` → Prepare environment variables
3. `sandbox.llm.provide()` → Provide apiKey, baseUrl

**Integration with Claude SDK**:

```typescript
query({
  options: {
    cwd: sandbox.cwd, // Isolated directory
    env: await sandbox.os.env.getAll(), // Isolated env vars
    apiKey: sandbox.llm.provide().apiKey,
  },
});
```

### Decision 4: Sandbox = Pure Resource Isolation

**Context**: What should Sandbox contain?

**Decision**: Sandbox is pure resource isolation (OS + LLM), not business logic.

**Removed from Sandbox**:

- ❌ Workspace (user/project/temp directories) - This is business logic
- ❌ Agent reference - Avoids circular dependency

**Sandbox Contains**:

- ✅ OS (FileSystem, Process, Env, Disk)
- ✅ LLM (Provider with apiKey, baseUrl)

**Final Structure**:

```typescript
interface Sandbox {
  readonly name: string;
  readonly os: OS; // FileSystem, Process, Env, Disk
  readonly llm: LLMProvider; // apiKey, baseUrl, etc.
}

// Agent holds Sandbox (unidirectional)
interface Agent {
  readonly sandbox: Sandbox;
}
```

### Decision 5: Container Manages Agents, Not Sandboxes

**Context**: What does Container manage?

**Decision**: Container manages Agents directly. Each Agent holds its own Sandbox.

**Hierarchy**:

```
Container (1:N Agents)
    │
    ├── Agent 1 ──→ Sandbox 1
    ├── Agent 2 ──→ Sandbox 2
    └── Agent 3 ──→ Sandbox 3
```

**Rationale**:

- Container = "contains many" (1:N)
- Sandbox = "isolates one" (1:1 with Agent)
- Agent holds Sandbox reference (avoids circular dependency)

---

## Updated Package Structure

```
packages/
├── agentx-types/              # Type definitions (DONE)
│   └── src/runtime/
│       ├── container/
│       │   └── Container.ts
│       └── sandbox/
│           ├── Sandbox.ts
│           ├── os/
│           └── llm/
│
├── agentx-runtime-node/       # Node.js implementation (TODO)
│   └── src/
│       ├── LocalSandbox.ts
│       ├── os/
│       │   ├── LocalFileSystem.ts
│       │   ├── LocalProcess.ts
│       │   ├── LocalEnv.ts
│       │   └── LocalDisk.ts
│       └── llm/
│           └── LocalLLMProvider.ts
│
└── agentx-runtime-browser/    # Browser implementation (TODO)
    └── src/
        ├── RemoteSandbox.ts
        ├── os/
        │   ├── RemoteFileSystem.ts
        │   ├── RemoteProcess.ts
        │   ├── RemoteEnv.ts
        │   └── RemoteDisk.ts
        └── llm/
            └── RemoteLLMProvider.ts
```
