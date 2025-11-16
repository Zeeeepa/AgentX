/**
 * AssistantEventHandler
 *
 * Converts AssistantMessageEvent to AssistantMessage for UI display.
 */

import type { EventHandler } from "@deepractice-ai/agentx-api";
import type { AssistantMessageEvent, AgentEvent } from "@deepractice-ai/agentx-api";
import type { AssistantMessage } from "@deepractice-ai/agentx-types";

export class AssistantEventHandler
  implements EventHandler<AssistantMessageEvent, AssistantMessage>
{
  canHandle(event: AgentEvent): event is AssistantMessageEvent {
    return event.type === "assistant";
  }

  handle(event: AssistantMessageEvent): AssistantMessage {
    return {
      id: event.uuid,
      role: "assistant",
      content: event.message.content,
      timestamp: event.timestamp,
    };
  }
}
