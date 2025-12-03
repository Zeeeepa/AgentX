/**
 * AgentX Platform Contract Layer - Business Logic API
 *
 * "Define Once, Run Anywhere"
 *
 * ## ADR: Business Logic vs Infrastructure
 *
 * AgentX is the **business logic layer** - the central entry point for all agent operations.
 * It is **platform-agnostic** and **isomorphic**: same code runs on Server and Browser.
 *
 * ## Two Roles
 *
 * 1. **Application Developer** - Uses AgentX
 *    - `defineAgent()` - Define agent template
 *    - `createAgentX(runtime)` - Create platform instance
 *    - `agentx.definitions.register()` - Register definition
 *    - `agentx.images.getMetaImage()` - Get genesis image
 *
 * 2. **Platform Developer** - Implements Runtime
 *    - NodeRuntime, RemoteRuntime
 *    - SQLiteRepository, RemoteRepository
 *    - ClaudeDriver
 *
 * ## API Structure
 *
 * ```text
 * agentx
 * ├── .definitions.*   Definition registry (register, get, list)
 * ├── .images.*        Image management (getMetaImage, list)
 * ├── .sessions.*      Session management (create, get, list)
 * ├── .agents.*        Agent lifecycle (create, get, destroy)
 * ├── .containers.*    Container management
 * └── .errors.*        Error handling
 * ```
 *
 * Note: HTTP endpoints are in network/endpoint/.
 * Runtime operations (Agent, Session) use WebSocket events.
 *
 * @see issues/025-ecosystem-channel-architecture.md
 * @packageDocumentation
 */

// Main platform interfaces
export type { AgentX, AgentXLocal, AgentXRemote } from "./AgentX";

// Factory function - creates AgentX instance from Runtime
export { createAgentX } from "./createAgentX";

// defineAgent - defines agent template (source, like Dockerfile)
export type { DefineAgentInput } from "./defineAgent";
export { defineAgent } from "./defineAgent";

// Manager interfaces
export type { AgentManager } from "./agent";
export type { SessionManager } from "./session";
export type { PlatformManager } from "./platform";
export type { ContainerManager } from "./container";
export type { DefinitionManager } from "./definition";
export type { ImageManager } from "./image";
export type { ErrorManager, ErrorHandler } from "./error";
