/**
 * Runtime types
 *
 * Container layer: manages multiple Agents (1:N)
 * Sandbox layer: pure resource isolation (OS + LLM)
 *
 * Hierarchy: Container → Agent → Sandbox (OS + LLM)
 */

export * from "./container";
export * from "./sandbox";
