/**
 * Env - Environment variables resource
 *
 * Provides access to configuration and secrets.
 * This is a Resource layer component - atomic, replaceable.
 *
 * ## Architecture Decision Record (ADR)
 *
 * ### Context
 *
 * Agent needs access to environment variables and secrets.
 * Sources can vary:
 * - Local: process.env
 * - Cloud: Cloudflare Workers Secrets, KV
 * - Secret managers: Vault, AWS Secrets Manager
 *
 * ### Decision
 *
 * Simple get/getAll interface. Implementations handle the source.
 *
 * ### Usage
 *
 * ```typescript
 * const env = new LocalEnv();
 * const apiKey = await env.get('ANTHROPIC_API_KEY');
 * const all = await env.getAll();
 * ```
 *
 * ### Status
 *
 * **Accepted** - 2024-11-30
 */

/**
 * Env - Environment variables resource
 */
export interface Env {
  /**
   * Get a single environment variable
   *
   * @param key - Variable name
   * @returns Value or undefined if not found
   */
  get(key: string): Promise<string | undefined>;

  /**
   * Get all environment variables
   *
   * @returns Record of all variables
   */
  getAll(): Promise<Record<string, string>>;
}
