/**
 * AgentPane Stories
 *
 * Main chat interface for MainContent.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { AgentPane } from "./AgentPane";
import type { AgentDefinitionItem, SessionItem } from "./types";

const meta: Meta<typeof AgentPane> = {
  title: "Container/AgentPane",
  component: AgentPane,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentPane>;

// Mock data
const mockDefinition: AgentDefinitionItem = {
  name: "Claude",
  description: "General purpose assistant",
  icon: "C",
  color: "bg-blue-500",
  isOnline: true,
};

const mockSession: SessionItem = {
  sessionId: "session_1",
  agentId: "Claude",
  title: "Code Refactoring Discussion",
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 1800000,
};

/**
 * No agent selected (initial state)
 */
export const NoAgentSelected: Story = {
  args: {
    definition: null,
    session: null,
  },
};

/**
 * Agent selected but no session
 */
export const NoSessionSelected: Story = {
  args: {
    definition: mockDefinition,
    session: null,
    onCreateSession: () => console.log("Create session"),
  },
};

/**
 * Full chat interface (agent + session selected)
 */
export const WithSession: Story = {
  args: {
    definition: mockDefinition,
    session: mockSession,
    messages: [],
    streaming: undefined,
    errors: [],
    isLoading: false,
  },
};

/**
 * Offline agent
 */
export const OfflineAgent: Story = {
  args: {
    definition: {
      ...mockDefinition,
      isOnline: false,
    },
    session: mockSession,
    messages: [],
    errors: [],
    isLoading: false,
  },
};

/**
 * Different agent colors
 */
export const DifferentColors: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen">
      <div className="border border-border rounded-lg overflow-hidden">
        <AgentPane
          definition={{ name: "GPT-4", color: "bg-green-500", isOnline: true }}
          session={{ ...mockSession, title: "Green Theme" }}
          messages={[]}
          isLoading={false}
        />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <AgentPane
          definition={{ name: "Gemini", color: "bg-purple-500", isOnline: true }}
          session={{ ...mockSession, title: "Purple Theme" }}
          messages={[]}
          isLoading={false}
        />
      </div>
    </div>
  ),
};
