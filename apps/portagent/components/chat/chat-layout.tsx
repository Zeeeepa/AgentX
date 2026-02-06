"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useAgentX } from "@/hooks/use-agentx";
import type { PresentationStateLocal } from "@/hooks/use-agentx";
import type { Session, Message, User } from "./types";

interface ChatLayoutProps {
  user: User;
}

/**
 * Convert agentxjs PresentationState to the existing Message[] format
 * for compatibility with ChatMessages component.
 */
interface ToolBlockLike {
  type: "tool";
  toolName: string;
  toolInput: Record<string, unknown>;
  toolResult?: string;
  status: string;
}

function blocksToMessages(
  blocks: Array<{ type: string; [key: string]: unknown }>,
  idPrefix: string
): Message[] {
  const messages: Message[] = [];
  let idx = 0;
  // Accumulate consecutive text blocks
  let textAcc = "";

  const flushText = () => {
    if (textAcc) {
      messages.push({ id: `${idPrefix}-${idx++}`, from: "assistant", content: textAcc });
      textAcc = "";
    }
  };

  for (const b of blocks) {
    if (b.type === "text") {
      textAcc += (b as { type: "text"; content: string }).content;
    } else if (b.type === "tool") {
      flushText();
      const tb = b as unknown as ToolBlockLike;
      messages.push({
        id: `${idPrefix}-${idx++}`,
        from: "assistant",
        content: "",
        tool: {
          toolName: tb.toolName,
          toolInput: tb.toolInput,
          toolResult: tb.toolResult,
          status: tb.status,
        },
      });
    }
  }
  flushText();
  return messages;
}

function presentationToMessages(state: PresentationStateLocal): Message[] {
  const messages: Message[] = [];
  let convIndex = 0;

  for (const conv of state.conversations) {
    if (conv.role === "user") {
      const text = (conv.blocks ?? [])
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; content: string }).content)
        .join("");
      messages.push({ id: `msg-${convIndex}`, from: "user", content: text });
    } else if (conv.role === "assistant") {
      messages.push(...blocksToMessages(conv.blocks ?? [], `msg-${convIndex}`));
    } else if (conv.role === "error") {
      messages.push({
        id: `msg-${convIndex}`,
        from: "assistant",
        content: `Error: ${conv.message}`,
      });
    }
    convIndex++;
  }

  // Add streaming content if present
  if (state.streaming) {
    messages.push(...blocksToMessages(state.streaming.blocks, "msg-streaming"));
  }

  return messages;
}

export function ChatLayout({ user }: ChatLayoutProps) {
  const agentx = useAgentX({ userId: user.id });

  // Convert AgentX sessions to UI sessions
  const uiSessions: Session[] = agentx.sessions.map((s) => ({
    id: s.imageId,
    title: s.title,
    messages: [],
  }));

  const activeSessionId = agentx.activeSession?.imageId ?? null;

  // Build messages from presentation state
  const messages = React.useMemo(
    () => presentationToMessages(agentx.presentationState),
    [agentx.presentationState]
  );

  const status = agentx.presentationState.status;
  const isBusy = status === "thinking" || status === "responding" || status === "executing";
  // Show thinking indicator when AI is working but hasn't started streaming text yet
  const isThinking =
    isBusy &&
    !agentx.presentationState.streaming?.blocks.some(
      (b) => b.type === "text" && (b as { type: "text"; content: string }).content
    );

  const handleNewChat = async () => {
    await agentx.createSession();
  };

  const handleSelectSession = (id: string) => {
    agentx.selectSession(id);
  };

  const handleSend = async (text: string) => {
    if (!agentx.activeSession) {
      // Auto-create session if none active
      const session = await agentx.createSession();
      if (!session) return;
      // Send directly through the returned session's presentation
      // (avoids stale closure where activeSession is still null)
      await session.presentation.send(text);
      return;
    }
    await agentx.sendMessage(text);
  };

  return (
    <SidebarProvider>
      <ChatSidebar
        user={user}
        sessions={uiSessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Portagent</h1>
          {!agentx.connected && (
            <span className="ml-auto text-xs text-muted-foreground">Connecting...</span>
          )}
          {agentx.error && <span className="ml-auto text-xs text-destructive">{agentx.error}</span>}
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatMessages messages={messages} isThinking={isThinking} />
          <ChatInput onSend={handleSend} disabled={isBusy} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
