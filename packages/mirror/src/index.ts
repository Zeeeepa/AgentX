/**
 * @agentxjs/mirror - Browser-side AgentX implementation
 *
 * Provides:
 * - MirrorRuntime: Browser-side Runtime
 * - MirrorPersistence: HTTP-based Persistence
 *
 * This is a private package, bundled into agentxjs.
 * Users should use `createMirror` from agentxjs instead.
 *
 * @internal
 * @packageDocumentation
 */

// Runtime
export { MirrorRuntime, type MirrorRuntimeConfig } from "./runtime";
export { SystemBusImpl } from "./runtime";

// Persistence
export { MirrorPersistence, type MirrorPersistenceConfig } from "./persistence";
