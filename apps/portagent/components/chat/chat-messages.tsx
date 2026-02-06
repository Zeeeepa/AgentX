"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div data-testid="conversation-area" className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Start a new conversation</p>
      </div>
    );
  }

  return (
    <ScrollArea data-testid="conversation-area" className="flex-1 overflow-hidden">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
