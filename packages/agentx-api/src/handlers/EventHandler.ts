/**
 * EventHandler
 *
 * Responsibility Chain pattern for converting AgentEvents to application-specific models.
 *
 * This is the second transformation layer in the AgentX architecture:
 * AgentEvent → Application Model (UI Message, DB Record, Metrics, etc.)
 *
 * Usage:
 * - Implement this interface in consumer packages (agentx-ui, backend services)
 * - Each handler focuses on one event type
 * - Type guard ensures type safety in handle() method
 *
 * @example
 * ```typescript
 * class ToolUseEventHandler implements EventHandler<ToolUseEvent, ToolMessage> {
 *   canHandle(event: AgentEvent): event is ToolUseEvent {
 *     return event.type === 'tool_use';
 *   }
 *
 *   handle(event: ToolUseEvent): ToolMessage {
 *     return {
 *       id: event.uuid,
 *       role: 'tool',
 *       content: formatToolUse(event.toolUse),
 *       timestamp: event.timestamp,
 *     };
 *   }
 * }
 * ```
 */

import type { AgentEvent } from "../events";

/**
 * EventHandler interface
 *
 * Converts AgentEvents to application-specific models.
 *
 * @template TEvent - AgentEvent subtype that this handler processes
 * @template TOutput - Application model type (Message, DBRecord, Metric, etc.)
 */
export interface EventHandler<TEvent extends AgentEvent, TOutput> {
  /**
   * Check if this handler can process the given event (type guard)
   *
   * @param event - AgentEvent to check
   * @returns true if this handler can process the event
   *
   * @remarks
   * TypeScript will narrow the type in handle() based on this guard
   */
  canHandle(event: AgentEvent): event is TEvent;

  /**
   * Transform AgentEvent to application model(s)
   *
   * @param event - AgentEvent to transform (type narrowed by canHandle)
   * @returns One or more application models, or null if event should be ignored
   *
   * @remarks
   * - Returns null to skip event (e.g., filter out certain events)
   * - Returns single model for most cases
   * - Returns array when one event produces multiple models
   */
  handle(event: TEvent): TOutput | TOutput[] | null;
}
