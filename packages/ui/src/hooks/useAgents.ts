/**
 * useAgents - React hook for Agent (active runtime instances) management
 *
 * Agents are active runtime instances running in containers.
 * This hook manages querying and destroying active agents.
 *
 * @example
 * ```tsx
 * import { useAgents } from "@agentxjs/ui";
 *
 * function AgentList({ agentx, containerId }) {
 *   const {
 *     agents,
 *     isLoading,
 *     refresh,
 *     destroyAgent,
 *   } = useAgents(agentx, containerId);
 *
 *   return (
 *     <div>
 *       {agents.map(agent => (
 *         <AgentItem
 *           key={agent.agentId}
 *           agent={agent}
 *           onDestroy={() => destroyAgent(agent.agentId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import type { AgentX } from "agentxjs";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("ui/useAgents");

/**
 * Agent record from agent_list_response
 */
export interface AgentRecord {
  agentId: string;
  containerId: string;
}

/**
 * Return type of useAgents hook
 */
export interface UseAgentsResult {
  /**
   * All active agents in the container
   */
  agents: AgentRecord[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Refresh agents from server
   */
  refresh: () => Promise<void>;

  /**
   * Destroy an agent
   */
  destroyAgent: (agentId: string) => Promise<void>;
}

/**
 * Options for useAgents hook
 */
export interface UseAgentsOptions {
  /**
   * Auto-load agents on mount
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Callback when agents list changes
   */
  onAgentsChange?: (agents: AgentRecord[]) => void;
}

/**
 * React hook for Agent management
 *
 * @param agentx - AgentX instance
 * @param containerId - Container ID to query agents from
 * @param options - Optional configuration
 * @returns Agent state and operations
 */
export function useAgents(
  agentx: AgentX | null,
  containerId: string,
  options: UseAgentsOptions = {}
): UseAgentsResult {
  const { autoLoad = true, onAgentsChange } = options;

  // State
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load agents from server
  const loadAgents = useCallback(async () => {
    if (!agentx) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await agentx.request("agent_list_request", { containerId });
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      const records = response.data.agents ?? [];
      setAgents(records);
      onAgentsChange?.(records);
      logger.debug("Loaded agents", { containerId, count: records.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error("Failed to load agents", { containerId, error });
    } finally {
      setIsLoading(false);
    }
  }, [agentx, containerId, onAgentsChange]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && agentx) {
      loadAgents();
    }
  }, [autoLoad, agentx, loadAgents]);

  // Destroy an agent
  const destroyAgent = useCallback(
    async (agentId: string): Promise<void> => {
      if (!agentx) {
        throw new Error("AgentX not available");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await agentx.request("agent_destroy_request", { agentId });
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        const newAgents = agents.filter((agent) => agent.agentId !== agentId);
        setAgents(newAgents);
        onAgentsChange?.(newAgents);
        logger.info("Destroyed agent", { agentId });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error("Failed to destroy agent", { agentId, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agentx, agents, onAgentsChange]
  );

  return {
    agents,
    isLoading,
    error,
    refresh: loadAgents,
    destroyAgent,
  };
}
