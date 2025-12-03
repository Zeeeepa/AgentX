/**
 * SessionHandler - Handles /sessions/* endpoints
 */

import type {
  AgentX,
  Repository,
  SessionRecord,
  CreateAgentResponse,
} from "@agentxjs/types";
import { jsonResponse, errorResponse, noContentResponse, headResponse } from "./utils";

export interface SessionHandlerDeps {
  agentx: AgentX;
  repository: Repository;
  basePath: string;
}

export class SessionHandler {
  constructor(private readonly deps: SessionHandlerDeps) {}

  /**
   * GET /sessions
   */
  async list(): Promise<Response> {
    const sessions = await this.deps.repository.findAllSessions();
    return jsonResponse(sessions);
  }

  /**
   * GET /sessions/:sessionId
   */
  async get(sessionId: string): Promise<Response> {
    const session = await this.deps.repository.findSessionById(sessionId);
    if (!session) {
      return errorResponse("SESSION_NOT_FOUND", `Session ${sessionId} not found`, 404);
    }
    return jsonResponse(session);
  }

  /**
   * PUT /sessions/:sessionId
   */
  async save(sessionId: string, request: Request): Promise<Response> {
    let body: SessionRecord;
    try {
      body = (await request.json()) as SessionRecord;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }
    await this.deps.repository.saveSession({ ...body, sessionId });
    return noContentResponse();
  }

  /**
   * DELETE /sessions/:sessionId
   */
  async delete(sessionId: string): Promise<Response> {
    await this.deps.repository.deleteSession(sessionId);
    return noContentResponse();
  }

  /**
   * HEAD /sessions/:sessionId
   */
  async exists(sessionId: string): Promise<Response> {
    const exists = await this.deps.repository.sessionExists(sessionId);
    return headResponse(exists);
  }

  /**
   * GET /sessions/:sessionId/messages
   */
  async listMessages(sessionId: string): Promise<Response> {
    const messages = await this.deps.repository.findMessagesBySessionId(sessionId);
    return jsonResponse(messages);
  }

  /**
   * DELETE /sessions/:sessionId/messages
   */
  async deleteMessages(sessionId: string): Promise<Response> {
    await this.deps.repository.deleteMessagesBySessionId(sessionId);
    return noContentResponse();
  }

  /**
   * GET /sessions/:sessionId/messages/count
   */
  async countMessages(sessionId: string): Promise<Response> {
    const count = await this.deps.repository.countMessagesBySessionId(sessionId);
    return jsonResponse({ count });
  }

  /**
   * POST /sessions/:sessionId/resume
   */
  async resume(sessionId: string, request: Request): Promise<Response> {
    const session = await this.deps.agentx.sessions.get(sessionId);
    if (!session) {
      return errorResponse("SESSION_NOT_FOUND", `Session ${sessionId} not found`, 404);
    }

    let containerId: string | undefined;
    try {
      const body = (await request.json()) as { containerId?: string };
      containerId = body.containerId;
    } catch {
      // No body or invalid JSON - use default container
    }

    const agent = await session.resume({ containerId });

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
