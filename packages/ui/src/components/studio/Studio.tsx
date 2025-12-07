/**
 * Studio - Complete chat workspace
 *
 * Top-level component that provides a ready-to-use chat interface.
 * Combines AgentList and Chat with coordinated state management.
 *
 * Layout (WeChat style):
 * ```
 * ┌──────────────┬─────────────────────────────────────┐
 * │              │                                     │
 * │  AgentList   │              Chat                   │
 * │  (sidebar)   │                                     │
 * │              │  ┌─────────────────────────────────┐│
 * │  [Images]    │  │      MessagePane                ││
 * │              │  └─────────────────────────────────┘│
 * │              │  ┌─────────────────────────────────┐│
 * │  [+ New]     │  │      InputPane                  ││
 * │              │  └─────────────────────────────────┘│
 * └──────────────┴─────────────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * import { Studio } from "@agentxjs/ui";
 * import { useAgentX } from "@agentxjs/ui";
 *
 * function App() {
 *   const agentx = useAgentX({ server: "ws://localhost:5200" });
 *   return <Studio agentx={agentx} />;
 * }
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { AgentList } from "~/components/container/AgentList";
import { Chat } from "~/components/container/Chat";
import { ToastContainer, useToast } from "~/components/element/Toast";
import { useImages } from "~/hooks";
import { cn } from "~/utils";

export interface StudioProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Width of the sidebar (AgentList)
   * @default 280
   */
  sidebarWidth?: number;
  /**
   * Enable search in AgentList
   * @default true
   */
  searchable?: boolean;
  /**
   * Show save button in Chat
   * @default true
   */
  showSaveButton?: boolean;
  /**
   * Input height ratio for Chat
   * @default 0.25
   */
  inputHeightRatio?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Studio component
 */
export function Studio({
  agentx,
  sidebarWidth = 280,
  searchable = true,
  showSaveButton = true,
  inputHeightRatio = 0.25,
  className,
}: StudioProps) {
  // State
  const [currentAgentId, setCurrentAgentId] = React.useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = React.useState<string | null>(null);
  const [currentAgentName, setCurrentAgentName] = React.useState<string | undefined>(undefined);

  // Toast state
  const { toasts, showToast, dismissToast } = useToast();

  // Images hook for snapshotting
  const { images, snapshotAgent, refresh: refreshImages } = useImages(agentx, {
    autoLoad: false,
  });

  // Handle selecting a conversation
  const handleSelect = React.useCallback(
    (agentId: string, imageId: string | null) => {
      setCurrentAgentId(agentId);
      setCurrentImageId(imageId);

      // Set agent name based on image
      if (imageId) {
        const image = images.find((img) => img.imageId === imageId);
        setCurrentAgentName(image?.name || "Conversation");
      } else {
        setCurrentAgentName("New Conversation");
      }
    },
    [images]
  );

  // Handle creating a new conversation
  const handleNew = React.useCallback((agentId: string) => {
    setCurrentAgentId(agentId);
    setCurrentImageId(null);
    setCurrentAgentName("New Conversation");
  }, []);

  // Handle saving current conversation
  const handleSave = React.useCallback(async () => {
    if (!currentAgentId) return;
    try {
      const record = await snapshotAgent(currentAgentId);
      setCurrentImageId(record.imageId);
      await refreshImages();
      showToast("Conversation saved successfully", "info");
    } catch (error) {
      console.error("Failed to save conversation:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save conversation",
        "error"
      );
    }
  }, [currentAgentId, snapshotAgent, refreshImages, showToast]);

  // Listen to agentx system_error events
  React.useEffect(() => {
    if (!agentx) return;

    // Subscribe to system_error events
    const unsubscribe = agentx.on("system_error", (event) => {
      const errorData = event.data as {
        message: string;
        severity?: "info" | "warn" | "error" | "fatal";
      };
      showToast(errorData.message, errorData.severity || "error");
    });

    return () => {
      unsubscribe();
    };
  }, [agentx, showToast]);

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar - AgentList */}
      <div
        style={{ width: sidebarWidth }}
        className="flex-shrink-0 border-r border-border"
      >
        <AgentList
          agentx={agentx}
          selectedId={currentImageId}
          onSelect={handleSelect}
          onNew={handleNew}
          searchable={searchable}
        />
      </div>

      {/* Main area - Chat */}
      <div className="flex-1 min-w-0">
        <Chat
          agentx={agentx}
          agentId={currentAgentId}
          agentName={currentAgentName}
          onSave={handleSave}
          showSaveButton={showSaveButton}
          inputHeightRatio={inputHeightRatio}
        />
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position="top-right" />
    </div>
  );
}
