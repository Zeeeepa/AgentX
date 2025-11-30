/**
 * InputBox - Auto-resizing textarea with send button
 *
 * Pure UI component for text input.
 *
 * Features:
 * - Auto-resize textarea (up to max height)
 * - Enter to send, Shift+Enter for new line
 * - Send button (disabled when empty or loading)
 * - Optional image attachment button
 * - Hint text showing keyboard shortcuts
 *
 * @example
 * ```tsx
 * <InputBox
 *   onSend={(text) => console.log('Send:', text)}
 *   disabled={isLoading}
 * />
 * ```
 */

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { ImagePlus, Send } from "lucide-react";

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
   * Callback when user attaches images (optional)
   */
  onImageAttach?: (files: File[]) => void;

  /**
   * Show image attachment button
   */
  showImageButton?: boolean;

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
  onImageAttach,
  showImageButton = true,
  className = "",
}: InputBoxProps) {
  const [input, setInput] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;

    onSend(input.trim());
    setInput("");

    // Reset height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }, 0);
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0 && onImageAttach) {
      onImageAttach(imageFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div
        className="flex items-end gap-2 bg-background border border-border rounded-xl p-2
                   focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
                   transition-all"
      >
        {/* Hidden file input */}
        {showImageButton && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        )}

        {/* Image upload button */}
        {showImageButton && (
          <button
            type="button"
            onClick={handleImageClick}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted
                       rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            title="Attach images"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none focus:outline-none
                     text-foreground placeholder:text-muted-foreground
                     disabled:opacity-50 text-sm leading-6 py-2 px-1
                     min-h-[40px] max-h-[200px] overflow-y-auto"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="p-2 bg-primary text-primary-foreground rounded-lg
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex-shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Hint text */}
      <div className="mt-1 text-xs text-muted-foreground text-center">
        Enter to send, Shift+Enter for new line
      </div>
    </form>
  );
}
