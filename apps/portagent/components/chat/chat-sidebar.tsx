"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ShieldIcon,
  TicketIcon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  Trash2Icon,
  BotIcon,
  StarIcon,
  LayoutGridIcon,
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
import type { Session, User } from "./types";

interface ChatSidebarProps {
  user: User;
  sessions: Session[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  user,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const getSessionPreview = (session: Session): string => {
    const lastMsg = session.messages.filter((m) => !m.tool).at(-1);
    if (!lastMsg) return "";
    return lastMsg.content.slice(0, 50);
  };

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <BotIcon className="size-5 text-primary" />
          <span className="font-semibold text-base">Portagent</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewChat}>
                  <PlusIcon className="size-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <StarIcon className="size-4" />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LayoutGridIcon className="size-4" />
                  <span>Resources</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((session) => {
                const preview = getSessionPreview(session);
                return (
                  <SidebarMenuItem key={session.id} className="group/session">
                    <SidebarMenuButton
                      isActive={session.id === activeSessionId}
                      onClick={() => onSelectSession(session.id)}
                      className="h-auto py-2 items-start"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="truncate text-sm">{session.title}</span>
                        {preview && (
                          <span className="truncate text-xs text-muted-foreground">
                            {preview}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/session:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/admin/settings")}>
                      <SettingsIcon className="size-4" />
                      <span>Settings</span>
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
