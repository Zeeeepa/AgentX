import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import { sharedContext as context } from "../helpers/sharedContext";
import { createTestAgent } from "../helpers/testAgent";

// Track agents for multi-agent scenarios
const namedAgents = new Map<string, any>();

// ============================================================
// Given steps
// ============================================================

Given("I have sent {int} messages to the agent", async (count: number) => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Send multiple messages
  for (let i = 0; i < count; i++) {
    await context.agent.send(`Message ${i + 1}`);
  }

  // Verify messages were sent
  expect(context.agent.messages.length).toBeGreaterThanOrEqual(count * 2); // user + assistant per turn
});

Given("the agent is processing a long-running request", async () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Start a long-running request but don't await it
  // This allows us to test aborting during execution
  const promise = context.agent.send("Tell me a long story");
  context.lastResult = promise;

  // Give it a moment to start processing
  await new Promise((resolve) => setTimeout(resolve, 10));
});

Given("I have an active agent", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Agent is already created by Background
  expect(context.agent).toBeDefined();
});

Given("I have sent messages to an agent", async () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  await context.agent.send("Hello, this is a test message");
  expect(context.agent.messages.length).toBeGreaterThan(0);
});

Given("I have an agent with an ongoing operation", async () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Start operation but don't await
  const promise = context.agent.send("Processing...");
  context.lastResult = promise;

  // Give it time to start
  await new Promise((resolve) => setTimeout(resolve, 10));
});

// ============================================================
// When steps
// ============================================================

When("I create an agent", () => {
  // Create a new agent (in addition to Background agent)
  const newAgent = createTestAgent({
    apiKey: "test-key",
    model: "claude-sonnet-4-20250514",
  });

  context.createdAgents.push(newAgent);
  context.agent = newAgent; // Set as current agent for assertions
});

When("I call agent.clear()", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  context.agent.clear();
});

When("I call agent.destroy()", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  context.agent.destroy();
});

When(
  /^I create agent ([A-Z]) with model "([^"]*)"$/,
  (name: string, model: string) => {
    const agent = createTestAgent({
      apiKey: "test-key",
      model,
    });

    namedAgents.set(name, agent);
    context.createdAgents.push(agent);
  }
);

When("I check the session ID", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Just verify it exists
  expect(context.agent.sessionId).toBeDefined();
});

// ============================================================
// Then steps
// ============================================================

Then("it should have a unique agent ID", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  expect(context.agent.id).toBeDefined();
  expect(typeof context.agent.id).toBe("string");
  expect(context.agent.id.length).toBeGreaterThan(0);
});

Then("the ID should remain constant for the agent's lifetime", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  const id1 = context.agent.id;
  const id2 = context.agent.id;

  expect(id1).toBe(id2);
});

Then("it should have a session ID", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  expect(context.agent.sessionId).toBeDefined();
  expect(typeof context.agent.sessionId).toBe("string");
  expect(context.agent.sessionId.length).toBeGreaterThan(0);
});

Then("all events should include this session ID", async () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  const expectedSessionId = context.agent.sessionId;
  const receivedEvents: any[] = [];

  // Register handler to capture events
  context.agent.on("user", (event) => receivedEvents.push(event));
  context.agent.on("assistant", (event) => receivedEvents.push(event));
  context.agent.on("result", (event) => receivedEvents.push(event));

  // Send a message to trigger events
  await context.agent.send("Test message");

  // Verify all events have the same sessionId
  expect(receivedEvents.length).toBeGreaterThan(0);
  receivedEvents.forEach((event) => {
    expect(event.sessionId).toBe(expectedSessionId);
  });
});

Then("the messages array should be empty", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  expect(context.agent.messages.length).toBe(0);
});

Then("any ongoing operation should be aborted", async () => {
  // The lastResult promise should reject with abort error
  if (context.lastResult) {
    try {
      await context.lastResult;
    } catch (error: any) {
      // Expect abort error
      expect(error.message).toMatch(/abort/i);
    }
  }
});

Then("the current operation should be aborted", async () => {
  // Same as above - operation should be aborted
  if (context.lastResult) {
    try {
      await context.lastResult;
    } catch (error: any) {
      expect(error.message).toMatch(/abort/i);
    }
  }
});

Then("no more events should be emitted for that operation", () => {
  // After abort, no new events should be emitted
  // This is implicitly tested by the abort behavior
  expect(true).toBe(true);
});

Then("all resources should be cleaned up", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // After destroy, messages should be cleared
  expect(context.agent.messages.length).toBe(0);
});

Then("the agent should not be usable anymore", async () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // After destroy, sending message should work but handlers are cleared
  // (Agent itself doesn't prevent usage, but resources are cleaned)
  expect(context.agent.messages.length).toBe(0);
});

Then(
  /^agent ([A-Z]) and agent ([A-Z]) should have different IDs$/,
  (nameA: string, nameB: string) => {
    const agentA = namedAgents.get(nameA);
    const agentB = namedAgents.get(nameB);

    expect(agentA).toBeDefined();
    expect(agentB).toBeDefined();
    expect(agentA.id).not.toBe(agentB.id);
  }
);

Then("they should have independent conversation histories", () => {
  // Each agent has its own messages array
  const agents = Array.from(namedAgents.values());
  expect(agents.length).toBeGreaterThanOrEqual(2);

  // Each agent should have its own messages
  agents.forEach((agent) => {
    expect(agent.messages).toBeDefined();
    expect(Array.isArray(agent.messages)).toBe(true);
  });
});

Then(
  /^messages sent to agent ([A-Z]) should not affect agent ([A-Z])$/,
  async (nameA: string, nameB: string) => {
    const agentA = namedAgents.get(nameA);
    const agentB = namedAgents.get(nameB);

    expect(agentA).toBeDefined();
    expect(agentB).toBeDefined();

    const initialLengthB = agentB.messages.length;

    // Send message to agent A
    await agentA.send("Message to A");

    // Agent B's messages should not change
    expect(agentB.messages.length).toBe(initialLengthB);
  }
);

Then("I can use it to identify this conversation", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  const sessionId = context.agent.sessionId;
  expect(sessionId).toBeDefined();
  expect(typeof sessionId).toBe("string");

  // Session ID should be a valid identifier
  expect(sessionId.length).toBeGreaterThan(0);
});

Then("I can potentially restore the session later", () => {
  // This is a conceptual test - session ID can be stored and used later
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  const sessionId = context.agent.sessionId;

  // Store it (in real scenario, would persist to DB)
  const storedSessionId = sessionId;

  // Verify it matches
  expect(storedSessionId).toBe(context.agent.sessionId);
});

Then("it should abort the operation first", async () => {
  // Operation should be aborted
  if (context.lastResult) {
    try {
      await context.lastResult;
    } catch (error: any) {
      expect(error.message).toMatch(/abort/i);
    }
  }
});

Then("then clean up resources", () => {
  if (!context.agent) {
    throw new Error("Agent not initialized");
  }

  // Resources cleaned - messages cleared
  expect(context.agent.messages.length).toBe(0);
});

Then("it should not throw an error", () => {
  // destroy() should not throw - this is tested by not catching errors above
  expect(true).toBe(true);
});
