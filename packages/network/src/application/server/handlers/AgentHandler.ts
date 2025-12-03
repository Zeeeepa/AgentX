/**
 * AgentHandler - Handles /agents/* endpoints
 */

import type {
  AgentX,
  Agent,
  UserMessage,
  AgentListResponse,
  AgentInfoResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  SendMessageRequest,
  SendMessageResponse,
  InterruptResponse,
  ApplicationHandlerHooks,
} from "@agentxjs/types";
import { jsonResponse, errorResponse } from "./utils";

export interface AgentHandlerDeps {
  agentx: AgentX;
  basePath: string;
  allowDynamicCreation: boolean;
  allowedDefinitions: string[];
  hooks: ApplicationHandlerHooks;
}

export class AgentHandler {
  constructor(private readonly deps: AgentHandlerDeps) {}

  private getAgentOrError(agentId: string): Agent | Response {
    const agent = this.deps.agentx.agents.get(agentId);
    if (!agent) {
      return errorResponse("AGENT_NOT_FOUND", `Agent ${agentId} not found`, 404);
    }
    if (agent.lifecycle === "destroyed") {
      return errorResponse("AGENT_DESTROYED", `Agent ${agentId} has been destroyed`, 410);
    }
    return agent;
  }

  private buildAgentInfo(agent: Agent): AgentInfoResponse {
    return {
      agentId: agent.agentId,
      name: agent.definition.name,
      description: agent.definition.description,
      lifecycle: agent.lifecycle,
      state: agent.state,
      createdAt: agent.createdAt,
    };
  }

  /**
   * GET /agents
   */
  async list(): Promise<Response> {
    const allAgents = this.deps.agentx.agents.list();
    const agents: AgentInfoResponse[] = allAgents.map((agent) => this.buildAgentInfo(agent));

    const response: AgentListResponse = { agents };
    return jsonResponse(response);
  }

  /**
   * POST /agents
   */
  async create(request: Request): Promise<Response> {
    if (!this.deps.allowDynamicCreation) {
      return errorResponse("DYNAMIC_CREATION_DISABLED", "Dynamic agent creation is disabled", 403);
    }

    let body: CreateAgentRequest;
    try {
      body = (await request.json()) as CreateAgentRequest;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }

    if (!body.definition) {
      return errorResponse("INVALID_REQUEST", "Missing 'definition' field", 400);
    }

    if (
      this.deps.allowedDefinitions.length > 0 &&
      !this.deps.allowedDefinitions.includes(body.definition)
    ) {
      return errorResponse(
        "DEFINITION_NOT_FOUND",
        `Definition '${body.definition}' is not allowed`,
        403
      );
    }

    const metaImage = await this.deps.agentx.images.getMetaImage(body.definition);
    if (!metaImage) {
      return errorResponse(
        "IMAGE_NOT_FOUND",
        `MetaImage for definition '${body.definition}' not found`,
        404
      );
    }

    const agent = await this.deps.agentx.images.run(metaImage.imageId);

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

  /**
   * GET /agents/:agentId
   */
  async get(agentId: string): Promise<Response> {
    const result = this.getAgentOrError(agentId);
    if (result instanceof Response) return result;

    return jsonResponse(this.buildAgentInfo(result));
  }

  /**
   * DELETE /agents/:agentId
   */
  async delete(agentId: string): Promise<Response> {
    const result = this.getAgentOrError(agentId);
    if (result instanceof Response) return result;

    await this.deps.agentx.agents.destroy(agentId);
    return new Response(null, { status: 204 });
  }

  /**
   * POST /agents/:agentId/messages
   */
  async sendMessage(agentId: string, request: Request): Promise<Response> {
    const result = this.getAgentOrError(agentId);
    if (result instanceof Response) return result;

    const agent = result;

    if (agent.state !== "idle") {
      return errorResponse("AGENT_BUSY", `Agent is currently ${agent.state}`, 409);
    }

    let body: SendMessageRequest;
    try {
      body = (await request.json()) as SendMessageRequest;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }

    if (!body.content) {
      return errorResponse("INVALID_REQUEST", "Missing 'content' field", 400);
    }

    const message: UserMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      subtype: "user",
      content: body.content as UserMessage["content"],
      timestamp: Date.now(),
    };

    if (this.deps.hooks.onMessage) {
      try {
        await this.deps.hooks.onMessage(agentId, message);
      } catch {
        // Ignore hook errors
      }
    }

    agent.receive(message).catch((error) => {
      if (this.deps.hooks.onError) {
        const result = this.deps.hooks.onError(agentId, error);
        if (result instanceof Promise) {
          result.catch(() => {});
        }
      }
    });

    const response: SendMessageResponse = {
      status: "processing",
    };
    return jsonResponse(response, 202);
  }

  /**
   * POST /agents/:agentId/interrupt
   */
  async interrupt(agentId: string): Promise<Response> {
    const result = this.getAgentOrError(agentId);
    if (result instanceof Response) return result;

    const agent = result;
    agent.interrupt();

    const response: InterruptResponse = {
      interrupted: true,
    };
    return jsonResponse(response);
  }
}
