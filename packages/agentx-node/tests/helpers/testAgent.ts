/**
 * Test Agent Helpers
 *
 * Utilities for creating agents in tests.
 * Supports both MockProvider (default) and real ClaudeProvider (opt-in).
 */

import { createAgent as createAgentCore } from "@deepractice-ai/agentx-core";
import type { Agent, AgentConfig } from "@deepractice-ai/agentx-api";
import { MockProvider, type MockProviderOptions } from "../mocks/MockProvider";
import { ClaudeProvider } from "~/providers/ClaudeProvider";
import { testEnv } from "./testEnv";

/**
 * Check if we should use real API
 *
 * Automatically determined by .env.test configuration:
 * - If ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL are set -> use real API
 * - Otherwise -> use MockProvider
 *
 * Can be manually overridden with: TEST_MODE=integration pnpm test
 */
export function useRealAPI(): boolean {
  // Manual override via environment variable
  if (process.env.TEST_MODE === "integration") {
    return true;
  }
  if (process.env.TEST_MODE === "mock") {
    return false;
  }

  // Auto-detect from .env.test
  return testEnv.useRealAPI;
}

/**
 * Create an agent for testing
 *
 * Automatically uses real Claude API if .env.test has credentials configured.
 * Otherwise uses MockProvider for fast, deterministic tests.
 *
 * @param config - Agent configuration (optional, uses defaults if not provided)
 * @param mockOptions - Options for MockProvider (ignored if using real API)
 * @returns Agent instance
 *
 * @example
 * ```typescript
 * // Unit test with mock (default, no .env.test)
 * const agent = createTestAgent();
 *
 * // Integration test with real API (if .env.test has credentials)
 * const agent = createTestAgent();
 *
 * // Custom config
 * const agent = createTestAgent({
 *   apiKey: "custom-key",
 *   model: "claude-sonnet-4",
 * });
 * ```
 */
export function createTestAgent(
  config?: Partial<AgentConfig>,
  mockOptions?: MockProviderOptions
): Agent {
  // Merge with default config
  const finalConfig: AgentConfig = {
    ...getDefaultTestConfig(),
    ...config,
  };

  if (useRealAPI()) {
    // Integration test mode - use real ClaudeProvider with credentials from .env.test
    const provider = new ClaudeProvider({
      ...finalConfig,
      apiKey: testEnv.apiKey!,
      baseUrl: testEnv.baseUrl,
    });
    return createAgentCore(finalConfig, provider);
  } else {
    // Unit test mode (default) - use MockProvider
    const provider = new MockProvider(finalConfig, mockOptions);
    return createAgentCore(finalConfig, provider);
  }
}

/**
 * Get default test config
 *
 * Returns appropriate config based on test mode:
 * - Mock mode: uses dummy API key
 * - Real API mode: credentials from .env.test (handled in createTestAgent)
 */
export function getDefaultTestConfig(): AgentConfig {
  return {
    apiKey: useRealAPI() ? testEnv.apiKey || "" : "mock-api-key",
    model: "claude-sonnet-4-20250514",
  };
}

/**
 * Skip test if not in integration mode
 *
 * Use this to mark tests that require real API
 *
 * @example
 * ```typescript
 * Given("I send a complex multi-turn conversation", function() {
 *   skipUnlessIntegration();
 *   // This test only runs with TEST_MODE=integration
 * });
 * ```
 */
export function skipUnlessIntegration() {
  if (!useRealAPI()) {
    // @ts-ignore - vitest provides this
    this.skip();
  }
}

/**
 * Skip test if in integration mode
 *
 * Use this for tests that should only run with mock
 * Returns early to skip the test when running with real API
 *
 * @example
 * ```typescript
 * Given("I simulate a network error", () => {
 *   if (skipIfIntegration()) return;
 *   // This test only runs in mock mode
 * });
 * ```
 */
export function skipIfIntegration(): boolean {
  return useRealAPI();
}
