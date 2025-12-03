/**
 * ContainerHandler - Handles /containers/* endpoints
 */

import type { AgentX, Repository, ContainerRecord, ContainerConfig } from "@agentxjs/types";
import { jsonResponse, errorResponse, noContentResponse, headResponse } from "./utils";

export interface ContainerHandlerDeps {
  agentx: AgentX;
  repository: Repository;
}

export class ContainerHandler {
  constructor(private readonly deps: ContainerHandlerDeps) {}

  /**
   * GET /containers
   */
  async list(): Promise<Response> {
    const containers = await this.deps.repository.findAllContainers();
    return jsonResponse(containers);
  }

  /**
   * POST /containers
   */
  async create(request: Request): Promise<Response> {
    let config: ContainerConfig | undefined;
    try {
      const body = (await request.json()) as { config?: ContainerConfig };
      config = body.config;
    } catch {
      // No body or invalid JSON - create with no config
    }

    const container: ContainerRecord = await this.deps.agentx.containers.create(config);
    return jsonResponse(container, 201);
  }

  /**
   * GET /containers/:containerId
   */
  async get(containerId: string): Promise<Response> {
    const container = await this.deps.agentx.containers.get(containerId);
    if (!container) {
      return errorResponse("CONTAINER_NOT_FOUND", `Container ${containerId} not found`, 404);
    }
    return jsonResponse(container);
  }

  /**
   * PUT /containers/:containerId
   */
  async save(containerId: string, request: Request): Promise<Response> {
    let body: ContainerRecord;
    try {
      body = (await request.json()) as ContainerRecord;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }
    await this.deps.repository.saveContainer({ ...body, containerId });
    return noContentResponse();
  }

  /**
   * DELETE /containers/:containerId
   */
  async delete(containerId: string): Promise<Response> {
    const deleted = await this.deps.agentx.containers.delete(containerId);
    if (!deleted) {
      return errorResponse("CONTAINER_NOT_FOUND", `Container ${containerId} not found`, 404);
    }
    return noContentResponse();
  }

  /**
   * HEAD /containers/:containerId
   */
  async exists(containerId: string): Promise<Response> {
    const exists = await this.deps.agentx.containers.exists(containerId);
    return headResponse(exists);
  }
}
