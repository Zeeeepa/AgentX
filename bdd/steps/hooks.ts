/**
 * Cucumber Hooks - Setup and teardown
 */

import { After, Before, BeforeAll, AfterAll } from "@cucumber/cucumber";
import type { AgentXWorld } from "./world";

BeforeAll(async function () {
  // Global setup if needed
});

AfterAll(async function () {
  // Global teardown if needed
});

Before(async function (this: AgentXWorld) {
  // Reset state before each scenario
  this.collectedEvents = [];
  this.lastResponse = undefined;
});

After(async function (this: AgentXWorld) {
  // Clean up after each scenario
  await this.cleanup();
});
