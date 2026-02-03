/**
 * Runtime Module
 *
 * AgentXProvider and AgentXRuntime interfaces.
 * Platform packages provide concrete implementations.
 *
 * Usage:
 * ```typescript
 * import type {
 *   AgentXProvider,
 *   AgentXRuntime,
 *   RuntimeAgent,
 * } from "@agentxjs/core/runtime";
 *
 * // Platform provides implementation
 * const provider: AgentXProvider = {
 *   containerRepository,
 *   imageRepository,
 *   sessionRepository,
 *   workspaceProvider,
 *   driver,
 *   eventBus,
 * };
 *
 * const runtime: AgentXRuntime = createRuntime({ provider });
 *
 * // Create agent from image
 * const agent = await runtime.createAgent({ imageId: "img_xxx" });
 *
 * // Send message
 * await runtime.receive(agent.agentId, "Hello!");
 *
 * // Subscribe to events
 * const sub = runtime.subscribe(agent.agentId, (event) => {
 *   console.log(event.type, event.data);
 * });
 *
 * // Cleanup
 * sub.unsubscribe();
 * await runtime.destroyAgent(agent.agentId);
 * ```
 */

export type {
  AgentLifecycle,
  RuntimeAgent,
  AgentXProvider,
  CreateAgentOptions,
  AgentEventHandler,
  Subscription,
  AgentXRuntime,
  AgentXRuntimeConfig,
  CreateAgentXRuntime,
} from "./types";

export { AgentXRuntimeImpl, createAgentXRuntime } from "./AgentXRuntime";
