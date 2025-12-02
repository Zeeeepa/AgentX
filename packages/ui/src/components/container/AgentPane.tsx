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

import type { AgentError, AgentState, Message } from "@agentxjs/types";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
   * Current agent ID (for display)
   */
  agentId?: string | null;

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
 *
 * States:
 * 1. isLoading + no messages → Connecting/Loading
 * 2. Ready → Show MessagePane (may be empty)
 */
export function AgentPane({
  definition,
  session,
  agentId,
  messages = [],
  streaming,
  errors = [],
  status,
  isLoading = false,
  onAbort,
  // onCreateSession - unused, kept for backward compatibility
  className = "",
}: AgentPaneProps) {
  // Loading state (e.g., establishing SSE connection)
  if (isLoading && messages.length === 0 && !streaming) {
    return (
      <div className={`h-full flex flex-col bg-background ${className}`}>
        {definition && <AgentHeader definition={definition} session={session} agentId={agentId} />}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="animate-pulse mb-4">
              <Bot className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show MessagePane (handles empty state internally)
  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {definition && <AgentHeader definition={definition} session={session} agentId={agentId} />}

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={session?.sessionId ?? "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            <MessagePane
              messages={messages}
              streaming={streaming}
              errors={errors}
              status={status}
              isLoading={isLoading}
              onAbort={onAbort}
            />
          </motion.div>
        </AnimatePresence>
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
  agentId?: string | null;
}

function AgentHeader({ definition, agentId }: AgentHeaderProps) {
  return (
    <div className="flex items-center px-4 py-3 border-b border-border bg-background flex-shrink-0">
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
          <span className="text-sm font-semibold text-foreground">{definition.name}</span>
          {agentId && <p className="text-xs text-muted-foreground font-mono">{agentId}</p>}
        </div>
      </div>
    </div>
  );
}
