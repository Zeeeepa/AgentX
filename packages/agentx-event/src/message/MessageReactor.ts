/**
 * Message Reactor
 *
 * Type-safe contract for handling all Message layer events.
 * Implementing this interface ensures you handle every message type.
 *
 * Usage:
 * ```typescript
 * class ChatHistoryManager implements MessageReactor {
 *   onUserMessage(event: UserMessageEvent) {
 *     this.history.push({
 *       role: "user",
 *       content: event.data.content,
 *       timestamp: event.timestamp
 *     });
 *   }
 *
 *   onAssistantMessage(event: AssistantMessageEvent) {
 *     this.history.push({
 *       role: "assistant",
 *       content: event.data.content,
 *       timestamp: event.timestamp
 *     });
 *   }
 *
 *   // ... must implement all message handlers
 * }
 *
 * const chatManager = new ChatHistoryManager();
 * bindMessageReactor(consumer, chatManager);
 * ```
 */

import type { UserMessageEvent } from "./UserMessageEvent";
import type { AssistantMessageEvent } from "./AssistantMessageEvent";
import type { ToolUseMessageEvent } from "./ToolUseMessageEvent";
import type { ErrorMessageEvent } from "./ErrorMessageEvent";

/**
 * MessageReactor - Complete contract
 *
 * Forces implementation of ALL message event handlers.
 * Compile-time guarantee that no message type is missed.
 */
export interface MessageReactor {
  /**
   * Handle user message
   * Emitted when user sends a message
   */
  onUserMessage(event: UserMessageEvent): void | Promise<void>;

  /**
   * Handle assistant message
   * Emitted when assistant completes a response
   */
  onAssistantMessage(event: AssistantMessageEvent): void | Promise<void>;

  /**
   * Handle tool use message
   * Emitted when a complete tool usage (call + result) is recorded
   */
  onToolUseMessage(event: ToolUseMessageEvent): void | Promise<void>;

  /**
   * Handle error message
   * Emitted when an error occurs that should be displayed to user
   */
  onErrorMessage(event: ErrorMessageEvent): void | Promise<void>;
}

/**
 * PartialMessageReactor - Partial implementation
 *
 * Allows implementing only the message types you care about.
 * Use when you don't need to handle all message events.
 */
export type PartialMessageReactor = Partial<MessageReactor>;
