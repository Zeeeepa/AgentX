import type { UserMessage as UserMessageType } from "@deepractice-ai/agentx-types";
import { MessageAvatar } from "~/components/elements/MessageAvatar";
import { User } from "lucide-react";
import { TextContent } from "./parts/TextContent";

export interface UserMessageProps {
  /**
   * User message data
   */
  message: UserMessageType;
}

/**
 * UserMessage - Display a user message
 *
 * Features:
 * - User avatar (amber color)
 * - Text content rendering
 * - Image parts support (future)
 *
 * @example
 * ```tsx
 * <UserMessage message={{
 *   id: '1',
 *   role: 'user',
 *   content: 'Hello, how are you?',
 *   timestamp: Date.now()
 * }} />
 * ```
 */
export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="chat-message user">
      <div className="w-full">
        {/* Avatar */}
        <MessageAvatar
          label="You"
          variant="secondary"
          icon={<User className="w-5 h-5 text-white" />}
          size="md"
        />

        {/* Content */}
        <div className="pl-3 sm:pl-0">
          {typeof message.content === "string" ? (
            <TextContent text={message.content} />
          ) : (
            message.content.map((part, idx) => {
              if (part.type === "text") {
                return <TextContent key={idx} text={part.text} />;
              }
              // TODO: Support image parts
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
}
