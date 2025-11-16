/**
 * Stream Reactor
 *
 * Type-safe contract for handling all Stream layer events.
 * Implementing this interface ensures you handle every streaming event type.
 *
 * Usage:
 * ```typescript
 * class MyStreamHandler implements StreamReactor {
 *   onMessageStart(event: MessageStartEvent) {
 *     console.log("Message started:", event.data.message.id);
 *   }
 *
 *   onTextDelta(event: TextDeltaEvent) {
 *     process.stdout.write(event.data.text);
 *   }
 *
 *   // ... must implement all methods
 * }
 *
 * const handler = new MyStreamHandler();
 * bindStreamReactor(consumer, handler);
 * ```
 */

import type { MessageStartEvent } from "./MessageStartEvent";
import type { MessageDeltaEvent } from "./MessageDeltaEvent";
import type { MessageStopEvent } from "./MessageStopEvent";
import type { TextContentBlockStartEvent } from "./TextContentBlockStartEvent";
import type { TextDeltaEvent } from "./TextDeltaEvent";
import type { TextContentBlockStopEvent } from "./TextContentBlockStopEvent";
import type { ToolUseContentBlockStartEvent } from "./ToolUseContentBlockStartEvent";
import type { InputJsonDeltaEvent } from "./InputJsonDeltaEvent";
import type { ToolUseContentBlockStopEvent } from "./ToolUseContentBlockStopEvent";

/**
 * StreamReactor - Complete contract
 *
 * Forces implementation of ALL stream event handlers.
 * Compile-time guarantee that no event type is missed.
 */
export interface StreamReactor {
  // ===== Message Lifecycle =====

  /**
   * Handle message start event
   * Emitted when a streaming message begins
   */
  onMessageStart(event: MessageStartEvent): void | Promise<void>;

  /**
   * Handle message delta event
   * Emitted when message metadata updates during streaming
   */
  onMessageDelta(event: MessageDeltaEvent): void | Promise<void>;

  /**
   * Handle message stop event
   * Emitted when a streaming message completes
   */
  onMessageStop(event: MessageStopEvent): void | Promise<void>;

  // ===== Text Content Block =====

  /**
   * Handle text content block start
   * Emitted when text content block begins
   */
  onTextContentBlockStart(event: TextContentBlockStartEvent): void | Promise<void>;

  /**
   * Handle text delta
   * Emitted when AI generates text incrementally
   */
  onTextDelta(event: TextDeltaEvent): void | Promise<void>;

  /**
   * Handle text content block stop
   * Emitted when text content block ends
   */
  onTextContentBlockStop(event: TextContentBlockStopEvent): void | Promise<void>;

  // ===== Tool Use Content Block =====

  /**
   * Handle tool use content block start
   * Emitted when tool call begins
   */
  onToolUseContentBlockStart(event: ToolUseContentBlockStartEvent): void | Promise<void>;

  /**
   * Handle input JSON delta
   * Emitted when tool input JSON is streamed incrementally
   */
  onInputJsonDelta(event: InputJsonDeltaEvent): void | Promise<void>;

  /**
   * Handle tool use content block stop
   * Emitted when tool call ends
   */
  onToolUseContentBlockStop(event: ToolUseContentBlockStopEvent): void | Promise<void>;
}

/**
 * PartialStreamReactor - Partial implementation
 *
 * Allows implementing only the events you care about.
 * Use when you don't need to handle all stream events.
 */
export type PartialStreamReactor = Partial<StreamReactor>;
