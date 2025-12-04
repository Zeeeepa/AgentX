/**
 * @agentxjs/runtime - Complete runtime for AI Agents
 *
 * Provides everything needed to run AI Agents:
 * - AgentRuntime: Main entry point with createAgent()
 * - SystemBus: Central event bus
 * - Environment: Claude SDK integration (Receptor + Effector)
 * - AgentEngine: Mealy Machine event processor
 * - Container: Agent instance management
 * - Repository: SQLite persistence
 *
 * @example
 * ```typescript
 * import { createRuntime } from "@agentxjs/runtime";
 *
 * const runtime = createRuntime();
 *
 * const agent = runtime.createAgent({
 *   name: "Assistant",
 *   systemPrompt: "You are helpful",
 * });
 *
 * agent.on("text_delta", (e) => process.stdout.write(e.data.text));
 * await agent.receive("Hello!");
 *
 * runtime.dispose();
 * ```
 */

// AgentRuntime (main entry point)
export { AgentRuntime, createRuntime, type AgentRuntimeConfig } from "./AgentRuntime";

// SystemBus
export { SystemBusImpl } from "./SystemBusImpl";

// Driver
export { BusDriver, type BusDriverConfig } from "./driver";

// Environment
export * from "./environment";

// Infrastructure (Repository, LLM, Logger)
export * from "./runtime";

// Utils
export * from "./utils";
