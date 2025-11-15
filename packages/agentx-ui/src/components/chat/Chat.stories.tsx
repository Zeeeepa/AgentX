import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Chat } from "./Chat";
import { createAgent, LogLevel } from "@deepractice-ai/agentx-browser";

const meta: Meta<typeof Chat> = {
  title: "Chat/Chat",
  component: Chat,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Complete chat interface with real Agent integration. Connects to WebSocket server and streams responses from Claude API in real-time.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chat>;

/**
 * Live chat with real Agent
 *
 * Prerequisites:
 * 1. Start dev server: `pnpm dev:server`
 * 2. Server runs on ws://localhost:5200/ws
 * 3. Type a message and get real AI responses!
 */
export const LiveChat: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-chat-${Date.now()}`,
      })
    );

    return (
      <div className="h-screen">
        <Chat agent={agent} />
      </div>
    );
  },
};

/**
 * Live chat with logging enabled
 *
 * Check browser console to see:
 * - WebSocket connection events
 * - Message events
 * - Streaming events
 * - Error events
 */
export const WithLogging: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent(
        {
          wsUrl: "ws://localhost:5200/ws",
          sessionId: `story-debug-${Date.now()}`,
        },
        {
          enableLogging: true,
          logLevel: LogLevel.DEBUG,
          loggerTag: "ChatStory",
        }
      )
    );

    return (
      <div className="h-screen">
        <Chat agent={agent} />
      </div>
    );
  },
};

/**
 * Chat with initial messages
 *
 * Start with some conversation history
 */
export const WithInitialMessages: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-history-${Date.now()}`,
      })
    );

    return (
      <div className="h-screen">
        <Chat
          agent={agent}
          initialMessages={[
            {
              id: "1",
              role: "user",
              content: "Hello! What can you help me with?",
              timestamp: Date.now() - 60000,
            },
            {
              id: "2",
              role: "assistant",
              content:
                "Hello! I can help you with a variety of tasks including coding, answering questions, and providing explanations. What would you like to know?",
              timestamp: Date.now() - 30000,
            },
          ]}
        />
      </div>
    );
  },
};

/**
 * Chat with send callback
 *
 * Log messages when user sends them
 */
export const WithSendCallback: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-callback-${Date.now()}`,
      })
    );

    const handleMessageSend = (message: string) => {
      console.log("User sent:", message);
      console.log("Timestamp:", new Date().toISOString());
    };

    return (
      <div className="h-screen">
        <Chat agent={agent} onMessageSend={handleMessageSend} />
      </div>
    );
  },
};

/**
 * Compact chat (smaller viewport)
 */
export const CompactView: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-compact-${Date.now()}`,
      })
    );

    return (
      <div className="h-[600px] border rounded-lg">
        <Chat agent={agent} />
      </div>
    );
  },
};

/**
 * Side-by-side chats (multiple agents)
 */
export const SideBySide: Story = {
  render: () => {
    const [agent1] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-left-${Date.now()}`,
      })
    );

    const [agent2] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-right-${Date.now()}`,
      })
    );

    return (
      <div className="h-screen flex gap-4 p-4">
        <div className="flex-1 border rounded-lg overflow-hidden">
          <Chat agent={agent1} />
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden">
          <Chat agent={agent2} />
        </div>
      </div>
    );
  },
};

/**
 * Embedded in layout
 */
export const InLayout: Story = {
  render: () => {
    const [agent] = useState(() =>
      createAgent({
        wsUrl: "ws://localhost:5200/ws",
        sessionId: `story-layout-${Date.now()}`,
      })
    );

    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="h-14 border-b flex items-center px-4 bg-white dark:bg-gray-800">
          <h1 className="font-semibold text-lg">Deepractice Agent</h1>
        </div>

        {/* Chat area */}
        <div className="flex-1">
          <Chat agent={agent} />
        </div>
      </div>
    );
  },
};
