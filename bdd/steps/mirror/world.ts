/**
 * Shared world/context for mirror BDD tests
 */

import { setWorldConstructor, setDefaultTimeout, World, Before, After } from "@cucumber/cucumber";
import { MirrorRuntime } from "@agentxjs/mirror";
import { MockPeer } from "../../mocks/MockPeer";
import type { SystemEvent } from "@agentxjs/types";

// Set default timeout to 10 seconds
setDefaultTimeout(10_000);

/**
 * Custom World class for mirror tests
 */
export class MirrorWorld extends World {
  // Core components
  runtime!: MirrorRuntime;
  peer!: MockPeer;

  // Event tracking
  receivedEvents: SystemEvent[] = [];
  unsubscribe: (() => void) | null = null;

  // Container tracking
  containers = new Map<string, unknown>();

  constructor(options: any) {
    super(options);
  }

  /**
   * Reset all state for a new scenario
   */
  reset(): void {
    this.receivedEvents = [];
    this.unsubscribe = null;
    this.containers.clear();
  }

  /**
   * Create MirrorRuntime with MockPeer for testing
   */
  createRuntime(): MirrorRuntime {
    this.peer = new MockPeer();
    this.runtime = new MirrorRuntime({ peer: this.peer });
    return this.runtime;
  }

  /**
   * Subscribe to all mirror events
   */
  subscribeToEvents(): void {
    this.unsubscribe = this.runtime.on((event) => {
      this.receivedEvents.push(event as SystemEvent);
    });
  }

  /**
   * Get the last received event
   */
  getLastEvent(): SystemEvent | undefined {
    return this.receivedEvents[this.receivedEvents.length - 1];
  }

  /**
   * Find event by type
   */
  findEventByType(type: string): SystemEvent | undefined {
    return this.receivedEvents.find((e) => e.type === type);
  }
}

// Set the custom world constructor
setWorldConstructor(MirrorWorld);

// Global Before hook - runs once before each scenario
Before(function (this: MirrorWorld) {
  this.reset();
  this.createRuntime();
});

// After hook for cleanup
After(async function (this: MirrorWorld) {
  if (this.unsubscribe) {
    this.unsubscribe();
  }
  if (this.runtime) {
    try {
      this.runtime.dispose();
    } catch {
      // Ignore errors during cleanup
    }
  }
});
