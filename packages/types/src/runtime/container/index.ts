/**
 * Container - Agent Lifecycle Manager
 *
 * Container is the SINGLE POINT for all Agent lifecycle operations.
 * It abstracts platform-specific implementations (Node.js, Browser, Docker, etc.)
 *
 * ## Design Philosophy (Docker-style)
 *
 * | Docker Command              | Container Method          |
 * |-----------------------------|---------------------------|
 * | `docker run <image>`        | `container.run(image)`    |
 * | `docker start <container>`  | `container.resume(session)` |
 * | `docker stop/rm <id>`       | `container.destroy(agentId)` |
 * | `docker ps`                 | `container.list()`        |
 * | `docker inspect <id>`       | `container.get(agentId)`  |
 *
 * ## Core Interface
 *
 * ```typescript
 * interface Container {
 *   // Lifecycle
 *   run(image: AgentImage): Promise<Agent>;      // New agent (no history)
 *   resume(session: Session): Promise<Agent>;    // Resume agent (with history)
 *   destroy(agentId: string): Promise<void>;
 *
 *   // Query
 *   get(agentId: string): Agent | undefined;
 *   has(agentId: string): boolean;
 *   list(): Agent[];
 * }
 * ```
 *
 * ## Internal Responsibilities (Encapsulated)
 *
 * Container handles ALL of these internally - upper layers don't need to know:
 *
 * - Agent creation and registration
 * - Driver instantiation and configuration
 * - SDK session ID management (for Claude SDK resume)
 * - Message history injection (for OpenAI-style APIs)
 * - Platform-specific communication (SSE, WebSocket, etc.)
 *
 * ## Platform Implementations
 *
 * ```
 * Container (interface)
 *       │
 *       ├── NodeContainer (Server)
 *       │     - Creates real Drivers (ClaudeDriver, etc.)
 *       │     - Manages sdkSessionId for resume
 *       │     - Direct SDK access
 *       │
 *       └── BrowserContainer (Client)
 *             - Creates SSEDriver (proxy to server)
 *             - Calls server API for run/resume
 *             - Server handles actual resume logic
 * ```
 *
 * ## Resume Implementation (Internal Detail)
 *
 * Different SDKs have different resume mechanisms:
 *
 * - Claude SDK: Pass `resume: sdkSessionId` to options (SDK manages history)
 * - OpenAI: Manually inject `messages[]` to each request
 * - Others: Platform-specific implementations
 *
 * Container encapsulates ALL of this. Upper layers just call:
 * ```typescript
 * const agent = await container.resume(session);
 * ```
 *
 * ## Upper Layer Simplification
 *
 * ```typescript
 * // Session.resume() becomes one line:
 * async resume(): Promise<Agent> {
 *   return this.container.resume(this);
 * }
 *
 * // ImageManager.run() becomes one line:
 * async run(imageId: string): Promise<Agent> {
 *   const image = await this.repository.findImage(imageId);
 *   return this.container.run(image);
 * }
 * ```
 *
 * ## What Container Does NOT Expose
 *
 * These are internal implementation details:
 * - register(agent) - Handled by run()/resume()
 * - unregister(agentId) - Handled by destroy()
 * - resolveAgentId() - Internal to run()/resume()
 * - sdkSessionId management - Completely internal
 */

export * from "./Container";
