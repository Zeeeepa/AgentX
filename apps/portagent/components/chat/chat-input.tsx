"use client";

import * as React from "react";
import { SendIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = React.useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div data-testid="prompt-input" className="border-t p-4 flex items-end gap-2">
      <Textarea
        placeholder="Type a message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-10 max-h-32 resize-none"
        rows={1}
      />
      <Button size="icon" onClick={handleSend} disabled={!value.trim()} aria-label="Send message">
        <SendIcon className="size-4" />
      </Button>
    </div>
  );
}
