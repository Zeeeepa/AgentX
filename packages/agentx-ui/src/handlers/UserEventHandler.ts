/**
 * UserEventHandler
 *
 * Converts UserMessageEvent to UserMessage for UI display.
 */

import type { EventHandler } from "@deepractice-ai/agentx-api";
import type { UserMessageEvent, AgentEvent } from "@deepractice-ai/agentx-api";
import type { UserMessage } from "@deepractice-ai/agentx-types";

export class UserEventHandler implements EventHandler<UserMessageEvent, UserMessage> {
  canHandle(event: AgentEvent): event is UserMessageEvent {
    return event.type === "user";
  }

  handle(event: UserMessageEvent): UserMessage {
    return {
      id: event.uuid,
      role: "user",
      content: event.message.content,
      timestamp: event.timestamp,
    };
  }
}
