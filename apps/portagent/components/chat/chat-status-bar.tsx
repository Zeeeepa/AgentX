"use client";

import type { PresentationStateLocal } from "@/hooks/use-agentx";

interface ChatStatusBarProps {
  state: PresentationStateLocal;
}

const statusLabels: Record<string, string> = {
  thinking: "Thinking...",
  responding: "Responding...",
  executing: "Executing...",
};

export function ChatStatusBar({ state }: ChatStatusBarProps) {
  if (state.status === "idle") return null;

  const label = statusLabels[state.status] ?? state.status;
  const usage = state.streaming?.usage;

  return (
    <div
      data-testid="status-bar"
      className="flex items-center gap-3 px-4 py-1.5 text-xs text-muted-foreground"
    >
      <div className="mx-auto flex max-w-3xl w-full items-center gap-3">
        {/* Pulsing indicator */}
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>

        {/* Status label */}
        <span>{label}</span>

        {/* Token usage */}
        {usage && (
          <span className="ml-auto tabular-nums">
            ↑{usage.inputTokens} ↓{usage.outputTokens}
          </span>
        )}
      </div>
    </div>
  );
}
