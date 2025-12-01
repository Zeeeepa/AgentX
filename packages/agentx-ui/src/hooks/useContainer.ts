/**
 * useContainer - React hook for Container state management
 *
 * Manages the state for:
 * - Agent definitions (available agents)
 * - Sessions (conversations with agents)
 * - Current selections
 *
 * @example
 * ```tsx
 * const {
 *   definitions,
 *   currentDefinition,
 *   sessions,
 *   currentSession,
 *   selectDefinition,
 *   selectSession,
 *   createSession,
 * } = useContainer({ initialDefinitions });
 * ```
 */

import { useState, useCallback, useMemo } from "react";
import type { Agent } from "@deepractice-ai/agentx-types";
import type {
  AgentDefinitionItem,
  SessionItem,
  UseContainerResult,
} from "~/components/container/types";

/**
 * Options for useContainer hook
 */
export interface UseContainerOptions {
  /**
   * Initial agent definitions
   */
  initialDefinitions?: AgentDefinitionItem[];

  /**
   * Initial sessions
   */
  initialSessions?: SessionItem[];

  /**
   * Callback when definition selection changes
   */
  onDefinitionChange?: (definition: AgentDefinitionItem | null) => void;

  /**
   * Callback when session selection changes
   */
  onSessionChange?: (session: SessionItem | null) => void;

  /**
   * Factory function to create Agent instance
   */
  createAgent?: (definition: AgentDefinitionItem, session: SessionItem) => Agent | null;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * React hook for Container state management
 */
export function useContainer(options: UseContainerOptions = {}): UseContainerResult {
  const {
    initialDefinitions = [],
    initialSessions = [],
    onDefinitionChange,
    onSessionChange,
    createAgent,
  } = options;

  // State
  const [definitions, setDefinitions] = useState<AgentDefinitionItem[]>(initialDefinitions);
  const [currentDefinition, setCurrentDefinition] = useState<AgentDefinitionItem | null>(
    initialDefinitions[0] ?? null
  );
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [currentSession, setCurrentSession] = useState<SessionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Filter sessions for current definition
  const filteredSessions = useMemo(() => {
    if (!currentDefinition) return [];
    return sessions.filter((s) => s.agentId === currentDefinition.name);
  }, [sessions, currentDefinition]);

  // Create current agent instance
  const currentAgent = useMemo(() => {
    if (!currentDefinition || !currentSession || !createAgent) return null;
    return createAgent(currentDefinition, currentSession);
  }, [currentDefinition, currentSession, createAgent]);

  // Select definition
  const selectDefinition = useCallback(
    (definition: AgentDefinitionItem) => {
      setCurrentDefinition(definition);
      setCurrentSession(null); // Reset session when switching agent
      onDefinitionChange?.(definition);
    },
    [onDefinitionChange]
  );

  // Select session
  const selectSession = useCallback(
    (session: SessionItem) => {
      setCurrentSession(session);
      onSessionChange?.(session);
    },
    [onSessionChange]
  );

  // Create new session
  const createSession = useCallback(
    async (title?: string): Promise<SessionItem> => {
      if (!currentDefinition) {
        throw new Error("No agent definition selected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const now = Date.now();
        const newSession: SessionItem = {
          sessionId: `session_${generateId()}`,
          agentId: currentDefinition.name,
          title: title ?? null,
          createdAt: now,
          updatedAt: now,
        };

        setSessions((prev) => [newSession, ...prev]);
        setCurrentSession(newSession);
        onSessionChange?.(newSession);

        return newSession;
      } finally {
        setIsLoading(false);
      }
    },
    [currentDefinition, onSessionChange]
  );

  // Delete session
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    setCurrentSession((prev) => (prev?.sessionId === sessionId ? null : prev));
  }, []);

  // Update session title
  const setSessionTitle = useCallback(async (sessionId: string, title: string): Promise<void> => {
    setSessions((prev) =>
      prev.map((s) => (s.sessionId === sessionId ? { ...s, title, updatedAt: Date.now() } : s))
    );
  }, []);

  // Add definition
  const addDefinition = useCallback((definition: AgentDefinitionItem) => {
    setDefinitions((prev) => {
      // Prevent duplicates
      if (prev.some((d) => d.name === definition.name)) return prev;
      return [...prev, definition];
    });
  }, []);

  // Remove definition
  const removeDefinition = useCallback(
    (name: string) => {
      setDefinitions((prev) => prev.filter((d) => d.name !== name));
      if (currentDefinition?.name === name) {
        setCurrentDefinition(null);
        setCurrentSession(null);
      }
    },
    [currentDefinition]
  );

  return {
    // State
    definitions,
    currentDefinition,
    sessions: filteredSessions,
    currentSession,
    currentAgent,
    isLoading,
    error,

    // Actions
    selectDefinition,
    selectSession,
    createSession,
    deleteSession,
    setSessionTitle,
    addDefinition,
    removeDefinition,
  };
}
