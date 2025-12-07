/**
 * Chat - Chat interface component
 *
 * Business component that combines MessagePane + InputPane with useAgent hook.
 * Displays messages and handles sending/receiving.
 *
 * In the Image-First model:
 * - Use imageId for conversation identity (preferred)
 * - Agent is auto-activated on first message
 * - Messages are auto-saved
 *
 * @example
 * ```tsx
 * <Chat
 *   agentx={agentx}
 *   imageId={currentImageId}
 * />
 * ```
 */

import * as React from "react";
import type { AgentX } from "agentxjs";
import { Save, Smile, Paperclip, FolderOpen } from "lucide-react";
import { MessagePane, InputPane, type MessagePaneItem, type ToolBarItem } from "~/components/pane";
import { useAgent, type UIMessage } from "~/hooks";
import { cn } from "~/utils";
import { ChatHeader } from "./ChatHeader";

export interface ChatProps {
  /**
   * AgentX instance
   */
  agentx: AgentX | null;
  /**
   * Image ID for the conversation (preferred in Image-First model)
   */
  imageId?: string | null;
  /**
   * Agent ID to chat with (legacy, use imageId instead)
   * @deprecated Use imageId instead
   */
  agentId?: string | null;
  /**
   * Agent name to display in header
   */
  agentName?: string;
  /**
   * Callback when save button is clicked
   * Note: In Image-First model, messages are auto-saved
   */
  onSave?: () => void;
  /**
   * Show save button in toolbar
   * @default true
   */
  showSaveButton?: boolean;
  /**
   * Input placeholder text
   */
  placeholder?: string;
  /**
   * Height ratio for input pane (0-1)
   * @default 0.25
   */
  inputHeightRatio?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Convert UIMessage to MessagePaneItem
 */
function toMessagePaneItem(msg: UIMessage): MessagePaneItem {
  return {
    id: msg.id,
    role: msg.role === "tool_call" || msg.role === "tool_result" ? "tool" : msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    metadata: msg.role === "tool_call" || msg.role === "tool_result"
      ? { toolName: msg.role === "tool_call" ? "Tool Call" : "Tool Result" }
      : undefined,
  };
}

/**
 * Chat component
 */
export function Chat({
  agentx,
  imageId,
  agentId: legacyAgentId,
  agentName,
  onSave,
  showSaveButton = true,
  placeholder = "Type a message...",
  inputHeightRatio = 0.25,
  className,
}: ChatProps) {
  // Use imageId if provided, otherwise fall back to agentId
  const identifier = imageId
    ? { imageId }
    : legacyAgentId
    ? legacyAgentId
    : null;

  const {
    messages,
    streaming,
    status,
    send,
    interrupt,
  } = useAgent(agentx, identifier);

  // Map UIMessage[] to MessagePaneItem[]
  const items: MessagePaneItem[] = React.useMemo(() => {
    return messages.map(toMessagePaneItem);
  }, [messages]);

  // Determine loading state
  const isLoading = status === "thinking" || status === "responding" || status === "tool_executing";

  // Toolbar items
  const toolbarItems: ToolBarItem[] = React.useMemo(() => {
    const items: ToolBarItem[] = [
      { id: "emoji", icon: <Smile className="w-4 h-4" />, label: "Emoji" },
      { id: "attach", icon: <Paperclip className="w-4 h-4" />, label: "Attach" },
      { id: "folder", icon: <FolderOpen className="w-4 h-4" />, label: "File" },
    ];
    return items;
  }, []);

  const toolbarRightItems: ToolBarItem[] = React.useMemo(() => {
    if (!showSaveButton || !onSave) return [];
    return [
      { id: "save", icon: <Save className="w-4 h-4" />, label: "Save conversation" },
    ];
  }, [showSaveButton, onSave]);

  const handleToolbarClick = React.useCallback(
    (id: string) => {
      if (id === "save" && onSave) {
        onSave();
      }
      // Other toolbar actions can be added here
    },
    [onSave]
  );

  // Calculate heights
  const inputHeight = `${Math.round(inputHeightRatio * 100)}%`;
  const messageHeight = `${Math.round((1 - inputHeightRatio) * 100)}%`;

  // Show empty state if no conversation selected
  if (!imageId && !legacyAgentId) {
    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No conversation selected</p>
            <p className="text-sm">Select a conversation or start a new one</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <ChatHeader
        agentName={agentName}
        status={status}
        messageCount={messages.length}
      />

      {/* Message area */}
      <div style={{ height: messageHeight }} className="min-h-0">
        <MessagePane
          items={items}
          streamingText={streaming}
          isLoading={isLoading && !streaming}
        />
      </div>

      {/* Input area */}
      <div style={{ height: inputHeight }} className="min-h-0">
        <InputPane
          onSend={send}
          onStop={interrupt}
          isLoading={isLoading}
          placeholder={placeholder}
          toolbarItems={toolbarItems}
          toolbarRightItems={toolbarRightItems}
          onToolbarItemClick={handleToolbarClick}
        />
      </div>
    </div>
  );
}
