/**
 * Message - Entity in Session
 *
 * Represents a single message in a conversation.
 * Each message records which Agent produced it.
 *
 * Relationship with agentx-types Message:
 * - types Message: Industry-level, communication protocol (union type by role)
 * - core Message: Business-level, persistent record (unified interface with agentId)
 */

import type { ContentPart, Message as TypesMessage } from "@deepractice-ai/agentx-types";

/**
 * Message role types
 *
 * Note: "error" has been removed. Errors are now handled via independent
 * ErrorEvent (see agentx-types/event/error) which is transportable via SSE.
 */
export type MessageRole = "user" | "assistant" | "tool" | "system";

/**
 * Message - A record in session history
 */
export interface Message {
  /**
   * Unique message ID
   */
  id: string;

  /**
   * Which Agent produced this message
   */
  agentId: string;

  /**
   * Message role
   */
  role: MessageRole;

  /**
   * Message content
   */
  content: string | ContentPart[];

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Optional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Create a new message
 */
export function createMessage(
  agentId: string,
  role: MessageRole,
  content: string | ContentPart[],
  metadata?: Record<string, unknown>
): Message {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    agentId,
    role,
    content,
    timestamp: Date.now(),
    metadata,
  };
}

/**
 * Convert industry-level Message to business-level Message
 */
export function fromTypesMessage(msg: TypesMessage, agentId: string): Message {
  let role: MessageRole;
  let content: string | ContentPart[];

  // Use subtype for discrimination
  switch (msg.subtype) {
    case "user":
      role = "user";
      content = msg.content;
      break;
    case "assistant":
      role = "assistant";
      content = msg.content;
      break;
    case "tool-call":
      role = "tool";
      content = [msg.toolCall];
      break;
    case "tool-result":
      role = "tool";
      content = [msg.toolResult];
      break;
    case "system":
      role = "system";
      content = msg.content;
      break;
    // Note: "error" case removed. Errors are now handled via ErrorEvent.
    default:
      role = "assistant";
      content = "";
  }

  return {
    id: msg.id,
    agentId,
    role,
    content,
    timestamp: msg.timestamp,
    metadata: "metadata" in msg ? (msg.metadata as Record<string, unknown>) : undefined,
  };
}
