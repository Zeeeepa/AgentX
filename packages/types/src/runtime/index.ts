/**
 * Runtime Module - Infrastructure Layer for AgentX
 *
 * ## ADR: Infrastructure Abstraction
 *
 * Runtime is the infrastructure layer, providing create functions for technical components.
 * This is key to isomorphic architecture: business code depends on Runtime interface,
 * not concrete implementations.
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                       Runtime Interface                     │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
 * │  │createSandbox│  │createDriver │  │     Repository      │  │
 * │  │  (OS+LLM)   │  │  (AI model) │  │ (storage abstract)  │  │
 * │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌───────────────────┼───────────────────┐
 *          │                   │                   │
 *          ▼                   ▼                   ▼
 * ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
 * │   NodeRuntime   │ │   SSERuntime    │ │  (Future...)    │
 * │   (Server)      │ │   (Browser)     │ │  EdgeRuntime    │
 * │                 │ │                 │ │  CloudRuntime   │
 * │ SQLiteRepository│ │ RemoteRepository│ │                 │
 * │ ClaudeDriver    │ │ SSEDriver       │ │                 │
 * │ LocalSandbox    │ │ NoopSandbox     │ │                 │
 * └─────────────────┘ └─────────────────┘ └─────────────────┘
 * ```
 *
 * ## Core Components
 *
 * | Component      | Responsibility              | Server Impl        | Browser Impl      |
 * |----------------|-----------------------------|--------------------|-------------------|
 * | createSandbox  | Resource isolation (OS+LLM) | LocalSandbox       | NoopSandbox       |
 * | createDriver   | LLM invocation              | ClaudeDriver       | SSEDriver         |
 * | createLogger   | Logging                     | FileLogger         | ConsoleLogger     |
 * | Repository     | Storage abstraction         | SQLiteRepository   | RemoteRepository  |
 *
 * Note: Container lifecycle (ContainerManager) is at AgentX layer, not Runtime.
 *
 * ## Repository Isomorphic Design
 *
 * Repository is the core of isomorphism. It defines a unified storage interface:
 * - **Server**: SQLiteRepository writes directly to database
 * - **Browser**: RemoteRepository calls Server via HTTP
 *
 * Business code only depends on Repository interface, not caring whether it's
 * local database or remote API. This enables "Define Once, Run Anywhere".
 *
 * ## Why This Design?
 *
 * 1. **Dependency Inversion**: Business code depends on abstractions, not implementations
 * 2. **Testability**: Can use InMemoryRepository for unit tests
 * 3. **Extensibility**: Easy to add RedisRepository, PostgresRepository in future
 * 4. **Isomorphism**: Server and Browser use identical business code
 *
 * @see issues/022-runtime-agentx-isomorphic-architecture.md
 * @packageDocumentation
 */

// Runtime interface - unified infrastructure entry point
export type { Runtime } from "./Runtime";

// RuntimeDriver - Driver + Sandbox combination
export type { RuntimeDriver } from "~/runtime/container/driver/RuntimeDriver";

// Sandbox - Resource isolation (OS filesystem, process, env; LLM provider)
export * from "./container/sandbox";

// Repository - Storage abstraction (key to isomorphism)
// SQLiteRepository (Server) vs RemoteRepository (Browser)
export * from "./repository";
