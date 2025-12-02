/**
 * Process - Command execution resource
 *
 * Provides ability to execute shell commands.
 * This is a Resource layer component - atomic, replaceable.
 *
 * ## Architecture Decision Record (ADR)
 *
 * ### Context
 *
 * Agent needs to execute shell commands (Bash tool, etc.).
 * Execution environment can vary:
 * - Local: child_process
 * - Cloud: Cloudflare Containers, remote Docker, SSH
 *
 * Note: Serverless (Workers) typically cannot spawn processes.
 * This is why we need Container for tool execution.
 *
 * ### Decision
 *
 * Simple exec interface that returns result after completion.
 * spawn (streaming) can be added later if needed.
 *
 * ### Usage
 *
 * ```typescript
 * const process = new LocalProcess({ cwd: '/workspace' });
 * const result = await process.exec('ls -la');
 * console.log(result.stdout);
 * ```
 *
 * ### Status
 *
 * **Accepted** - 2024-11-30
 */

/**
 * Options for command execution
 */
export interface ExecOptions {
  /**
   * Working directory
   */
  cwd?: string;

  /**
   * Environment variables (merged with system env)
   */
  env?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Max buffer size for stdout/stderr (default: 1MB)
   */
  maxBuffer?: number;
}

/**
 * Result of command execution
 */
export interface ExecResult {
  /**
   * Standard output
   */
  stdout: string;

  /**
   * Standard error
   */
  stderr: string;

  /**
   * Exit code (0 = success)
   */
  exitCode: number;
}

/**
 * Process - Command execution resource
 */
export interface Process {
  /**
   * Execute a shell command
   *
   * @param command - Command to execute (passed to shell)
   * @param options - Execution options
   * @returns Result with stdout, stderr, exitCode
   */
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;
}
