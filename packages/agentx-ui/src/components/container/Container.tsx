/**
 * Container - Integration component for multi-agent workspace
 *
 * Manages the state for agent definitions and sessions, providing
 * state to children via render props pattern.
 *
 * Architecture:
 * ```
 * Container (state management)
 *   ├── AgentDefinitionPane (ActivityBar content)
 *   ├── SessionPane (Sidebar content)
 *   └── AgentPane (MainContent content)
 * ```
 *
 * @example
 * ```tsx
 * import { Container } from "@deepractice-ai/agentx-ui";
 *
 * <Container initialDefinitions={definitions}>
 *   {(state) => (
 *     <>
 *       <ActivityBar>
 *         <AgentDefinitionPane
 *           definitions={state.definitions}
 *           current={state.currentDefinition}
 *           onSelect={state.selectDefinition}
 *         />
 *       </ActivityBar>
 *       <Sidebar>
 *         <SessionPane
 *           sessions={state.sessions}
 *           current={state.currentSession}
 *           onSelect={state.selectSession}
 *           onCreate={state.createSession}
 *         />
 *       </Sidebar>
 *       <MainContent>
 *         <AgentPane agent={state.currentAgent} />
 *       </MainContent>
 *     </>
 *   )}
 * </Container>
 * ```
 */

import type { ReactNode } from "react";
import { useContainer, type UseContainerOptions } from "~/hooks/useContainer";
import type { UseContainerResult, AgentDefinitionItem, SessionItem } from "./types";

export interface ContainerProps extends UseContainerOptions {
  /**
   * Render function that receives container state and actions.
   */
  children: (state: UseContainerResult) => ReactNode;

  /**
   * Custom className for the container wrapper
   */
  className?: string;
}

/**
 * Container - Multi-agent workspace integration component
 */
export function Container({ children, className = "", ...options }: ContainerProps) {
  const state = useContainer(options);

  return <div className={`h-full flex flex-col ${className}`}>{children(state)}</div>;
}

// Re-export types for convenience
export type { UseContainerResult, AgentDefinitionItem, SessionItem };
