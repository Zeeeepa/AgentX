/**
 * Definition Endpoints - HTTP API contracts for Definition operations
 *
 * Definition is a static blueprint (like Dockerfile), managed via HTTP CRUD.
 */

import type { Endpoint } from "./Endpoint";
import type { AgentDefinition } from "~/application/definition";

// ============================================================================
// Response Types
// ============================================================================

export interface ListDefinitionsResponse {
  definitions: AgentDefinition[];
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * List all Definitions
 * GET /definitions
 */
export interface ListDefinitionsEndpoint
  extends Endpoint<"GET", "/definitions", void, ListDefinitionsResponse> {}

/**
 * Get single Definition
 * GET /definitions/:name
 */
export interface GetDefinitionEndpoint
  extends Endpoint<"GET", "/definitions/:name", { name: string }, AgentDefinition> {}

/**
 * Register Definition
 * POST /definitions
 */
export interface RegisterDefinitionEndpoint
  extends Endpoint<"POST", "/definitions", AgentDefinition, AgentDefinition> {}

/**
 * Unregister Definition
 * DELETE /definitions/:name
 */
export interface UnregisterDefinitionEndpoint
  extends Endpoint<"DELETE", "/definitions/:name", { name: string }, void> {}
