/**
 * Next.js Instrumentation Hook
 *
 * Starts the AgentX WebSocket server when the Node.js runtime initializes.
 * This is the recommended way to run background services in Next.js 15+.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only start in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Load monorepo root .env.local (shared config)
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    try {
      const envPath = resolve(process.cwd(), "../../.env.local");
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        // Don't override existing env vars (portagent's own take precedence)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // Monorepo .env.local not found, skip
    }

    const { startAgentXServer } = await import("@/lib/agentx");
    await startAgentXServer();
  }
}
