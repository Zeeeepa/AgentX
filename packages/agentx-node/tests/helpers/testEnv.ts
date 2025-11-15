/**
 * Test Environment Configuration
 *
 * Loads test environment variables from .env.test file.
 * Determines whether to use real Claude API or MockProvider based on credentials.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TestEnvironment {
  /** Whether to use real Claude API */
  useRealAPI: boolean;
  /** Agent API key (if using real API) */
  apiKey?: string;
  /** Agent base URL (if using real API) */
  baseUrl?: string;
}

/**
 * Load environment variables from .env.test file
 */
function loadEnvFile(): Record<string, string> {
  const envPath = resolve(__dirname, "../../.env.test");

  if (!existsSync(envPath)) {
    return {};
  }

  const content = readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      env[key] = value;
    }
  }

  return env;
}

/**
 * Get test environment configuration
 *
 * Priority:
 * 1. Environment variables (process.env)
 * 2. .env.test file
 * 3. Default to mock mode
 */
export function getTestEnvironment(): TestEnvironment {
  // Load .env.test if exists
  const envFile = loadEnvFile();

  // Get API key (env var > .env.test)
  const apiKey =
    process.env.AGENT_API_KEY || envFile.AGENT_API_KEY;

  // Get base URL (env var > .env.test)
  const baseUrl = process.env.AGENT_BASE_URL || envFile.AGENT_BASE_URL;

  // Use real API if both credentials are provided
  const useRealAPI = Boolean(apiKey && baseUrl);

  return {
    useRealAPI,
    apiKey: useRealAPI ? apiKey : undefined,
    baseUrl: useRealAPI ? baseUrl : undefined,
  };
}

/**
 * Test environment singleton
 */
export const testEnv = getTestEnvironment();

/**
 * Log test environment info
 */
export function logTestEnvironment(): void {
  if (testEnv.useRealAPI) {
    console.log("🌐 Test Mode: Real Claude API");
    console.log(`   Base URL: ${testEnv.baseUrl}`);
    console.log(`   API Key: ${testEnv.apiKey?.substring(0, 20)}...`);
  } else {
    console.log("🎭 Test Mode: MockProvider (default)");
    console.log("   Tip: Create .env.test with credentials to use real API");
  }
}
