/**
 * BDD World - Shared context for all step definitions
 *
 * Following ResourceX pattern:
 * - BeforeAll: Start test server
 * - AfterAll: Stop test server
 * - World: Simple context with saved values and events
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

// ============================================================================
// Test Server Management
// ============================================================================

let testServer: AgentXServer | null = null;
let testPort: number = 15300;

/**
 * Start the test server before all tests
 */
BeforeAll({ timeout: 30000 }, async function () {
  const { createServer } = await import("@agentxjs/server");
  const { createNodeProvider } = await import("@agentxjs/node-provider");
  const { MockEnvironmentFactory } = await import("../mock");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { mkdtempSync } = await import("node:fs");

  // Create temporary directory for test data
  const tempDir = mkdtempSync(join(tmpdir(), "agentx-bdd-"));

  // Create mock driver factory
  const mockFactory = new MockEnvironmentFactory();
  const mockDriverFactory = {
    name: "mock-driver",
    createDriver: (config: { agentId: string; sessionId: string }) => {
      const env = mockFactory.create({ agentId: config.agentId });
      return {
        name: "mock-driver",
        effector: env.effector,
        receptor: env.receptor,
        dispose: () => env.dispose(),
      };
    },
  };

  // Create provider with mock driver
  const provider = await createNodeProvider({
    dataPath: tempDir,
    driverFactory: mockDriverFactory,
  });

  // Create and start test server
  testServer = await createServer({
    provider,
    port: testPort,
  });

  await testServer.listen();
  console.log(`\n[BDD] Test server started on ws://localhost:${testPort}\n`);
});

/**
 * Stop the test server after all tests
 */
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

/**
 * AgentXWorld - Shared test context
 */
export class AgentXWorld extends World {
  // AgentX client instance
  agentx?: AgentX;

  // Last response from API call
  lastResponse?: BaseResponse;

  // Collected events from subscriptions
  collectedEvents: BusEvent[] = [];

  // Event handlers for cleanup
  private eventHandlers: Unsubscribe[] = [];

  // Saved values between steps (e.g., containerId, imageId)
  savedValues: Map<string, string> = new Map();

  // Unique scenario ID for data isolation
  scenarioId: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.scenarioId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get the test server port
   */
  static getTestServerPort(): number {
    return testPort;
  }

  /**
   * Get the test server URL
   */
  static getTestServerUrl(): string {
    return `ws://localhost:${testPort}`;
  }

  // ==================== Event Helpers ====================

  /**
   * Subscribe to an event type and collect events
   */
  subscribeToEvent(type: string): void {
    if (!this.agentx) throw new Error("AgentX not initialized");

    const unsubscribe = this.agentx.on(type, (event) => {
      this.collectedEvents.push(event);
    });

    this.eventHandlers.push(unsubscribe);
  }

  /**
   * Subscribe to all events
   */
  subscribeToAllEvents(): void {
    if (!this.agentx) throw new Error("AgentX not initialized");

    const unsubscribe = this.agentx.onAny((event) => {
      this.collectedEvents.push(event);
    });

    this.eventHandlers.push(unsubscribe);
  }

  /**
   * Get events of a specific type
   */
  getEventsOfType(type: string): BusEvent[] {
    return this.collectedEvents.filter((e) => e.type === type);
  }

  /**
   * Wait for an event of a specific type
   */
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

  /**
   * Clear collected events
   */
  clearEvents(): void {
    this.collectedEvents = [];
  }

  // ==================== Cleanup ====================

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Unsubscribe all handlers
    for (const unsubscribe of this.eventHandlers) {
      unsubscribe();
    }
    this.eventHandlers = [];

    // Dispose client
    if (this.agentx) {
      await this.agentx.dispose();
      this.agentx = undefined;
    }

    // Clear state
    this.lastResponse = undefined;
    this.collectedEvents = [];
    this.savedValues.clear();
  }
}

setWorldConstructor(AgentXWorld);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Reset state before each scenario
 */
Before(async function (this: AgentXWorld) {
  this.collectedEvents = [];
  this.savedValues.clear();
  this.lastResponse = undefined;
});

/**
 * Cleanup after each scenario
 */
After(async function (this: AgentXWorld) {
  await this.cleanup();
});
