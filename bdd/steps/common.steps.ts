/**
 * Common Step Definitions
 *
 * Shared steps used across all feature files:
 * - AgentX client creation and connection
 * - Response assertions
 * - Value saving and referencing
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { createAgentX } from "agentxjs";
import { AgentXWorld } from "../support/world";

// ============================================================================
// AgentX Client Setup
// ============================================================================

/**
 * Create and connect an AgentX client to the test server
 */
Given(
  "I create an AgentX client connected to the test server",
  async function (this: AgentXWorld) {
    const serverUrl = AgentXWorld.getTestServerUrl();
    this.agentx = await createAgentX({ serverUrl });
  }
);

/**
 * Create AgentX client with custom configuration
 */
Given(
  "I create an AgentX client with:",
  async function (this: AgentXWorld, dataTable: { rawTable: string[][] }) {
    const config: Record<string, unknown> = {
      serverUrl: AgentXWorld.getTestServerUrl(),
    };

    for (const [key, value] of dataTable.rawTable.slice(1)) {
      if (value === "true") config[key] = true;
      else if (value === "false") config[key] = false;
      else if (!isNaN(Number(value))) config[key] = Number(value);
      else config[key] = value;
    }

    this.agentx = await createAgentX(config as Parameters<typeof createAgentX>[0]);
  }
);

// ============================================================================
// Response Assertions
// ============================================================================

/**
 * Check the response has no error
 */
Then("the response should succeed", function (this: AgentXWorld) {
  assert.ok(this.lastResponse, "No response received");
  assert.ok(!this.lastResponse.error, `Response has error: ${this.lastResponse.error}`);
});

/**
 * Check the response has an error
 */
Then("the response should have an error", function (this: AgentXWorld) {
  assert.ok(this.lastResponse, "No response received");
  assert.ok(this.lastResponse.error, "Expected response to have error");
});

/**
 * Check error message contains text
 */
Then(
  "the error message should contain {string}",
  function (this: AgentXWorld, text: string) {
    assert.ok(this.lastResponse, "No response received");
    assert.ok(this.lastResponse.error, "Expected response to have error");
    assert.ok(
      this.lastResponse.error.includes(text),
      `Error "${this.lastResponse.error}" does not contain "${text}"`
    );
  }
);

/**
 * Check response field equals value
 */
Then(
  "response.{word} should be {string}",
  function (this: AgentXWorld, field: string, expected: string) {
    assert.ok(this.lastResponse, "No response received");

    // Resolve saved values in expected (e.g., ${containerId})
    const resolvedExpected = expected.replace(/\$\{(\w+)\}/g, (_, name) => {
      const saved = this.savedValues.get(name);
      assert.ok(saved, `Saved value "${name}" not found`);
      return saved;
    });

    const value = getNestedValue(this.lastResponse, field);
    assert.strictEqual(String(value), resolvedExpected);
  }
);

/**
 * Check response field is truthy
 */
Then(
  "response.{word} should be truthy",
  function (this: AgentXWorld, field: string) {
    assert.ok(this.lastResponse, "No response received");
    const value = getNestedValue(this.lastResponse, field);
    assert.ok(value, `Expected response.${field} to be truthy, got: ${value}`);
  }
);

/**
 * Check response field is falsy
 */
Then(
  "response.{word} should be falsy",
  function (this: AgentXWorld, field: string) {
    assert.ok(this.lastResponse, "No response received");
    const value = getNestedValue(this.lastResponse, field);
    assert.ok(!value, `Expected response.${field} to be falsy, got: ${value}`);
  }
);

/**
 * Check response array field has length
 */
Then(
  "response.{word} should have length {int}",
  function (this: AgentXWorld, field: string, length: number) {
    assert.ok(this.lastResponse, "No response received");
    const value = getNestedValue(this.lastResponse, field);
    assert.ok(Array.isArray(value), `Expected response.${field} to be an array`);
    assert.strictEqual(value.length, length);
  }
);

/**
 * Check response array field contains value
 */
Then(
  "response.{word} should contain {string}",
  function (this: AgentXWorld, field: string, expected: string) {
    assert.ok(this.lastResponse, "No response received");
    const value = getNestedValue(this.lastResponse, field);

    // Resolve saved values
    const resolvedExpected = expected.replace(/\$\{(\w+)\}/g, (_, name) => {
      const saved = this.savedValues.get(name);
      assert.ok(saved, `Saved value "${name}" not found`);
      return saved;
    });

    if (Array.isArray(value)) {
      assert.ok(
        value.includes(resolvedExpected),
        `Expected response.${field} to contain "${resolvedExpected}"`
      );
    } else if (typeof value === "string") {
      assert.ok(
        value.includes(resolvedExpected),
        `Expected response.${field} to contain "${resolvedExpected}"`
      );
    } else {
      assert.fail(`response.${field} is neither array nor string`);
    }
  }
);

// ============================================================================
// Value Saving
// ============================================================================

/**
 * Save a response field value for later use
 */
Then(
  "I save response.{word} as {string}",
  function (this: AgentXWorld, field: string, name: string) {
    assert.ok(this.lastResponse, "No response received");
    const value = getNestedValue(this.lastResponse, field);
    assert.ok(value !== undefined, `response.${field} is undefined`);
    this.savedValues.set(name, String(value));
  }
);

/**
 * Reference a saved value
 */
When(
  "I use saved {string} as {string}",
  function (this: AgentXWorld, savedName: string, targetName: string) {
    const value = this.savedValues.get(savedName);
    assert.ok(value, `Saved value "${savedName}" not found`);
    this.savedValues.set(targetName, value);
  }
);

// ============================================================================
// Connection State
// ============================================================================

/**
 * Check client is connected
 */
Then("the client should be connected", function (this: AgentXWorld) {
  assert.ok(this.agentx, "AgentX client not initialized");
  assert.ok(this.agentx.connected, "Client is not connected");
});

/**
 * Check client is disconnected
 */
Then("the client should be disconnected", function (this: AgentXWorld) {
  assert.ok(this.agentx, "AgentX client not initialized");
  assert.ok(!this.agentx.connected, "Client is still connected");
});

/**
 * Disconnect the client
 */
When("I disconnect the client", async function (this: AgentXWorld) {
  assert.ok(this.agentx, "AgentX client not initialized");
  await this.agentx.disconnect();
});

/**
 * Dispose the client
 */
When("I dispose the client", async function (this: AgentXWorld) {
  assert.ok(this.agentx, "AgentX client not initialized");
  await this.agentx.dispose();
  this.agentx = undefined;
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get nested value from object using dot notation
 * e.g., "record.imageId" -> obj.record.imageId
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current = obj as Record<string, unknown>;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part] as Record<string, unknown>;
  }

  return current;
}
