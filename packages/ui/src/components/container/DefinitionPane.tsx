/**
 * DefinitionPane - Agent selection panel for ActivityBar
 *
 * Displays available agent definitions as icons/avatars.
 * Designed to be placed inside ActivityBar layout component.
 *
 * Features:
 * - Vertical list of agent icons
 * - Active state indication
 * - Online/offline status
 * - Add new agent button
 *
 * @example
 * ```tsx
 * <ActivityBar>
 *   <DefinitionPane
 *     definitions={definitions}
 *     current={currentDefinition}
 *     onSelect={selectDefinition}
 *     onAdd={handleAddAgent}
 *   />
 * </ActivityBar>
 * ```
 */

import { Settings } from "lucide-react";
import type { AgentDefinitionItem } from "./types";

export interface DefinitionPaneProps {
  /**
   * Available agent definitions
   */
  definitions: AgentDefinitionItem[];

  /**
   * Currently selected definition
   */
  current: AgentDefinitionItem | null;

  /**
   * Callback when an agent is selected
   */
  onSelect: (definition: AgentDefinitionItem) => void;

  /**
   * Callback when settings button is clicked
   */
  onSettings?: () => void;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * Default colors for agents without explicit color
 */
const DEFAULT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

/**
 * Get color for agent by index
 */
function getAgentColor(definition: AgentDefinitionItem, index: number): string {
  if (definition.color) return definition.color;
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/**
 * Get display initial for agent
 */
function getAgentInitial(definition: AgentDefinitionItem): string {
  if (definition.icon) return definition.icon;
  return definition.name.charAt(0).toUpperCase();
}

/**
 * DefinitionPane - Agent selection for ActivityBar
 */
export function DefinitionPane({
  definitions,
  current,
  onSelect,
  onSettings,
  className = "",
}: DefinitionPaneProps) {
  return (
    <div className={`flex flex-col h-full py-2 ${className}`}>
      {/* Agent list */}
      <div className="flex-1 flex flex-col items-center gap-2">
        {definitions.map((definition, index) => {
          const isActive = current?.name === definition.name;
          const color = getAgentColor(definition, index);
          const initial = getAgentInitial(definition);

          return (
            <button
              key={definition.name}
              onClick={() => onSelect(definition)}
              className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center
                text-white font-semibold text-sm
                transition-all duration-200
                ${color}
                ${
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-105 opacity-70 hover:opacity-100"
                }
              `}
              title={definition.name}
            >
              {initial}

              {/* Online indicator */}
              {definition.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
              )}

              {/* Active session count badge */}
              {definition.activeSessionCount && definition.activeSessionCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {definition.activeSessionCount > 9 ? "9+" : definition.activeSessionCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings button */}
      {onSettings && (
        <div className="flex flex-col items-center pt-2 border-t border-border">
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-xl flex items-center justify-center
                       text-muted-foreground hover:text-foreground
                       hover:bg-accent transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
