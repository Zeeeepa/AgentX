/**
 * OS - Operating System abstraction
 *
 * Combines all low-level OS capabilities that Sandbox components need.
 * This is the foundation layer that Agent, MCP, Workspace run on.
 *
 * ## Architecture Decision Record (ADR)
 *
 * ### Context
 *
 * Agent needs OS-level capabilities:
 * - FileSystem (read/write files)
 * - Process (execute commands)
 * - Env (environment variables)
 * - Disk (storage mount)
 *
 * These are operating system abstractions, not business logic.
 *
 * ### Decision
 *
 * Create OS interface that combines all OS-level resources.
 * Implementations can be:
 * - LocalOS: Use local OS directly
 * - DockerOS: Everything in Docker container
 * - CloudOS: Cloudflare R2 + Containers + KV
 * - HybridOS: Mix and match (Docker + JuiceFS + Vault)
 *
 * ### Layer Architecture
 *
 * ```
 * Sandbox (业务组件: Agent, MCP, Workspace)
 *     ↓ runs on
 * OS (操作系统抽象: FileSystem, Process, Env, Disk)
 *     ↓ implemented by
 * Infrastructure (Docker, Local, Cloud)
 * ```
 *
 * ### Status
 *
 * **Accepted** - 2024-11-30
 */

import type { FileSystem } from "./FileSystem";
import type { Process } from "./Process";
import type { Env } from "./Env";
import type { Disk } from "./Disk";

/**
 * OS - Operating System abstraction
 *
 * Provides all OS-level capabilities needed by Sandbox components.
 */
export interface OS {
  /**
   * OS identifier
   */
  readonly name: string;

  /**
   * File system operations
   */
  readonly fs: FileSystem;

  /**
   * Command execution
   */
  readonly process: Process;

  /**
   * Environment variables
   */
  readonly env: Env;

  /**
   * Storage mount
   */
  readonly disk: Disk;
}
