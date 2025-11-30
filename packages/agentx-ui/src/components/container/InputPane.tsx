/**
 * InputPane - Business container for user input
 *
 * Wraps InputBox with business styling for Panel layout.
 * Designed to be used inside a resizable Panel.
 *
 * @example
 * ```tsx
 * <Allotment.Pane minSize={80} maxSize={400}>
 *   <InputPane onSend={send} disabled={isLoading} />
 * </Allotment.Pane>
 * ```
 */

import { InputBox } from "~/components/input/InputBox";

export interface InputPaneProps {
  /**
   * Callback when user sends a message
   */
  onSend: (text: string) => void;

  /**
   * Whether input is disabled
   */
  disabled?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Callback when user attaches images
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

export function InputPane({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  onImageAttach,
  showImageButton = true,
  className = "",
}: InputPaneProps) {
  return (
    <div className={`h-full flex flex-col bg-muted/30 border-t border-border ${className}`}>
      <div className="flex-1 flex items-center px-4 py-3">
        <div className="w-full max-w-4xl mx-auto">
          <InputBox
            onSend={onSend}
            disabled={disabled}
            placeholder={placeholder}
            onImageAttach={onImageAttach}
            showImageButton={showImageButton}
          />
        </div>
      </div>
    </div>
  );
}
