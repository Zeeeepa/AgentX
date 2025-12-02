/**
 * AgentX Engine
 *
 * Pure Mealy Machine event processor for AI agents.
 * Transforms Stream Layer events into State/Message/Turn Layer events.
 *
 * ## Design Principles
 *
 * 1. **Pure Mealy Machines**: (state, input) → (state, outputs)
 * 2. **State is Means**: State accumulates data, outputs are the goal
 * 3. **Pass-Through + Transform**: Original events preserved, new events added
 * 4. **Event Chaining**: Processor outputs can trigger other processors
 *
 * ## Module Structure
 *
 * | Module               | Files | Purpose                                    |
 * |----------------------|-------|--------------------------------------------|
 * | AgentEngine.ts       | 1     | Per-agent Mealy runtime with state store   |
 * | AgentProcessor.ts    | 1     | Combined processor (message+state+turn)    |
 * | internal/            | 3     | Individual processors                      |
 * | mealy/               | 6     | Generic Mealy Machine framework            |
 *
 * ## Key Design Decisions
 *
 * ### 1. Why "State is Means, Output is Goal"?
 *
 * **Problem**: Traditional state machines focus on state. But for event
 * processing, we care about producing events, not managing state.
 *
 * **Decision**: Treat state as a means to accumulate data between events.
 * The goal is always the output events produced.
 *
 * **Example**:
 * ```typescript
 * // MessageAssembler: State is just accumulator
 * interface State { pendingContents: Record<number, string[]> }
 *
 * // The goal is to produce AssistantMessageEvent when text_delta stream ends
 * type Output = AssistantMessageEvent | ToolCallMessageEvent
 * ```
 *
 * **Benefits**:
 * - Focus on what matters (event production)
 * - State can be refactored without changing API
 * - Pure functions are easy to test
 *
 * ### 2. Why Pass-Through + Transform?
 *
 * **Problem**: Should Engine replace Stream events or add to them?
 *
 * **Decision**: Engine passes through ALL original Stream events, PLUS
 * produces higher-level events (Message, State, Turn).
 *
 * **Rationale**:
 * - UI needs both: text_delta for streaming, assistant_message for complete
 * - Server SSE only forwards Stream events (client reassembles the rest)
 * - No information loss
 *
 * ### 3. Why Event Chaining (Re-injection)?
 *
 * **Problem**: TurnTracker needs AssistantMessageEvent to calculate turn stats.
 * But MessageAssembler produces it. How do they communicate?
 *
 * **Decision**: Processor outputs are re-injected as inputs for other processors.
 *
 * **Flow**:
 * ```
 * text_delta → MessageAssembler → AssistantMessageEvent
 *                                        ↓ (re-inject)
 *                                  TurnTracker → TurnResponseEvent
 * ```
 *
 * **Benefits**:
 * - No coupling between processors
 * - Easy to add new processors that react to existing events
 * - Deterministic (outputs processed in order)
 *
 * ### 4. Why Per-Agent State Isolation?
 *
 * **Problem**: Multiple agents share one Engine. How to isolate state?
 *
 * **Decision**: Engine uses MemoryStore keyed by agentId.
 *
 * **Benefits**:
 * - Single Engine instance serves all agents
 * - State cleanup via clearState(agentId)
 * - Horizontally scalable (stateless between requests)
 *
 * ### 5. Why Generic Mealy Framework?
 *
 * **Problem**: Agent event processing has similar patterns. Should we
 * build custom or use a framework?
 *
 * **Decision**: Build a generic Mealy Machine framework in `mealy/` module.
 *
 * **Components**:
 * - `Processor`: Pure function (state, input) → [state, outputs]
 * - `Store`: State persistence interface
 * - `Sink`: Output handler
 * - `combinators`: combineProcessors, chainProcessors, etc.
 *
 * **Benefits**:
 * - Reusable for other domains
 * - Standardized patterns
 * - Testable in isolation
 *
 * @example
 * ```typescript
 * import { AgentEngine } from '@agentxjs/engine';
 *
 * const engine = new AgentEngine();
 *
 * // Agent layer coordinates the flow:
 * for await (const streamEvent of driver.receive(message, context)) {
 *   const outputs = engine.process(agentId, streamEvent);
 *   for (const output of outputs) {
 *     presenters.forEach(p => p.present(agentId, output));
 *     handlers.forEach(h => h(output));
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

// ===== AgentEngine =====
export { AgentEngine, createAgentEngine } from "./AgentEngine";

// ===== AgentProcessor (for advanced use cases) =====
export {
  agentProcessor,
  createInitialAgentEngineState,
  type AgentEngineState,
  type AgentProcessorInput,
  type AgentProcessorOutput,
} from "./AgentProcessor";

// ===== Internal Processors (for advanced use cases) =====
export {
  // MessageAssembler
  messageAssemblerProcessor,
  messageAssemblerProcessorDef,
  type MessageAssemblerInput,
  type MessageAssemblerOutput,
  type MessageAssemblerState,
  type PendingContent,
  createInitialMessageAssemblerState,
  // StateEventProcessor
  stateEventProcessor,
  stateEventProcessorDef,
  type StateEventProcessorInput,
  type StateEventProcessorOutput,
  type StateEventProcessorContext,
  createInitialStateEventProcessorContext,
  // TurnTracker
  turnTrackerProcessor,
  turnTrackerProcessorDef,
  type TurnTrackerInput,
  type TurnTrackerOutput,
  type TurnTrackerState,
  type PendingTurn,
  createInitialTurnTrackerState,
} from "./internal";

// ===== Mealy Machine Core (for building custom processors) =====
export {
  // Core types
  type Source,
  type SourceDefinition,
  type Processor,
  type ProcessorResult,
  type ProcessorDefinition,
  type Sink,
  type SinkDefinition,
  type Store,
  MemoryStore,
  // Combinators
  combineProcessors,
  combineInitialStates,
  chainProcessors,
  filterProcessor,
  mapOutput,
  withLogging,
  identityProcessor,
} from "~/mealy";
