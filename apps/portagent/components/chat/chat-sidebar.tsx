"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  MessageSquareIcon,
  ShieldIcon,
  TicketIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Session, User } from "./types";

interface ChatSidebarProps {
  user: User;
  sessions: Session[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}

export function ChatSidebar({
  user,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
}: ChatSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onNewChat}>
          <PlusIcon className="size-4" />
          <span>New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Sessions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={session.id === activeSessionId}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquareIcon className="size-4" />
                      <span>{session.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        {user.role === "admin" && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>
                <ShieldIcon className="size-4" />
                <span>Admin</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/admin/invites")}>
                      <TicketIcon className="size-4" />
                      <span>Invite Codes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="cursor-default hover:bg-transparent">
                  <UserIcon className="size-4" />
                  <span className="truncate">{user.email}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOutIcon className="size-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
