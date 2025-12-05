/**
 * @agentxjs/runtime - Runtime for AI Agents
 *
 * @example
 * ```typescript
 * import { createRuntime } from "@agentxjs/runtime";
 * import { createNodePersistence } from "@agentxjs/persistence";
 *
 * const runtime = createRuntime({
 *   persistence: createNodePersistence(),
 * });
 *
 * await runtime.containers.create("my-container");
 * const agent = await runtime.agents.run("my-container", {
 *   name: "Assistant",
 *   systemPrompt: "You are helpful",
 * });
 *
 * runtime.events.on("text_delta", (e) => console.log(e.data.text));
 * await agent.receive("Hello!");
 *
 * await runtime.dispose();
 * ```
 *
 * @packageDocumentation
 */

export { createRuntime, type RuntimeConfig } from "./createRuntime";
