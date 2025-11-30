/**
 * Container Component Stories
 *
 * Demonstrates the complete multi-agent workspace layout.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import { Container } from "./Container";
import { DefinitionPane } from "./DefinitionPane";
import { SessionPane } from "./SessionPane";
import { AgentPane } from "./AgentPane";
import { InputPane } from "./InputPane";
import { Sidebar } from "../layout/Sidebar";
import { MainContent } from "../layout/MainContent";
import { useAgent } from "~/hooks/useAgent";
import type { AgentDefinitionItem, SessionItem } from "./types";

const meta: Meta<typeof Container> = {
  title: "Container/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

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
];

const mockSessions: SessionItem[] = [
  {
    sessionId: "session_1",
    agentId: "Claude",
    createdAt: Date.now() - 3600000,
    title: "Code Refactoring",
    status: "active",
    lastActivityAt: Date.now() - 1800000,
    preview: "Help me refactor this function...",
    unreadCount: 2,
  },
  {
    sessionId: "session_2",
    agentId: "Claude",
    createdAt: Date.now() - 86400000,
    title: "API Design",
    status: "pending",
    lastActivityAt: Date.now() - 43200000,
    preview: "What's the best approach for...",
  },
  {
    sessionId: "session_3",
    agentId: "Claude",
    createdAt: Date.now() - 172800000,
    title: "Weekly Report",
    status: "completed",
    lastActivityAt: Date.now() - 86400000,
    preview: "Summary of this week's progress",
  },
  {
    sessionId: "session_4",
    agentId: "GPT-4",
    createdAt: Date.now() - 259200000,
    title: "Performance Optimization",
    status: "completed",
    lastActivityAt: Date.now() - 172800000,
    preview: "Analyzing the bottleneck in...",
  },
];

/**
 * ChatArea - Wrapper component showing AgentPane + InputPane composition
 */
function ChatArea({
  agent,
  definition,
  session,
  onCreateSession,
}: {
  agent: any;
  definition: AgentDefinitionItem | null;
  session: SessionItem | null;
  onCreateSession?: () => void;
}) {
  // Use agent hook for state management
  const agentState = useAgent(agent);

  // If no session, show AgentPane's empty state
  if (!session) {
    return (
      <AgentPane definition={definition} session={session} onCreateSession={onCreateSession} />
    );
  }

  // Vertical split: AgentPane + InputPane
  return (
    <Allotment vertical>
      <Allotment.Pane>
        <AgentPane
          definition={definition}
          session={session}
          messages={agentState.messages}
          streaming={agentState.streaming}
          errors={agentState.errors}
          status={agentState.status}
          isLoading={agentState.isLoading}
          onAbort={agentState.interrupt}
        />
      </Allotment.Pane>

      <Allotment.Pane minSize={80} maxSize={400} preferredSize={120}>
        <InputPane onSend={agentState.send} disabled={agentState.isLoading} />
      </Allotment.Pane>
    </Allotment>
  );
}

/**
 * Complete workspace layout with all three panes
 */
export const CompleteWorkspace: Story = {
  render: () => (
    <div className="h-screen bg-background">
      <Container initialDefinitions={mockDefinitions} initialSessions={mockSessions}>
        {(state) => (
          <Allotment className="h-full">
            {/* ActivityBar area - Agent selection */}
            <Allotment.Pane minSize={56} maxSize={56}>
              <div className="h-full bg-muted/30 border-r border-border">
                <DefinitionPane
                  definitions={state.definitions}
                  current={state.currentDefinition}
                  onSelect={state.selectDefinition}
                  onAdd={() => console.log("Add agent")}
                />
              </div>
            </Allotment.Pane>

            {/* Sidebar - Session list */}
            <Allotment.Pane minSize={200} maxSize={400} preferredSize={280}>
              <Sidebar>
                <SessionPane
                  sessions={state.sessions}
                  current={state.currentSession}
                  agentName={state.currentDefinition?.name}
                  onSelect={state.selectSession}
                  onCreate={() => state.createSession()}
                />
              </Sidebar>
            </Allotment.Pane>

            {/* MainContent - Chat area (AgentPane + InputPane) */}
            <Allotment.Pane>
              <MainContent>
                <ChatArea
                  agent={state.currentAgent}
                  definition={state.currentDefinition}
                  session={state.currentSession}
                  onCreateSession={() => state.createSession()}
                />
              </MainContent>
            </Allotment.Pane>
          </Allotment>
        )}
      </Container>
    </div>
  ),
};

/**
 * Empty state - no agents configured
 */
export const EmptyState: Story = {
  render: () => (
    <div className="h-screen bg-background">
      <Container initialDefinitions={[]} initialSessions={[]}>
        {(state) => (
          <Allotment className="h-full">
            <Allotment.Pane minSize={56} maxSize={56}>
              <div className="h-full bg-muted/30 border-r border-border">
                <DefinitionPane
                  definitions={state.definitions}
                  current={state.currentDefinition}
                  onSelect={state.selectDefinition}
                  onAdd={() => console.log("Add agent")}
                />
              </div>
            </Allotment.Pane>

            <Allotment.Pane minSize={200} maxSize={400} preferredSize={280}>
              <Sidebar>
                <SessionPane
                  sessions={state.sessions}
                  current={state.currentSession}
                  onSelect={state.selectSession}
                  onCreate={() => state.createSession()}
                />
              </Sidebar>
            </Allotment.Pane>

            <Allotment.Pane>
              <MainContent>
                <ChatArea
                  agent={state.currentAgent}
                  definition={state.currentDefinition}
                  session={state.currentSession}
                  onCreateSession={() => state.createSession()}
                />
              </MainContent>
            </Allotment.Pane>
          </Allotment>
        )}
      </Container>
    </div>
  ),
};
