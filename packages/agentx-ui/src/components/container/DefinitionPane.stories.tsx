/**
 * DefinitionPane Stories
 *
 * Agent selection panel for ActivityBar.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DefinitionPane } from "./DefinitionPane";
import type { AgentDefinitionItem } from "./types";

const meta: Meta<typeof DefinitionPane> = {
  title: "Container/DefinitionPane",
  component: DefinitionPane,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-14 h-[500px] bg-sidebar border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DefinitionPane>;

// Mock data
const mockDefinitions: AgentDefinitionItem[] = [
  {
    name: "Claude",
    description: "General purpose assistant",
    icon: "C",
    color: "bg-blue-500",
    isOnline: true,
    activeSessionCount: 2,
  },
  {
    name: "GPT-4",
    description: "Code expert",
    icon: "G",
    color: "bg-green-500",
    isOnline: true,
    activeSessionCount: 0,
  },
  {
    name: "Gemini",
    description: "Multimodal assistant",
    icon: "G",
    color: "bg-purple-500",
    isOnline: false,
    activeSessionCount: 1,
  },
  {
    name: "Llama",
    description: "Open source model",
    icon: "L",
    color: "bg-amber-500",
    isOnline: true,
  },
];

/**
 * Default state with multiple agents
 */
function DefaultComponent() {
  const [current, setCurrent] = useState<AgentDefinitionItem | null>(mockDefinitions[0]);

  return (
    <DefinitionPane
      definitions={mockDefinitions}
      current={current}
      onSelect={setCurrent}
      onAdd={() => console.log("Add agent")}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultComponent />,
};

/**
 * Single agent
 */
function SingleAgentComponent() {
  const [current, setCurrent] = useState<AgentDefinitionItem | null>(mockDefinitions[0]);

  return (
    <DefinitionPane
      definitions={[mockDefinitions[0]]}
      current={current}
      onSelect={setCurrent}
      onAdd={() => console.log("Add agent")}
    />
  );
}

export const SingleAgent: Story = {
  render: () => <SingleAgentComponent />,
};

/**
 * No agents (empty state)
 */
export const Empty: Story = {
  render: () => (
    <DefinitionPane
      definitions={[]}
      current={null}
      onSelect={() => {}}
      onAdd={() => console.log("Add agent")}
    />
  ),
};

/**
 * Without add button
 */
function WithoutAddButtonComponent() {
  const [current, setCurrent] = useState<AgentDefinitionItem | null>(mockDefinitions[0]);

  return <DefinitionPane definitions={mockDefinitions} current={current} onSelect={setCurrent} />;
}

export const WithoutAddButton: Story = {
  render: () => <WithoutAddButtonComponent />,
};

/**
 * With emoji icons
 */
function WithEmojiIconsComponent() {
  const emojiDefinitions: AgentDefinitionItem[] = [
    { name: "Claude", icon: "🤖", color: "bg-blue-500", isOnline: true },
    { name: "Writer", icon: "✍️", color: "bg-green-500", isOnline: true },
    { name: "Coder", icon: "💻", color: "bg-purple-500", isOnline: true },
    { name: "Artist", icon: "🎨", color: "bg-amber-500", isOnline: false },
  ];

  const [current, setCurrent] = useState<AgentDefinitionItem | null>(emojiDefinitions[0]);

  return (
    <DefinitionPane
      definitions={emojiDefinitions}
      current={current}
      onSelect={setCurrent}
      onAdd={() => console.log("Add agent")}
    />
  );
}

export const WithEmojiIcons: Story = {
  render: () => <WithEmojiIconsComponent />,
};
