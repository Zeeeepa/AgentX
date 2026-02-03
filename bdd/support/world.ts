/**
 * BDD World - Shared context for all step definitions
 *
 * Environment Variables:
 * - USE_REAL_API: Set to "true" to use real Claude API
 * - DEEPRACTICE_API_KEY: API key for Claude
 * - DEEPRACTICE_BASE_URL: Base URL for API
 * - DEEPRACTICE_MODEL: Model to use
 */

import {
  setWorldConstructor,
  World,
  BeforeAll,
  AfterAll,
  Before,
  After,
  type IWorldOptions,
} from "@cucumber/cucumber";
import type { AgentX, BaseResponse } from "agentxjs";
import type { BusEvent, Unsubscribe } from "@agentxjs/core/event";
import type { AgentXServer } from "@agentxjs/server";

// Environment is auto-loaded by scripts/env-loader.ts via bunfig.toml preload

// ============================================================================
// Test Server Management
// ============================================================================

let testServer: AgentXServer | null = null;
let testPort: number = 15300;

BeforeAll({ timeout: 60000 }, async function () {
  const useRealApi = process.env.USE_REAL_API === "true";

  const { createServer } = await import("@agentxjs/server");
  const { createNodeProvider } = await import("@agentxjs/node-provider");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { mkdtempSync } = await import("node:fs");

  const tempDir = mkdtempSync(join(tmpdir(), "agentx-bdd-"));

  let driverFactory;

  if (useRealApi) {
    // Use real Claude Driver
    const { createClaudeDriverFactory } = await import("@agentxjs/claude-driver");

    const apiKey = process.env.DEEPRACTICE_API_KEY;
    const baseUrl = process.env.DEEPRACTICE_BASE_URL;
    const model = process.env.DEEPRACTICE_MODEL || "claude-haiku-4-5-20251001";

    if (!apiKey) {
      throw new Error("DEEPRACTICE_API_KEY is required when USE_REAL_API=true");
    }

    console.log(`\n[BDD] Using REAL Claude API (${model})\n`);

    const claudeFactory = createClaudeDriverFactory();
    driverFactory = {
      name: "claude-driver",
      createDriver: (options: { agentId: string; config: Record<string, unknown> }) => {
        return claudeFactory.createDriver({
          ...options,
          config: {
            ...options.config,
            apiKey,
            baseUrl,
            model,
          },
        });
      },
    };
  } else {
    // Use devtools MockDriver
    const { createMockDriverFactory } = await import("@agentxjs/devtools");

    console.log("\n[BDD] Using devtools MockDriver\n");

    driverFactory = createMockDriverFactory();
  }

  const provider = await createNodeProvider({
    dataPath: tempDir,
    driverFactory,
  });

  testServer = await createServer({
    provider,
    port: testPort,
  });

  await testServer.listen();
  console.log(`[BDD] Test server started on ws://localhost:${testPort}\n`);
});

AfterAll({ timeout: 30000 }, async function () {
  if (testServer) {
    await testServer.dispose();
    testServer = null;
    console.log("\n[BDD] Test server stopped\n");
  }
});

// ============================================================================
// World Class
// ============================================================================

export class AgentXWorld extends World {
  agentx?: AgentX;
  lastResponse?: BaseResponse;
  collectedEvents: BusEvent[] = [];
  private eventHandlers: Unsubscribe[] = [];
  savedValues: Map<string, string> = new Map();
  scenarioId: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.scenarioId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  static getTestServerPort(): number {
    return testPort;
  }

  static getTestServerUrl(): string {
    return `ws://localhost:${testPort}`;
  }

  subscribeToEvent(type: string): void {
    if (!this.agentx) throw new Error("AgentX not initialized");
    const unsubscribe = this.agentx.on(type, (event) => {
      this.collectedEvents.push(event);
    });
    this.eventHandlers.push(unsubscribe);
  }

  subscribeToAllEvents(): void {
    if (!this.agentx) throw new Error("AgentX not initialized");
    const unsubscribe = this.agentx.onAny((event) => {
      this.collectedEvents.push(event);
    });
    this.eventHandlers.push(unsubscribe);
  }

  getEventsOfType(type: string): BusEvent[] {
    return this.collectedEvents.filter((e) => e.type === type);
  }

  async waitForEvent(type: string, timeout = 5000): Promise<BusEvent> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const events = this.getEventsOfType(type);
      if (events.length > 0) {
        return events[events.length - 1];
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timeout waiting for event: ${type}`);
  }

  clearEvents(): void {
    this.collectedEvents = [];
  }

  async cleanup(): Promise<void> {
    for (const unsubscribe of this.eventHandlers) {
      unsubscribe();
    }
    this.eventHandlers = [];
    if (this.agentx) {
      await this.agentx.dispose();
      this.agentx = undefined;
    }
    this.lastResponse = undefined;
    this.collectedEvents = [];
    this.savedValues.clear();
  }
}

setWorldConstructor(AgentXWorld);

Before(async function (this: AgentXWorld) {
  this.collectedEvents = [];
  this.savedValues.clear();
  this.lastResponse = undefined;
});

After(async function (this: AgentXWorld) {
  await this.cleanup();
});
