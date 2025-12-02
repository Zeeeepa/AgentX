/**
 * InputBox - Full-height textarea with send button
 *
 * Pure UI component for text input that fills available space.
 *
 * Features:
 * - Full-height textarea (fills container)
 * - Enter to send, Shift+Enter for new line
 * - Send button at bottom right
 * - Minimal design, no borders or decorations
 *
 * @example
 * ```tsx
 * <InputBox
 *   onSend={(text) => console.log('Send:', text)}
 *   disabled={isLoading}
 *   placeholder="Type a message..."
 * />
 * ```
 */

import { useState, useRef, type FormEvent, type KeyboardEvent, type ChangeEvent } from "react";
import { Send } from "lucide-react";

export interface InputBoxProps {
  /**
   * Callback when user sends a message
   */
  onSend: (text: string) => void;

  /**
   * Whether the input is disabled (e.g., while AI is responding)
   */
  disabled?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Initial value
   */
  defaultValue?: string;

  /**
   * Custom className
   */
  className?: string;
}

export function InputBox({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  defaultValue = "",
  className = "",
}: InputBoxProps) {
  const [input, setInput] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;

    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to submit (unless Shift+Enter for new line)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={`h-full relative ${className}`}>
      {/* Textarea - fills entire space */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-full bg-transparent resize-none focus:outline-none
                   text-foreground placeholder:text-muted-foreground
                   disabled:opacity-50 text-sm leading-6 px-3 py-3 pr-14
                   overflow-y-auto border-none"
      />

      {/* Send button - inside textarea at bottom right */}
      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className="absolute bottom-3 right-3
                   p-2 bg-primary text-primary-foreground rounded-lg
                   hover:bg-primary/90 active:bg-primary/80 active:scale-95
                   transition-all duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send message (Enter)"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
