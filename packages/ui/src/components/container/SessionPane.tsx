/**
 * SessionPane - Session list panel for Sidebar
 *
 * Displays sessions (topics/conversations) for the current agent.
 * Designed to be placed inside Sidebar layout component.
 *
 * Features:
 * - Search/filter sessions
 * - Session preview and metadata
 * - Create new session
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
import { Search, Plus, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionItem } from "./types";

// Animation variants for session items
const sessionItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

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
  agentName: _agentName,
  onSelect,
  onCreate,
  onDelete,
  className = "",
}: SessionPaneProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sessions by search query and sort by updatedAt
  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title?.toLowerCase().includes(query) || s.preview?.toLowerCase().includes(query)
      );
    }

    // Sort by updatedAt (most recent first)
    return [...result].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions, searchQuery]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        {/* Search input + New button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center justify-center w-8 h-8 rounded-md
                         text-primary-foreground bg-primary hover:bg-primary/90
                         transition-colors flex-shrink-0"
              title="New Topic"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        <AnimatePresence mode="popLayout">
          {filteredSessions.map((session, index) => {
            const isActive = current?.sessionId === session.sessionId;

            return (
              <motion.div
                key={session.sessionId}
                variants={sessionItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                layout
                className={`
                  group relative w-full flex items-start gap-3 px-3 py-2.5 text-left
                  cursor-pointer border-l-[3px]
                  ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 border-l-blue-500"
                      : "hover:bg-muted/50 border-l-transparent"
                  }
                `}
                onClick={() => onSelect(session)}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {session.title ?? "Untitled conversation"}
                    </span>
                    {session.unreadCount && session.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {session.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  {session.preview && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {session.preview}
                    </p>
                  )}

                  {/* Time */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                </div>

                {/* Delete button - show on hover */}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.sessionId);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                               opacity-0 group-hover:opacity-100 transition-opacity
                               hover:bg-destructive/10 hover:text-destructive"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

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
    </div>
  );
}
