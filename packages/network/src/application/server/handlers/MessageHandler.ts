/**
 * MessageHandler - Handles /messages/* endpoints
 */

import type { Repository, MessageRecord } from "@agentxjs/types";
import { jsonResponse, errorResponse, noContentResponse } from "./utils";

export interface MessageHandlerDeps {
  repository: Repository;
}

export class MessageHandler {
  constructor(private readonly deps: MessageHandlerDeps) {}

  /**
   * GET /messages/:messageId
   */
  async get(messageId: string): Promise<Response> {
    const message = await this.deps.repository.findMessageById(messageId);
    if (!message) {
      return errorResponse("INVALID_REQUEST", `Message ${messageId} not found`, 404);
    }
    return jsonResponse(message);
  }

  /**
   * PUT /messages/:messageId
   */
  async save(messageId: string, request: Request): Promise<Response> {
    let body: MessageRecord;
    try {
      body = (await request.json()) as MessageRecord;
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON body", 400);
    }
    await this.deps.repository.saveMessage({ ...body, messageId });
    return noContentResponse();
  }

  /**
   * DELETE /messages/:messageId
   */
  async delete(messageId: string): Promise<Response> {
    await this.deps.repository.deleteMessage(messageId);
    return noContentResponse();
  }
}
