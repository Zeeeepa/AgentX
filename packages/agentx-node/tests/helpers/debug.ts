/**
 * Debug logging utilities for tests
 *
 * Enable debug logs by setting environment variable:
 * DEBUG_TESTS=1 pnpm test
 */

const DEBUG_ENABLED = process.env.DEBUG_TESTS === "1";

export function debugLog(message: string, ...args: any[]) {
  if (DEBUG_ENABLED) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
