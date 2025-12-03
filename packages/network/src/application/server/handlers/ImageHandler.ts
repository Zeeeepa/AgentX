/**
 * ImageHandler - Handles /images/* endpoints
 */

import type {
  AgentX,
  Repository,
  ImageRecord,
  CreateAgentResponse,
} from "@agentxjs/types";
import { jsonResponse, errorResponse, noContentResponse, headResponse } from "./utils";

export interface ImageHandlerDeps {
  agentx: AgentX;
  repository: Repository;
  basePath: string;
}

export class ImageHandler {
  constructor(private readonly deps: ImageHandlerDeps) {}

  /**
   * GET /images
   */
  async list(): Promise<Response> {
    const images = await this.deps.repository.findAllImages();
    return jsonResponse(images);
  }

  /**
   * GET /images/:imageId
   */
  async get(imageId: string): Promise<Response> {
    const image = await this.deps.repository.findImageById(imageId);
    if (!image) {
      return errorResponse("IMAGE_NOT_FOUND", `Image ${imageId} not found`, 404);
    }
    return jsonResponse(image);
  }

  /**
   * PUT /images/:imageId
   */
  async save(imageId: string, request: Request): Promise<Response> {
    let body: ImageRecord;
    try {
      body = (await request.json()) as ImageRecord;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }
    await this.deps.repository.saveImage({ ...body, imageId });
    return noContentResponse();
  }

  /**
   * DELETE /images/:imageId
   */
  async delete(imageId: string): Promise<Response> {
    await this.deps.repository.deleteImage(imageId);
    return noContentResponse();
  }

  /**
   * HEAD /images/:imageId
   */
  async exists(imageId: string): Promise<Response> {
    const exists = await this.deps.repository.imageExists(imageId);
    return headResponse(exists);
  }

  /**
   * GET /images/:imageId/sessions
   */
  async listSessions(imageId: string): Promise<Response> {
    const sessions = await this.deps.repository.findSessionsByImageId(imageId);
    return jsonResponse(sessions);
  }

  /**
   * DELETE /images/:imageId/sessions
   */
  async deleteSessions(imageId: string): Promise<Response> {
    await this.deps.repository.deleteSessionsByImageId(imageId);
    return noContentResponse();
  }

  /**
   * POST /images/:imageId/run
   */
  async run(imageId: string, request: Request): Promise<Response> {
    let containerId: string | undefined;
    try {
      const body = (await request.json()) as { containerId?: string };
      containerId = body.containerId;
    } catch {
      // No body or invalid JSON - use default container
    }

    const agent = await this.deps.agentx.images.run(imageId, { containerId });

    const response: CreateAgentResponse = {
      agentId: agent.agentId,
      name: agent.definition.name,
      lifecycle: agent.lifecycle,
      state: agent.state,
      createdAt: agent.createdAt,
      endpoints: {
        sse: `${this.deps.basePath}/agents/${agent.agentId}/sse`,
        messages: `${this.deps.basePath}/agents/${agent.agentId}/messages`,
        interrupt: `${this.deps.basePath}/agents/${agent.agentId}/interrupt`,
      },
    };

    return jsonResponse(response, 201);
  }
}
