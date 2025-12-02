/**
 * MessagePane - Business container for message display
 *
 * Wraps MessageList with business logic:
 * - Status indicator
 * - Error alerts
 * - Scroll management
 *
 * @example
 * ```tsx
 * <MessagePane
 *   messages={messages}
 *   streaming={streamingText}
 *   errors={errors}
 *   status={status}
 *   isLoading={isLoading}
 * />
 * ```
 */

import type { Message, AgentError, AgentState } from "@agentxjs/types";
import { MessageList } from "~/components/message/MessageList";
import { StatusIndicator } from "~/components/message/StatusIndicator";
import { ErrorAlert } from "~/components/message/items/ErrorAlert";

export interface MessagePaneProps {
  /**
   * Messages to display
   */
  messages: Message[];

  /**
   * Current streaming text
   */
  streaming?: string;

  /**
   * Errors to display
   */
  errors?: AgentError[];

  /**
   * Current agent state
   */
  status?: AgentState;

  /**
   * Whether agent is loading
   */
  isLoading?: boolean;

  /**
   * Callback to abort current operation
   */
  onAbort?: () => void;

  /**
   * Custom className
   */
  className?: string;
}

export function MessagePane({
  messages,
  streaming = "",
  errors = [],
  status = "idle",
  isLoading = false,
  onAbort,
  className = "",
}: MessagePaneProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Message list */}
      <div className="flex-1 min-h-0">
        <MessageList messages={messages} streamingText={streaming} className="h-full" />
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div className="px-4 py-2 border-t border-border">
          <StatusIndicator status={status} isLoading={isLoading} onAbort={onAbort} />
        </div>
      )}

      {/* Error alerts */}
      {errors.length > 0 && (
        <div className="px-4 py-2 space-y-2 border-t border-border">
          {errors.map((error, index) => (
            <ErrorAlert key={`error-${index}`} error={error} showDetails={true} />
          ))}
        </div>
      )}
    </div>
  );
}
