/**
 * AgentList - Conversation list component
 *
 * Business component that combines ListPane with useImages hook.
 * Displays saved conversations (Images) and handles CRUD operations.
 *
 * @example
 * ```tsx
 * <AgentList
 *   agentx={agentx}
 *   selectedId={currentImageId}
 *   onSelect={(agentId, imageId) => {
 *     setCurrentAgentId(agentId);
 *     setCurrentImageId(imageId);
 *   }}
 *   onNew={(agentId) => setCurrentAgentId(agentId)}
 * />
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { MessageSquare } from "lucide-react";
import { ListPane, type ListPaneItem } from "~/components/pane";
import { useImages, useAgents } from "~/hooks";
import { AgentLogo } from "~/components/element/AgentLogo";
import { Badge } from "~/components/element/Badge";

export interface AgentListProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Container ID for creating new agents
   * @default "default"
   */
  containerId?: string;
  /**
   * Currently selected image ID
   */
  selectedId?: string | null;
  /**
   * Callback when a conversation is selected
   * @param agentId - The agent ID (either active agent or from resume)
   * @param imageId - The selected image ID (null for active agents)
   */
  onSelect?: (agentId: string, imageId: string | null) => void;
  /**
   * Callback when a new conversation is created
   * @param agentId - The new agent ID
   */
  onNew?: (agentId: string) => void;
  /**
   * Title displayed in header
   * @default "Conversations"
   */
  title?: string;
  /**
   * Enable search functionality
   * @default true
   */
  searchable?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * AgentList component
 */
export function AgentList({
  agentx,
  containerId = "default",
  selectedId,
  onSelect,
  onNew,
  title = "Conversations",
  searchable = true,
  className,
}: AgentListProps) {
  const {
    images,
    isLoading: isLoadingImages,
    resumeImage,
    deleteImage,
  } = useImages(agentx);

  const {
    agents,
    isLoading: isLoadingAgents,
    refresh: refreshAgents,
  } = useAgents(agentx, containerId);

  const isLoading = isLoadingImages || isLoadingAgents;

  // Map both active agents and saved images to ListPaneItem[]
  const items: ListPaneItem[] = React.useMemo(() => {
    const result: ListPaneItem[] = [];

    // Add active agents (not yet saved)
    // Filter out agents that are already saved as images
    const imageAgentIds = new Set(images.map((img) => img.agentId).filter(Boolean));
    const activeAgents = agents.filter((agent) => !imageAgentIds.has(agent.agentId));

    activeAgents.forEach((agent) => {
      result.push({
        id: agent.agentId,
        title: "New Conversation",
        leading: <AgentLogo className="w-3 h-3" />,
        trailing: (
          <Badge variant="default" className="text-xs px-1 py-0">
            Active
          </Badge>
        ),
        timestamp: Date.now(), // Active agents show at the top
      });
    });

    // Add saved images
    images.forEach((img) => {
      result.push({
        id: img.imageId,
        title: img.name || "Untitled",
        leading: <AgentLogo className="w-3 h-3" />,
        trailing: img.messages?.length > 0 ? (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {img.messages.length}
          </Badge>
        ) : undefined,
        timestamp: img.createdAt,
      });
    });

    return result;
  }, [agents, images]);

  // Handle selecting an item (either active agent or saved image)
  const handleSelect = React.useCallback(
    async (id: string) => {
      if (!agentx) return;
      try {
        // Check if id is an active agent
        const isAgent = agents.some((agent) => agent.agentId === id);

        if (isAgent) {
          // Select active agent directly
          onSelect?.(id, null);
        } else {
          // Resume saved image
          const { agentId } = await resumeImage(id);
          onSelect?.(agentId, id);
        }
      } catch (error) {
        console.error("Failed to select conversation:", error);
      }
    },
    [agentx, agents, resumeImage, onSelect]
  );

  // Handle creating a new conversation
  const handleNew = React.useCallback(async () => {
    console.log("[AgentList] handleNew called, agentx:", !!agentx);
    if (!agentx) {
      console.warn("[AgentList] agentx is null, cannot create new conversation");
      return;
    }
    try {
      console.log("[AgentList] Creating new agent with containerId:", containerId);
      // Create a new agent
      const response = await agentx.request("agent_run_request", {
        containerId,
        config: { name: "New Conversation" },
      });
      console.log("[AgentList] Response:", response);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const { agentId } = response.data;
      if (agentId) {
        console.log("[AgentList] New agent created:", agentId);
        // Refresh agent list to show the new agent
        await refreshAgents();
        onNew?.(agentId);
      }
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  }, [agentx, containerId, refreshAgents, onNew]);

  // Handle deleting an image
  const handleDelete = React.useCallback(
    async (imageId: string) => {
      try {
        await deleteImage(imageId);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [deleteImage]
  );

  return (
    <ListPane
      title={title}
      items={items}
      selectedId={selectedId}
      isLoading={isLoading}
      searchable={searchable}
      searchPlaceholder="Search conversations..."
      showNewButton
      newButtonLabel="New conversation"
      emptyState={{
        icon: <MessageSquare className="w-6 h-6" />,
        title: "No conversations yet",
        description: "Start a new conversation to begin",
        actionLabel: "New conversation",
      }}
      onSelect={handleSelect}
      onDelete={handleDelete}
      onNew={handleNew}
      className={className}
    />
  );
}
