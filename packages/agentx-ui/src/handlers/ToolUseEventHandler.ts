/**
 * ToolUseEventHandler
 *
 * Converts ToolUseEvent to ToolMessage for UI display.
 *
 * This handler transforms tool call events into displayable tool messages.
 * Since tool_use represents the AI's decision to call a tool (not the result),
 * we display it as a "pending" tool message showing the tool name and input.
 */

import type { EventHandler } from "@deepractice-ai/agentx-api";
import type { ToolUseEvent, AgentEvent } from "@deepractice-ai/agentx-api";
import type { ToolMessage } from "@deepractice-ai/agentx-types";

export class ToolUseEventHandler implements EventHandler<ToolUseEvent, ToolMessage> {
  canHandle(event: AgentEvent): event is ToolUseEvent {
    return event.type === "tool_use";
  }

  handle(event: ToolUseEvent): ToolMessage {
    return {
      id: event.uuid,
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: event.toolUse.id,
          name: event.toolUse.name,
          output: {
            type: "json",
            value: event.toolUse.input,
          },
        },
      ],
      timestamp: event.timestamp,
    };
  }
}
