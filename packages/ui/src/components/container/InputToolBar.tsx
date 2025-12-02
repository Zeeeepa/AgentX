/**
 * InputToolBar - Toolbar for input area with file upload and other tools
 *
 * Provides utility buttons for the input pane:
 * - File upload (read files)
 * - Future: Model selector, settings, etc.
 */

import { Upload } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

export interface InputToolBarProps {
  /**
   * Callback when user uploads files
   */
  onFileAttach?: (files: File[]) => void;

  /**
   * Whether the toolbar is disabled
   */
  disabled?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

export function InputToolBar({
  onFileAttach,
  disabled = false,
  className = "",
}: InputToolBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0 && onFileAttach) {
      onFileAttach(files);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border ${className}`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* File upload button */}
      <button
        type="button"
        onClick={handleFileClick}
        disabled={disabled}
        className="p-2 text-muted-foreground
                   hover:text-foreground hover:bg-muted/80
                   active:bg-muted active:scale-95
                   rounded-lg transition-all duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:hover:bg-transparent disabled:active:scale-100"
        title="Upload files"
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Future: Add more tools here */}
    </div>
  );
}
