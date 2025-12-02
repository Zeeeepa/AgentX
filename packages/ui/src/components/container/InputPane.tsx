/**
 * InputPane - Business container for user input
 *
 * Expanded input area with toolbar and full-width input box.
 * Designed to be used inside a resizable Panel.
 *
 * @example
 * ```tsx
 * <Allotment.Pane minSize={120} maxSize={600}>
 *   <InputPane
 *     onSend={send}
 *     onFileAttach={handleFiles}
 *     disabled={isLoading}
 *   />
 * </Allotment.Pane>
 * ```
 */

import { InputBox } from "~/components/input/InputBox";
import { InputToolBar } from "./InputToolBar";

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
   * Callback when user uploads files via toolbar
   */
  onFileAttach?: (files: File[]) => void;

  /**
   * Show toolbar
   */
  showToolbar?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

export function InputPane({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  onFileAttach,
  showToolbar = true,
  className = "",
}: InputPaneProps) {
  return (
    <div className={`h-full flex flex-col bg-muted/30 border-t border-border ${className}`}>
      {/* Toolbar */}
      {showToolbar && <InputToolBar onFileAttach={onFileAttach} disabled={disabled} />}

      {/* Input area - expands to fill available space */}
      <div className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <InputBox onSend={onSend} disabled={disabled} placeholder={placeholder} />
        </div>
      </div>
    </div>
  );
}
