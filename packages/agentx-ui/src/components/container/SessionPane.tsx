/**
 * SessionPane - Session list panel for Sidebar
 *
 * Displays sessions (topics/conversations) for the current agent.
 * Designed to be placed inside Sidebar layout component.
 *
 * Features:
 * - Search/filter sessions
 * - Session status indicators
 * - Create new session
 * - Session preview and metadata
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <SessionPane
 *     sessions={sessions}
 *     current={currentSession}
 *     agentName="Claude"
 *     onSelect={selectSession}
 *     onCreate={createSession}
 *   />
 * </Sidebar>
 * ```
 */

import { useState, useMemo } from "react";
import { Search, Plus, MessageSquare, Clock, CheckCircle, Circle, Archive } from "lucide-react";
import type { SessionItem, SessionStatus } from "./types";

export interface SessionPaneProps {
  /**
   * Sessions to display
   */
  sessions: SessionItem[];

  /**
   * Currently selected session
   */
  current: SessionItem | null;

  /**
   * Agent name for header display
   */
  agentName?: string;

  /**
   * Callback when a session is selected
   */
  onSelect: (session: SessionItem) => void;

  /**
   * Callback when create button is clicked
   */
  onCreate?: () => void;

  /**
   * Callback when delete is requested
   */
  onDelete?: (sessionId: string) => void;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * Status icon mapping
 */
const STATUS_ICONS: Record<SessionStatus, typeof Circle> = {
  active: Circle,
  pending: Clock,
  completed: CheckCircle,
  archived: Archive,
};

/**
 * Status color mapping
 */
const STATUS_COLORS: Record<SessionStatus, string> = {
  active: "text-green-500",
  pending: "text-amber-500",
  completed: "text-blue-500",
  archived: "text-muted-foreground",
};

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * SessionPane - Session list for Sidebar
 */
export function SessionPane({
  sessions,
  current,
  agentName,
  onSelect,
  onCreate,
  onDelete,
  className = "",
}: SessionPaneProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) => s.title.toLowerCase().includes(query) || s.preview?.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  // Group sessions by status
  const groupedSessions = useMemo(() => {
    const active = filteredSessions.filter((s) => s.status === "active" || s.status === "pending");
    const completed = filteredSessions.filter((s) => s.status === "completed");
    const archived = filteredSessions.filter((s) => s.status === "archived");
    return { active, completed, archived };
  }, [filteredSessions]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        {agentName && <h2 className="text-sm font-semibold text-foreground mb-2">{agentName}</h2>}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-md
                       placeholder:text-muted-foreground
                       focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {/* Active sessions */}
        {groupedSessions.active.length > 0 && (
          <SessionGroup
            sessions={groupedSessions.active}
            current={current}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        )}

        {/* Completed sessions */}
        {groupedSessions.completed.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </div>
            <SessionGroup
              sessions={groupedSessions.completed}
              current={current}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </>
        )}

        {/* Archived sessions */}
        {groupedSessions.archived.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Archived
            </div>
            <SessionGroup
              sessions={groupedSessions.archived}
              current={current}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </>
        )}

        {/* Empty state */}
        {filteredSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No sessions found" : "No sessions yet"}
            </p>
            {!searchQuery && onCreate && (
              <button onClick={onCreate} className="mt-2 text-sm text-primary hover:underline">
                Start a new conversation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create button */}
      {onCreate && (
        <div className="p-3 border-t border-border">
          <button
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-2 px-3 py-2
                       text-sm font-medium text-primary-foreground bg-primary
                       rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Topic
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Session group component
 */
interface SessionGroupProps {
  sessions: SessionItem[];
  current: SessionItem | null;
  onSelect: (session: SessionItem) => void;
  onDelete?: (sessionId: string) => void;
}

function SessionGroup({ sessions, current, onSelect }: SessionGroupProps) {
  return (
    <div className="py-1">
      {sessions.map((session) => {
        const isActive = current?.sessionId === session.sessionId;
        const StatusIcon = STATUS_ICONS[session.status];
        const statusColor = STATUS_COLORS[session.status];

        return (
          <button
            key={session.sessionId}
            onClick={() => onSelect(session)}
            className={`
              w-full flex items-start gap-3 px-3 py-2.5 text-left
              transition-colors
              ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"}
            `}
          >
            {/* Status icon */}
            <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${statusColor}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{session.title}</span>
                {session.unreadCount && session.unreadCount > 0 && (
                  <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {session.unreadCount}
                  </span>
                )}
              </div>

              {/* Preview */}
              {session.preview && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{session.preview}</p>
              )}

              {/* Time */}
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(session.lastActivityAt)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
