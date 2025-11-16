/**
 * MessageHandler
 *
 * Responsibility Chain pattern for converting external messages to AgentEvents.
 *
 * This is the first transformation layer in the AgentX architecture:
 * External Message (SDK/WebSocket/etc.) → AgentEvent
 *
 * Usage:
 * - Implement this interface in platform-specific packages (agentx-node, agentx-browser)
 * - Each handler focuses on one type of external message
 * - Handlers can maintain state for multi-step transformations (e.g., streaming tool_use)
 *
 * @example
 * ```typescript
 * class ToolUseSDKHandler implements MessageHandler<SDKMessage, ToolUseEvent> {
 *   canHandle(message: SDKMessage): boolean {
 *     return message.type === 'stream_event' &&
 *            message.event.type === 'content_block_start' &&
 *            message.event.content_block?.type === 'tool_use';
 *   }
 *
 *   handle(message: SDKMessage): ToolUseEvent | null {
 *     // Transform SDK message to ToolUseEvent
 *   }
 * }
 * ```
 */

import type { AgentEvent } from "@deepractice-ai/agentx-api";

/**
 * MessageHandler interface
 *
 * Converts external messages to AgentEvents.
 *
 * @template TInput - External message type (SDKMessage, WebSocketMessage, etc.)
 * @template TEvent - AgentEvent subtype that this handler produces
 */
export interface MessageHandler<TInput, TEvent extends AgentEvent = AgentEvent> {
  /**
   * Check if this handler can process the given message
   *
   * @param message - External message to check
   * @returns true if this handler can process the message
   */
  canHandle(message: TInput): boolean;

  /**
   * Transform external message to AgentEvent(s)
   *
   * @param message - External message to transform
   * @returns One or more AgentEvents, or null if no event should be emitted
   *
   * @remarks
   * - Returns null when message is intermediate state (e.g., streaming chunks)
   * - Returns single event for most cases
   * - Returns array when one message produces multiple events
   */
  handle(message: TInput): TEvent | TEvent[] | null;
}
