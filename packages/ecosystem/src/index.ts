/**
 * @agentxjs/ecosystem - Complete runtime for AI Agents
 *
 * Provides everything needed to run AI Agents:
 * - Ecosystem: Main entry point with createAgent()
 * - SystemBus: Central event bus
 * - Environment: Claude SDK integration (Receptor + Effector)
 * - AgentEngine: Mealy Machine event processor
 * - Container: Agent instance management
 * - Repository: SQLite persistence
 *
 * @example
 * ```typescript
 * import { createEcosystem } from "@agentxjs/ecosystem";
 *
 * const ecosystem = createEcosystem();
 *
 * const agent = ecosystem.createAgent({
 *   name: "Assistant",
 *   systemPrompt: "You are helpful",
 * });
 *
 * agent.on("text_delta", (e) => process.stdout.write(e.data.text));
 * await agent.receive("Hello!");
 *
 * ecosystem.dispose();
 * ```
 */

// Ecosystem (main entry point)
export { Ecosystem, createEcosystem, type EcosystemConfig } from "./Ecosystem";

// SystemBus
export { SystemBusImpl } from "./SystemBusImpl";

// Driver
export { BusDriver, type BusDriverConfig } from "./driver";

// Environment
export * from "./environment";

// Runtime (Repository, LLM, Logger)
export * from "./runtime";

// Utils
export * from "./utils";
