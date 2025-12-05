/**
 * CreateAgentOptions - Factory options for creating an Agent
 */

import type { AgentDriver } from "./AgentDriver";
import type { AgentPresenter } from "./AgentPresenter";
import type { Agent } from "./Agent";

/**
 * Options for creating an Agent
 */
export interface CreateAgentOptions {
  /**
   * Driver - Event producer (LLM interaction)
   */
  driver: AgentDriver;

  /**
   * Presenter - Event consumer (side effects)
   */
  presenter: AgentPresenter;
}

/**
 * Factory function to create an Agent
 *
 * Agent is a logical processing unit that coordinates:
 * - Driver: produces stream events from LLM
 * - Engine: assembles events (internal, created automatically)
 * - Presenter: consumes processed events
 *
 * @example
 * ```typescript
 * const agent = createAgent({
 *   driver: new ClaudeDriver(config),
 *   presenter: new SSEPresenter(connection),
 * });
 *
 * agent.on("text_delta", (e) => console.log(e.data.text));
 * await agent.receive("Hello!");
 * ```
 */
export declare function createAgent(options: CreateAgentOptions): Agent;
