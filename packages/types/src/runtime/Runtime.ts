/**
 * Unsubscribe function returned by event subscription.
 */
export type Unsubscribe = () => void;

/**
 * Handler function for runtime events.
 * Generic to allow different event types.
 */
export type RuntimeEventHandler<E = unknown> = (event: E) => void;

/**
 * Runtime interface - the Agent Runtime from systems theory perspective.
 *
 * The Runtime is the execution environment where agents operate:
 * - Agents interact with their environment
 * - Receptors sense signals and produce events
 * - Effectors act upon the environment
 * - Observers subscribe to runtime events
 *
 * This is a pure abstraction. Concrete implementations are in @agentxjs/runtime.
 */
export interface Runtime<E = unknown> {
  /**
   * Subscribe to all runtime events.
   *
   * @param handler - Callback invoked for each event
   * @returns Unsubscribe function to stop listening
   */
  on(handler: RuntimeEventHandler<E>): Unsubscribe;

  /**
   * Emit an event to the runtime.
   * Used internally by Receptors.
   *
   * @param event - The event to emit
   */
  emit(event: E): void;

  /**
   * Dispose the runtime and clean up resources.
   */
  dispose(): void;
}
