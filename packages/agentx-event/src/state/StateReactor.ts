/**
 * State Reactor
 *
 * Type-safe contract for handling all State layer events.
 * Implementing this interface ensures you handle every state transition.
 *
 * Usage:
 * ```typescript
 * class StateMachine implements StateReactor {
 *   onAgentReady(event: AgentReadyStateEvent) {
 *     this.currentState = "ready";
 *     console.log(`Agent transitioned from ${event.previousState} to ready`);
 *   }
 *
 *   onToolPlanned(event: ToolPlannedStateEvent) {
 *     this.currentState = "tool_planned";
 *     this.toolName = event.data.toolUse.name;
 *   }
 *
 *   // ... must implement all state handlers
 * }
 *
 * const stateMachine = new StateMachine();
 * bindStateReactor(consumer, stateMachine);
 * ```
 */

import type { AgentInitializingStateEvent } from "./AgentInitializingStateEvent";
import type { AgentReadyStateEvent } from "./AgentReadyStateEvent";
import type { AgentDestroyedStateEvent } from "./AgentDestroyedStateEvent";
import type { ConversationStartStateEvent } from "./ConversationStartStateEvent";
import type { ConversationThinkingStateEvent } from "./ConversationThinkingStateEvent";
import type { ConversationRespondingStateEvent } from "./ConversationRespondingStateEvent";
import type { ConversationEndStateEvent } from "./ConversationEndStateEvent";
import type { ToolPlannedStateEvent } from "./ToolPlannedStateEvent";
import type { ToolExecutingStateEvent } from "./ToolExecutingStateEvent";
import type { ToolCompletedStateEvent } from "./ToolCompletedStateEvent";
import type { ToolFailedStateEvent } from "./ToolFailedStateEvent";
import type { StreamStartStateEvent } from "./StreamStartStateEvent";
import type { StreamCompleteStateEvent } from "./StreamCompleteStateEvent";
import type { ErrorOccurredStateEvent } from "./ErrorOccurredStateEvent";

/**
 * StateReactor - Complete contract
 *
 * Forces implementation of ALL state event handlers.
 * Compile-time guarantee that no state transition is missed.
 */
export interface StateReactor {
  // ===== Agent Lifecycle =====

  /**
   * Handle agent initializing state
   * Emitted when agent is starting up
   */
  onAgentInitializing(event: AgentInitializingStateEvent): void | Promise<void>;

  /**
   * Handle agent ready state
   * Emitted when agent is ready to receive requests
   */
  onAgentReady(event: AgentReadyStateEvent): void | Promise<void>;

  /**
   * Handle agent destroyed state
   * Emitted when agent is shutting down
   */
  onAgentDestroyed(event: AgentDestroyedStateEvent): void | Promise<void>;

  // ===== Conversation Lifecycle =====

  /**
   * Handle conversation start state
   * Emitted when a new conversation begins
   */
  onConversationStart(event: ConversationStartStateEvent): void | Promise<void>;

  /**
   * Handle conversation thinking state
   * Emitted when agent is processing/thinking
   */
  onConversationThinking(event: ConversationThinkingStateEvent): void | Promise<void>;

  /**
   * Handle conversation responding state
   * Emitted when agent is generating response
   */
  onConversationResponding(event: ConversationRespondingStateEvent): void | Promise<void>;

  /**
   * Handle conversation end state
   * Emitted when conversation completes
   */
  onConversationEnd(event: ConversationEndStateEvent): void | Promise<void>;

  // ===== Tool Lifecycle =====

  /**
   * Handle tool planned state
   * Emitted when agent decides to use a tool
   */
  onToolPlanned(event: ToolPlannedStateEvent): void | Promise<void>;

  /**
   * Handle tool executing state
   * Emitted when tool is running
   */
  onToolExecuting(event: ToolExecutingStateEvent): void | Promise<void>;

  /**
   * Handle tool completed state
   * Emitted when tool execution succeeds
   */
  onToolCompleted(event: ToolCompletedStateEvent): void | Promise<void>;

  /**
   * Handle tool failed state
   * Emitted when tool execution fails
   */
  onToolFailed(event: ToolFailedStateEvent): void | Promise<void>;

  // ===== Stream Lifecycle =====

  /**
   * Handle stream start state
   * Emitted when streaming begins
   */
  onStreamStart(event: StreamStartStateEvent): void | Promise<void>;

  /**
   * Handle stream complete state
   * Emitted when streaming ends
   */
  onStreamComplete(event: StreamCompleteStateEvent): void | Promise<void>;

  // ===== Error Handling =====

  /**
   * Handle error occurred state
   * Emitted when an error occurs
   */
  onErrorOccurred(event: ErrorOccurredStateEvent): void | Promise<void>;
}

/**
 * PartialStateReactor - Partial implementation
 *
 * Allows implementing only the state transitions you care about.
 * Use when you don't need to handle all state changes.
 */
export type PartialStateReactor = Partial<StateReactor>;
