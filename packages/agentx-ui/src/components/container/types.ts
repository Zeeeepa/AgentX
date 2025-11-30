/**
 * Container Component Types
 *
 * UI-specific types extending core agentx-types for display purposes.
 */

import type { AgentDefinition, Session, Agent } from "@deepractice-ai/agentx-types";

/**
 * Session status for UI display
 */
export type SessionStatus = "active" | "pending" | "completed" | "archived";

/**
 * Extended Session with UI metadata
 */
export interface SessionItem extends Session {
  /**
   * Display title for the session
   */
  title: string;

  /**
   * Session status
   */
  status: SessionStatus;

  /**
   * Last activity timestamp
   */
  lastActivityAt: number;

  /**
   * Preview text (last message snippet)
   */
  preview?: string;

  /**
   * Unread message count
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
   * Update session status
   */
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;

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
