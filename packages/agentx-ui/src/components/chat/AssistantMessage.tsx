import type { AssistantMessage as AssistantMessageType } from "@deepractice-ai/agentx-types";
import { MessageAvatar } from "~/components/elements/MessageAvatar";
import { Bot } from "lucide-react";
import { TextContent } from "./parts/TextContent";

export interface AssistantMessageProps {
  /**
   * Assistant message data
   */
  message: AssistantMessageType;

  /**
   * Whether this message is currently streaming
   */
  isStreaming?: boolean;
}

/**
 * AssistantMessage - Display an AI assistant message
 *
 * Features:
 * - AI avatar (blue color)
 * - Text content rendering
 * - Thinking process (collapsible)
 * - Tool calls display
 * - File attachments
 * - Streaming support
 *
 * @example
 * ```tsx
 * <AssistantMessage message={{
 *   id: '2',
 *   role: 'assistant',
 *   content: 'Here is the answer...',
 *   timestamp: Date.now()
 * }} />
 * ```
 */
export function AssistantMessage({ message, isStreaming = false }: AssistantMessageProps) {
  return (
    <div className="chat-message assistant">
      <div className="w-full">
        {/* Avatar */}
        <MessageAvatar
          label="Agent"
          variant="primary"
          icon={<Bot className="w-5 h-5 text-white" />}
          size="md"
        />

        {/* Content */}
        <div className="pl-3 sm:pl-0">
          {typeof message.content === "string" ? (
            <TextContent text={message.content} isStreaming={isStreaming} />
          ) : (
            message.content.map((part, idx) => {
              switch (part.type) {
                case "text":
                  return (
                    <TextContent key={idx} text={part.text} isStreaming={isStreaming && idx === message.content.length - 1} />
                  );
                case "thinking":
                  // TODO: Implement ThinkingContent component
                  return (
                    <div key={idx} className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                      💭 Thinking: {part.reasoning}
                    </div>
                  );
                case "tool-call":
                  // TODO: Implement ToolCallContent component
                  return (
                    <div key={idx} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2">
                      🔧 Tool: {part.name}
                    </div>
                  );
                case "file":
                  // TODO: Implement FileContent component
                  return (
                    <div key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                      📎 File: {part.filename || "Unnamed file"}
                    </div>
                  );
                default:
                  return null;
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
