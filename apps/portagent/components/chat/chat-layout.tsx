"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type { Session, User } from "./types";

interface ChatLayoutProps {
  user: User;
}

let nextSessionId = 1;

function generateSessionId(): string {
  return `session-${nextSessionId++}-${Date.now()}`;
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatLayout({ user }: ChatLayoutProps) {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const handleNewChat = () => {
    const newSession: Session = {
      id: generateSessionId(),
      title: "New Chat",
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleSend = (text: string) => {
    const userMessage = {
      id: generateMessageId(),
      from: "user" as const,
      content: text,
    };

    if (!activeSessionId) {
      // Create a new session with this message
      const title = text.length > 20 ? text.slice(0, 20) + "..." : text;
      const newSession: Session = {
        id: generateSessionId(),
        title,
        messages: [userMessage],
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) return session;
          const updatedMessages = [...session.messages, userMessage];
          // Update title if it was the default
          const title =
            session.title === "New Chat"
              ? text.length > 20
                ? text.slice(0, 20) + "..."
                : text
              : session.title;
          return { ...session, messages: updatedMessages, title };
        })
      );
    }
  };

  return (
    <SidebarProvider>
      <ChatSidebar
        user={user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Portagent</h1>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatMessages messages={activeSession?.messages ?? []} />
          <ChatInput onSend={handleSend} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
