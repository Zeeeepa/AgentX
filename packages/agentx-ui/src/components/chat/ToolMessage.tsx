import type { ToolMessage as ToolMessageType } from "@deepractice-ai/agentx-types";
import { MessageAvatar } from "~/components/elements/MessageAvatar";
import { Wrench } from "lucide-react";

export interface ToolMessageProps {
  /**
   * Tool message data
   */
  message: ToolMessageType;
}

/**
 * ToolMessage - Display a tool execution result
 *
 * Features:
 * - Tool avatar (info blue)
 * - Tool result display
 * - JSON formatting
 *
 * @example
 * ```tsx
 * <ToolMessage message={{
 *   id: '3',
 *   role: 'tool',
 *   content: [{
 *     type: 'tool-result',
 *     id: 'call_123',
 *     name: 'calculate',
 *     output: { type: 'text', value: 'Result: 42' }
 *   }],
 *   timestamp: Date.now()
 * }} />
 * ```
 */
export function ToolMessage({ message }: ToolMessageProps) {
  return (
    <div className="chat-message tool">
      <div className="w-full">
        {/* Avatar */}
        <MessageAvatar
          label="Tool"
          variant="info"
          icon={<Wrench className="w-5 h-5 text-white" />}
          size="md"
        />

        {/* Content */}
        <div className="pl-3 sm:pl-0">
          {message.content.map((part, idx) => (
            <div key={idx} className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Tool: {part.name} (ID: {part.id})
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {part.output.type === "text" && <div>{part.output.value}</div>}
                {part.output.type === "json" && <pre>{JSON.stringify(part.output.value, null, 2)}</pre>}
                {part.output.type === "error-text" && <div className="text-red-600">Error: {part.output.value}</div>}
                {part.output.type === "error-json" && <pre className="text-red-600">{JSON.stringify(part.output.value, null, 2)}</pre>}
                {part.output.type === "execution-denied" && <div className="text-yellow-600">Execution denied{part.output.reason ? `: ${part.output.reason}` : ''}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
