/**
 * Sandbox
 *
 * Pure resource isolation layer for an Agent.
 * Isolates two types of resources: OS and LLM.
 *
 * Architecture:
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │                  Container                       │
 * │  ┌───────────────────────────────────────────┐  │
 * │  │  Agent 1 ──────→ Sandbox 1 (OS + LLM)     │  │
 * │  │  Agent 2 ──────→ Sandbox 2 (OS + LLM)     │  │
 * │  │  Agent 3 ──────→ Sandbox 3 (OS + LLM)     │  │
 * │  └───────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────┘
 * ```
 *
 * Flow:
 * 1. Create Sandbox (allocate OS + LLM resources)
 * 2. Create Agent with Sandbox reference
 * 3. Agent.sandbox provides resources to Driver
 * 4. Container registers Agent
 *
 * Note: Workspace is business logic, not a resource.
 * It should be handled at Agent/Driver layer, not Sandbox.
 */

import type { OS } from "./os";
import type { LLMProvider } from "./llm";

/**
 * Sandbox - Pure resource isolation
 *
 * Isolates resources for an Agent:
 * - OS: FileSystem, Process, Env, Disk
 * - LLM: Large Language Model provider
 *
 * Note: Agent holds Sandbox, not vice versa (avoids circular dependency)
 */
export interface Sandbox {
  /** Sandbox identifier */
  readonly name: string;

  /** OS-level resources */
  readonly os: OS;

  /** LLM provider resource */
  readonly llm: LLMProvider;
}
