/**
 * AgentX - Unified API
 *
 * The central entry point for all agent operations.
 * Isomorphic - same interface for local and remote.
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { createRuntime } from "@agentxjs/runtime";
 *
 * const runtime = createRuntime();
 * const agentx = createAgentX(runtime);
 *
 * // Application API - static resources
 * await agentx.definitions.register(TranslatorDef);
 * const image = await agentx.images.getMetaImage("Translator");
 *
 * // Runtime API - dynamic instances + events
 * agentx.runtime.on("text_delta", (e) => console.log(e));
 *
 * const session = await agentx.runtime.createSession(image.imageId);
 * const agent = await session.resume();
 *
 * agent.on("text_delta", (e) => process.stdout.write(e.text));
 * await agent.receive("Hello!");
 * ```
 */

import type { DefinitionAPI, ImageAPI } from "./application";
import type { RuntimeAPI } from "./runtime";

/**
 * AgentX - Unified API interface
 *
 * Isomorphic: same interface works for both local runtime and remote connection.
 */
export interface AgentX {
  // ==================== Application API ====================

  /**
   * Definition registry (static resource)
   */
  readonly definitions: DefinitionAPI;

  /**
   * Image management (static resource)
   */
  readonly images: ImageAPI;

  // ==================== Runtime API ====================

  /**
   * Runtime operations and event bus (dynamic instances)
   */
  readonly runtime: RuntimeAPI;

  // ==================== Lifecycle ====================

  /**
   * Dispose the AgentX instance and clean up resources
   */
  dispose(): void;
}
