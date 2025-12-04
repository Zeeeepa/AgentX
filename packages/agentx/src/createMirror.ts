/**
 * createMirror - Factory function for browser AgentX client
 *
 * Creates an AgentX instance that connects to a remote server.
 * All operations are performed via HTTP (persistence) and SSE (events).
 *
 * @example
 * ```typescript
 * import { createMirror } from "agentxjs";
 *
 * const agentx = createMirror({
 *   serverUrl: "http://localhost:5200",
 *   token: "optional-auth-token",
 * });
 *
 * // Same API as local AgentX
 * const image = await agentx.images.getMetaImage("Assistant");
 * const agent = await agentx.runtime.run(image.imageId);
 * ```
 */

import type { AgentX, MirrorOptions } from "@agentxjs/types";
import { MirrorRuntime, MirrorPersistence } from "@agentxjs/mirror";
import { createAgentX } from "./createAgentX";

/**
 * createMirror - Create a browser AgentX client
 *
 * @param options - Mirror configuration
 * @returns AgentX instance connected to remote server
 */
export function createMirror(options: MirrorOptions): AgentX {
  // Extract URL parts
  const serverUrl = options.serverUrl.replace(/\/$/, "");

  // Create MirrorRuntime (for events)
  const runtime = new MirrorRuntime({
    serverUrl,
  });

  // Create MirrorPersistence (HTTP for data)
  const persistence = new MirrorPersistence({
    baseUrl: `${serverUrl}/api`,
    token: options.token,
    headers: options.headers,
  });

  // Create AgentX with mirror runtime and persistence
  return createAgentX(runtime, persistence);
}
