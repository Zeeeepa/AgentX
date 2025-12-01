/**
 * Container Component Types
 *
 * UI-specific types extending core agentx-types for display purposes.
 */

import type { AgentDefinition, Agent } from "@deepractice-ai/agentx-types";

/**
 * Session item for UI display (pure data, no methods)
 *
 * Core fields come from Session interface.
 * Additional fields (preview, unreadCount) are computed/derived by UI.
 */
export interface SessionItem {
  /**
   * Unique session identifier
   */
  sessionId: string;

  /**
   * Associated agent ID
   */
  agentId: string;

  /**
   * Display title (can be AI-generated summary)
   */
  title: string | null;

  /**
   * Session creation timestamp (Unix ms)
   */
  createdAt: number;

  /**
   * Last update timestamp (Unix ms)
   */
  updatedAt: number;

  // ===== UI computed fields (not from Session) =====

  /**
   * Preview text (last message snippet) - computed from messages
   */
  preview?: string;

  /**
   * Unread message count - computed by UI
   */
  unreadCount?: number;
}

/**
 * Extended AgentDefinition with UI metadata
 */
export interface AgentDefinitionItem extends AgentDefinition {
  /**
   * Icon identifier or emoji
   */
  icon?: string;

  /**
   * Badge color for visual distinction
   */
  color?: string;

  /**
   * Whether this agent is online/available
   */
  isOnline?: boolean;

  /**
   * Number of active sessions
   */
  activeSessionCount?: number;
}

/**
 * Container state for UI components
 */
export interface ContainerState {
  /**
   * Available agent definitions
   */
  definitions: AgentDefinitionItem[];

  /**
   * Currently selected agent definition
   */
  currentDefinition: AgentDefinitionItem | null;

  /**
   * Sessions for the current agent
   */
  sessions: SessionItem[];

  /**
   * Currently selected session
   */
  currentSession: SessionItem | null;

  /**
   * Currently active agent instance (runtime)
   */
  currentAgent: Agent | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;
}

/**
 * Container actions for UI components
 */
export interface ContainerActions {
  /**
   * Select an agent definition
   */
  selectDefinition: (definition: AgentDefinitionItem) => void;

  /**
   * Select a session
   */
  selectSession: (session: SessionItem) => void;

  /**
   * Create a new session for the current agent
   */
  createSession: (title?: string) => Promise<SessionItem>;

  /**
   * Delete a session
   */
  deleteSession: (sessionId: string) => Promise<void>;

  /**
   * Update session title
   */
  setSessionTitle: (sessionId: string, title: string) => Promise<void>;

  /**
   * Add a new agent definition
   */
  addDefinition: (definition: AgentDefinitionItem) => void;

  /**
   * Remove an agent definition
   */
  removeDefinition: (name: string) => void;
}

/**
 * Combined container result for render props
 */
export interface UseContainerResult extends ContainerState, ContainerActions {}
