/**
 * AgentPane - Agent message display area
 *
 * Shows agent header and message list.
 * Does NOT include input area (use InputPane separately in Container).
 *
 * Layout:
 * ```
 * ┌─────────────────────────────────┐
 * │ AgentHeader (name, status)      │
 * ├─────────────────────────────────┤
 * │                                 │
 * │ MessagePane (messages)          │
 * │                                 │
 * └─────────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <Container>
 *   {(state) => (
 *     <Allotment vertical>
 *       <Allotment.Pane>
 *         <AgentPane
 *           agent={state.currentAgent}
 *           definition={state.currentDefinition}
 *           session={state.currentSession}
 *         />
 *       </Allotment.Pane>
 *       <Allotment.Pane minSize={80} maxSize={400}>
 *         <InputPane onSend={...} />
 *       </Allotment.Pane>
 *     </Allotment>
 *   )}
 * </Container>
 * ```
 */

import type { AgentError, AgentState, Message } from "@deepractice-ai/agentx-types";
import { MoreHorizontal, Pin, Bot, MessageSquarePlus } from "lucide-react";
import { MessagePane } from "./MessagePane";
import type { AgentDefinitionItem, SessionItem } from "./types";

export interface AgentPaneProps {
  /**
   * Current agent definition (for display)
   */
  definition: AgentDefinitionItem | null;

  /**
   * Current session (for display)
   */
  session: SessionItem | null;

  /**
   * Messages to display
   */
  messages?: Message[];

  /**
   * Streaming message content
   */
  streaming?: string;

  /**
   * Error messages
   */
  errors?: AgentError[];

  /**
   * Agent status
   */
  status?: AgentState;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Callback to abort current request
   */
  onAbort?: () => void;

  /**
   * Callback to create a new session
   */
  onCreateSession?: () => void;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * AgentPane - Agent message display area (pure presentation)
 */
export function AgentPane({
  definition,
  session,
  messages = [],
  streaming,
  errors = [],
  status,
  isLoading = false,
  onAbort,
  onCreateSession,
  className = "",
}: AgentPaneProps) {
  // No definition selected
  if (!definition) {
    return (
      <div className={`h-full flex items-center justify-center bg-background ${className}`}>
        <EmptyState
          icon={<Bot className="w-12 h-12" />}
          title="Select an agent"
          description="Choose an agent from the sidebar to start chatting"
        />
      </div>
    );
  }

  // No session selected
  if (!session) {
    return (
      <div className={`h-full flex flex-col bg-background ${className}`}>
        <AgentHeader definition={definition} session={null} />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<MessageSquarePlus className="w-12 h-12" />}
            title="Start a conversation"
            description={`Create a new topic to start chatting with ${definition.name}`}
            action={
              onCreateSession && (
                <button
                  onClick={onCreateSession}
                  className="mt-4 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary
                             rounded-md hover:bg-primary/90 transition-colors"
                >
                  New Topic
                </button>
              )
            }
          />
        </div>
      </div>
    );
  }

  // Agent interface with messages only (no input)
  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      <AgentHeader definition={definition} session={session} />

      <div className="flex-1 min-h-0">
        <MessagePane
          messages={messages}
          streaming={streaming}
          errors={errors}
          status={status}
          isLoading={isLoading}
          onAbort={onAbort}
        />
      </div>
    </div>
  );
}

/**
 * Agent header component
 */
interface AgentHeaderProps {
  definition: AgentDefinitionItem;
  session: SessionItem | null;
}

function AgentHeader({ definition, session }: AgentHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Agent avatar */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
            definition.color || "bg-blue-500"
          }`}
        >
          {definition.icon || definition.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{definition.name}</span>
            {definition.isOnline && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Online
              </span>
            )}
          </div>
          {session && <p className="text-xs text-muted-foreground">{session.title}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title="Pin conversation"
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action}
    </div>
  );
}
