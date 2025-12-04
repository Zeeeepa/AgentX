/**
 * Factory functions for creating AgentX instances
 *
 * Two modes:
 * - createAgentX: Full control with runtime and repository
 * - createMirror: Simplified browser client connecting to server
 *
 * @example
 * ```typescript
 * // Local mode - full control
 * import { createAgentX } from "agentxjs";
 * const agentx = createAgentX(runtime, repository);
 *
 * // Mirror mode - browser client
 * import { createMirror } from "agentxjs";
 * const agentx = createMirror({ serverUrl: "http://..." });
 * ```
 */

import type { AgentX } from "./AgentX";
import type { Runtime } from "~/runtime/Runtime";
import type { Persistence } from "~/persistence";

// ============================================================================
// createAgentX - Full Control Mode
// ============================================================================

/**
 * createAgentX - Factory function for creating AgentX instances
 *
 * Use this when you need full control over runtime and persistence.
 *
 * @param runtime - Runtime for event handling
 * @param persistence - Persistence for data storage
 * @returns AgentX instance
 *
 * @example
 * ```typescript
 * import { createAgentX } from "agentxjs";
 * import { nodeRuntime, nodePersistence } from "@agentxjs/node-runtime";
 *
 * const runtime = nodeRuntime({ apiKey: "xxx" });
 * const persistence = nodePersistence("./data.db");
 * const agentx = createAgentX(runtime, persistence);
 * ```
 */
export declare function createAgentX(runtime: Runtime, persistence: Persistence): AgentX;

// ============================================================================
// createMirror - Browser Client Mode
// ============================================================================

/**
 * Mirror configuration options
 */
export interface MirrorOptions {
  /**
   * Server URL to connect to
   */
  serverUrl: string;

  /**
   * Authentication token (optional)
   */
  token?: string;

  /**
   * Request headers (optional)
   */
  headers?: Record<string, string>;
}

/**
 * createMirror - Factory function for creating browser AgentX client
 *
 * Simplified API for browser clients. Internally creates:
 * - HTTP-based repository (requests to server)
 * - SSE-based runtime (receives events from server)
 *
 * @param options - Mirror configuration
 * @returns AgentX instance
 *
 * @example
 * ```typescript
 * import { createMirror } from "agentxjs";
 *
 * const agentx = createMirror({
 *   serverUrl: "http://localhost:5200",
 *   token: "xxx",
 * });
 *
 * // Same API as local AgentX
 * const image = await agentx.images.getMetaImage("Assistant");
 * const agent = await agentx.runtime.run(image.imageId);
 * ```
 */
export declare function createMirror(options: MirrorOptions): AgentX;
