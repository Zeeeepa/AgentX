/**
 * DefinitionHandler - Handles /definitions/* endpoints
 */

import type { Repository, DefinitionRecord } from "@agentxjs/types";
import { jsonResponse, errorResponse, noContentResponse, headResponse } from "./utils";

export interface DefinitionHandlerDeps {
  repository: Repository;
}

export class DefinitionHandler {
  constructor(private readonly deps: DefinitionHandlerDeps) {}

  /**
   * GET /definitions
   */
  async list(): Promise<Response> {
    const definitions = await this.deps.repository.findAllDefinitions();
    return jsonResponse(definitions);
  }

  /**
   * GET /definitions/:name
   */
  async get(name: string): Promise<Response> {
    const definition = await this.deps.repository.findDefinitionByName(name);
    if (!definition) {
      return errorResponse("DEFINITION_NOT_FOUND", `Definition ${name} not found`, 404);
    }
    return jsonResponse(definition);
  }

  /**
   * PUT /definitions/:name
   */
  async save(name: string, request: Request): Promise<Response> {
    let body: DefinitionRecord;
    try {
      body = (await request.json()) as DefinitionRecord;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }
    await this.deps.repository.saveDefinition({ ...body, name });
    return noContentResponse();
  }

  /**
   * DELETE /definitions/:name
   */
  async delete(name: string): Promise<Response> {
    await this.deps.repository.deleteDefinition(name);
    return noContentResponse();
  }

  /**
   * HEAD /definitions/:name
   */
  async exists(name: string): Promise<Response> {
    const exists = await this.deps.repository.definitionExists(name);
    return headResponse(exists);
  }
}
