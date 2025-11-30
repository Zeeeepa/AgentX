/**
 * SessionPane Stories
 *
 * Session list panel for Sidebar.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SessionPane } from "./SessionPane";
import type { SessionItem } from "./types";

const meta: Meta<typeof SessionPane> = {
  title: "Container/SessionPane",
  component: SessionPane,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-72 h-[600px] bg-sidebar border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionPane>;

// Mock data
const mockSessions: SessionItem[] = [
  {
    sessionId: "session_1",
    agentId: "Claude",
    createdAt: Date.now() - 3600000,
    title: "Code Refactoring",
    status: "active",
    lastActivityAt: Date.now() - 1800000,
    preview: "Help me refactor this function to be more readable...",
    unreadCount: 2,
  },
  {
    sessionId: "session_2",
    agentId: "Claude",
    createdAt: Date.now() - 86400000,
    title: "API Design Discussion",
    status: "pending",
    lastActivityAt: Date.now() - 43200000,
    preview: "What's the best approach for REST API versioning?",
  },
  {
    sessionId: "session_3",
    agentId: "Claude",
    createdAt: Date.now() - 172800000,
    title: "Weekly Report Summary",
    status: "completed",
    lastActivityAt: Date.now() - 86400000,
    preview: "Summary of this week's progress and achievements",
  },
  {
    sessionId: "session_4",
    agentId: "Claude",
    createdAt: Date.now() - 259200000,
    title: "Performance Optimization",
    status: "completed",
    lastActivityAt: Date.now() - 172800000,
    preview: "Analyzing the database query bottleneck",
  },
  {
    sessionId: "session_5",
    agentId: "Claude",
    createdAt: Date.now() - 604800000,
    title: "Old Discussion",
    status: "archived",
    lastActivityAt: Date.now() - 604800000,
    preview: "This topic has been archived",
  },
];

/**
 * Default state with multiple sessions
 */
function DefaultComponent() {
  const [current, setCurrent] = useState<SessionItem | null>(mockSessions[0]);

  return (
    <SessionPane
      sessions={mockSessions}
      current={current}
      agentName="Claude"
      onSelect={setCurrent}
      onCreate={() => console.log("Create session")}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultComponent />,
};

/**
 * Empty state - no sessions
 */
export const Empty: Story = {
  render: () => (
    <SessionPane
      sessions={[]}
      current={null}
      agentName="Claude"
      onSelect={() => {}}
      onCreate={() => console.log("Create session")}
    />
  ),
};

/**
 * Without agent name header
 */
function WithoutAgentNameComponent() {
  const [current, setCurrent] = useState<SessionItem | null>(mockSessions[0]);

  return (
    <SessionPane
      sessions={mockSessions}
      current={current}
      onSelect={setCurrent}
      onCreate={() => console.log("Create session")}
    />
  );
}

export const WithoutAgentName: Story = {
  render: () => <WithoutAgentNameComponent />,
};

/**
 * Active sessions only
 */
function ActiveOnlyComponent() {
  const activeSessions = mockSessions.filter(
    (s) => s.status === "active" || s.status === "pending"
  );
  const [current, setCurrent] = useState<SessionItem | null>(activeSessions[0]);

  return (
    <SessionPane
      sessions={activeSessions}
      current={current}
      agentName="Claude"
      onSelect={setCurrent}
      onCreate={() => console.log("Create session")}
    />
  );
}

export const ActiveOnly: Story = {
  render: () => <ActiveOnlyComponent />,
};

/**
 * Many sessions (scrollable)
 */
function ManySessionsComponent() {
  const manySessions: SessionItem[] = Array.from({ length: 20 }, (_, i) => ({
    sessionId: `session_${i}`,
    agentId: "Claude",
    createdAt: Date.now() - i * 86400000,
    title: `Topic ${i + 1}: ${["Bug Fix", "Feature Request", "Code Review", "Discussion", "Analysis"][i % 5]}`,
    status: (["active", "pending", "completed", "archived"] as const)[i % 4],
    lastActivityAt: Date.now() - i * 43200000,
    preview: `This is a preview of session ${i + 1}...`,
    unreadCount: i % 3 === 0 ? i % 5 : undefined,
  }));

  const [current, setCurrent] = useState<SessionItem | null>(manySessions[0]);

  return (
    <SessionPane
      sessions={manySessions}
      current={current}
      agentName="Claude"
      onSelect={setCurrent}
      onCreate={() => console.log("Create session")}
    />
  );
}

export const ManySessions: Story = {
  render: () => <ManySessionsComponent />,
};

/**
 * Without create button
 */
function WithoutCreateButtonComponent() {
  const [current, setCurrent] = useState<SessionItem | null>(mockSessions[0]);

  return (
    <SessionPane
      sessions={mockSessions}
      current={current}
      agentName="Claude"
      onSelect={setCurrent}
    />
  );
}

export const WithoutCreateButton: Story = {
  render: () => <WithoutCreateButtonComponent />,
};
