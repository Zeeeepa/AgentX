import { useState, useEffect } from "react";
import type { Agent } from "@deepractice-ai/agentx-browser";
import type { Message } from "@deepractice-ai/agentx-types";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

export interface ChatProps {
  /**
   * Agent instance from agentx-browser
   */
  agent: Agent;

  /**
   * Initial messages to display
   */
  initialMessages?: Message[];

  /**
   * Callback when message is sent
   */
  onMessageSend?: (message: string) => void;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * Chat - Complete chat interface with real Agent integration
 *
 * Features:
 * - Real-time streaming from Claude API
 * - Message history
 * - Auto-scroll
 * - Loading states
 * - Image attachment support
 * - Full event handling (user, assistant, stream_event, result)
 *
 * @example
 * ```tsx
 * import { createAgent } from '@deepractice-ai/agentx-browser';
 *
 * const agent = createAgent({
 *   wsUrl: 'ws://localhost:5200/ws',
 *   sessionId: 'my-session',
 * });
 *
 * <Chat agent={agent} />
 * ```
 */
export function Chat({ agent, initialMessages = [], onMessageSend, className = "" }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streaming, setStreaming] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for assistant messages (complete)
    const unsubAssistant = agent.on("assistant", (event) => {
      setMessages((prev) => [
        ...prev,
        {
          id: event.uuid,
          role: "assistant",
          content: event.message.content as string,
          timestamp: event.timestamp,
        },
      ]);
      setStreaming("");
      setIsLoading(false);
    });

    // Listen for streaming chunks
    const unsubStream = agent.on("stream_event", (event) => {
      const delta = event.delta;
      if (delta?.type === "text_delta" && 'text' in delta) {
        setStreaming((prev) => prev + delta.text);
      }
    });

    // Listen for user messages
    const unsubUser = agent.on("user", (event) => {
      setMessages((prev) => [
        ...prev,
        {
          id: event.uuid,
          role: "user",
          content: event.message.content as string,
          timestamp: event.timestamp,
        },
      ]);
    });

    // Cleanup on unmount - only unsubscribe, don't destroy agent
    // Agent lifecycle is managed by parent component
    return () => {
      unsubAssistant();
      unsubStream();
      unsubUser();
    };
  }, [agent]);

  const handleSend = async (text: string) => {
    setIsLoading(true);
    onMessageSend?.(text);
    await agent.send(text);
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Messages area */}
      <ChatMessageList messages={messages} streamingText={streaming} isLoading={isLoading} />

      {/* Input area */}
      <div className="p-2 sm:p-4 md:p-4 flex-shrink-0 pb-2 sm:pb-4 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
