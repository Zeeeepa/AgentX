# AgentX Node Testing Guide

This document explains the testing strategy and how to write tests for the AgentX Node package.

## Overview

We use **BDD (Behavior-Driven Development)** with Cucumber and Vitest to test the AgentX Node implementation. Tests are written in Gherkin syntax (.feature files) and implemented using step definitions.

**Test Results**: ✅ 42/42 tests passing (100%)

## Quick Start

```bash
# Run all tests
pnpm test

# Run specific feature
pnpm test dist/features/agent-messaging.feature

# Run tests with debug logs
DEBUG_TESTS=1 pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Architecture

### Directory Structure

```
packages/agentx-node/
├── tests/
│   ├── helpers/              # Shared utilities
│   │   ├── debug.ts          # Debug logging (DEBUG_TESTS=1)
│   │   ├── sharedContext.ts  # Shared test context
│   │   └── testAgent.ts      # Agent factory for tests
│   ├── mocks/
│   │   └── MockProvider.ts   # Mock Claude API provider
│   ├── steps/                # Step definitions (Cucumber)
│   │   ├── configuration.steps.ts
│   │   ├── messaging.steps.ts
│   │   ├── events.steps.ts
│   │   ├── lifecycle.steps.ts
│   │   └── error-handling.steps.ts
│   └── README.md             # This file
├── dist/
│   └── features/             # Feature files (copied from agentx-api)
│       ├── agent-configuration.feature
│       ├── agent-messaging.feature
│       ├── agent-events.feature
│       ├── agent-lifecycle.feature
│       └── error-handling.feature
└── vitest.config.ts
```

### Test Flow

```
Feature Files (Gherkin)
    ↓
Step Definitions (TypeScript)
    ↓
Test Helpers (MockProvider, testAgent)
    ↓
Agent Implementation
```

## Writing Tests

### 1. Feature Files

Feature files are located in `packages/agentx-api/features/` and define test scenarios in Gherkin syntax.

**Example**:
```gherkin
Feature: Agent Messaging
  As a developer
  I want to send messages to the agent
  So that I can get AI responses

  Background:
    Given I have created an agent with valid configuration

  Scenario: Send a simple text message
    When I send the message "Hello, Claude!"
    Then the agent should emit a "user" event with my message
    And the agent should emit an "assistant" event with a response
```

### 2. Step Definitions

Step definitions are TypeScript functions that implement the steps from feature files.

**Location**: `packages/agentx-node/tests/steps/`

**Example**:
```typescript
import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import { sharedContext as context } from "../helpers/sharedContext";
import { createTestAgent } from "../helpers/testAgent";

Given("I have created an agent with valid configuration", () => {
  context.agent = createTestAgent({
    apiKey: "test-key",
    model: "claude-3-5-sonnet-20241022",
  });
  context.createdAgents.push(context.agent);
});

When("I send the message {string}", async (message: string) => {
  await context.agent.send(message);
});

Then("the agent should emit a {string} event", (eventType: string) => {
  expect(context.events.some(e => e.type === eventType)).toBe(true);
});
```

### 3. Shared Context

All step definition files share a common context to pass data between steps.

**Location**: `packages/agentx-node/tests/helpers/sharedContext.ts`

**Available fields**:
```typescript
interface SharedTestContext {
  // Agent instances
  agent?: Agent;
  createdAgents: Agent[];

  // Configuration
  agentConfig?: Partial<AgentConfig>;

  // Events
  events: AgentEvent[];
  userEvents: UserMessageEvent[];
  assistantEvents: AssistantMessageEvent[];
  streamEvents: StreamDeltaEvent[];
  resultEvents: ResultEvent[];

  // Event handlers
  unregisterHandlers?: Map<string, () => void>;

  // Results
  lastResult?: any;

  // Errors
  error?: Error;

  // Counters
  messagesSent: number;
}
```

## Test Helpers

### MockProvider

Simulates Claude API responses without making real API calls.

**Location**: `packages/agentx-node/tests/mocks/MockProvider.ts`

**Usage**:
```typescript
const provider = new MockProvider(
  { apiKey: "test-key", model: "claude-sonnet-4" },
  {
    delay: 100,                    // Simulate API delay
    simulateError: true,           // Trigger error
    errorType: "network",          // Error type
    customResponse: "Custom text", // Override response
    streamChunks: ["Hello", " ", "world"] // Custom chunks
  }
);
```

### createTestAgent

Factory function to create agents for testing.

**Location**: `packages/agentx-node/tests/helpers/testAgent.ts`

**Usage**:
```typescript
// Unit test with MockProvider (default)
const agent = createTestAgent({
  apiKey: "test-key",
  model: "claude-sonnet-4",
});

// Integration test with real API
// Run with: TEST_MODE=integration pnpm test
const agent = createTestAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4",
});
```

### Debug Logging

Enable debug logs to troubleshoot test failures.

**Location**: `packages/agentx-node/tests/helpers/debug.ts`

**Usage**:
```typescript
import { debugLog } from "../helpers/debug";

debugLog("Agent created", agent.id);
debugLog("Sending message:", message);
```

**Enable**:
```bash
DEBUG_TESTS=1 pnpm test
```

## Common Patterns

### Pattern 1: Testing Event Emission

```typescript
Given("I register a handler for {string} events", (eventType: string) => {
  const events: AgentEvent[] = [];
  context.agent.on(eventType, (event) => {
    events.push(event);
  });
  context.capturedEvents = events;
});

When("I send a message", async () => {
  await context.agent.send("Test message");
});

Then("I should receive the event", () => {
  expect(context.capturedEvents.length).toBeGreaterThan(0);
});
```

### Pattern 2: Testing Error Handling

```typescript
When("I try to create an agent with invalid config", () => {
  try {
    createTestAgent({ apiKey: "" }); // Invalid
  } catch (error) {
    context.error = error;
  }
});

Then("it should throw an AgentConfigError", () => {
  expect(context.error).toBeInstanceOf(AgentConfigError);
});
```

### Pattern 3: Testing Async Operations

```typescript
When("the agent is processing a request", async () => {
  // Don't await - let it run in background
  context.lastResult = context.agent.send("Long request");
  await new Promise(resolve => setTimeout(resolve, 10));
});

When("I abort the operation", () => {
  context.agent.clear();
});

Then("the operation should be aborted", async () => {
  try {
    await context.lastResult;
  } catch (error) {
    expect(error.message).toMatch(/abort/i);
  }
});
```

## Best Practices

### 1. Use Background for Common Setup

```gherkin
Background:
  Given I have created an agent with valid configuration

Scenario: Test message sending
  When I send a message "Hello"
  Then I should get a response
```

### 2. Keep Steps Reusable

❌ Bad (too specific):
```typescript
When("I send 'Hello' to the agent", async () => {
  await context.agent.send("Hello");
});
```

✅ Good (reusable):
```typescript
When("I send the message {string}", async (message: string) => {
  await context.agent.send(message);
});
```

### 3. Clean Up After Each Scenario

```typescript
import { After } from "@deepracticex/vitest-cucumber";

After(() => {
  resetSharedContext(); // Cleans up agents, events, etc.
});
```

### 4. Avoid Step Definition Conflicts

If multiple step files have the same step name, Cucumber may choose the wrong one. Solutions:

**Option A**: Use different step names
```typescript
// events.steps.ts
Then("I should receive events through the handler", () => { ... });

// messaging.steps.ts
Then("I should receive events in the context", () => { ... });
```

**Option B**: Handle both cases in one step
```typescript
Then("I should receive events", () => {
  // Check which context we're in
  if (handlers.get("default")) {
    // Use handler-based verification
  } else {
    // Use context-based verification
  }
});
```

### 5. Use Debug Logs Wisely

Add debug logs for troubleshooting, but guard them:

```typescript
import { debugLog } from "../helpers/debug";

When("I process data", () => {
  debugLog("Processing started", data);
  // ... implementation
  debugLog("Processing completed", result);
});
```

Only enabled when `DEBUG_TESTS=1`.

## Test Modes

### Unit Test Mode (Default)

Uses MockProvider for fast, deterministic tests.

```bash
pnpm test
```

### Integration Test Mode

Uses real Claude API (requires `ANTHROPIC_API_KEY`).

```bash
TEST_MODE=integration pnpm test
```

**Note**: Integration tests will skip if API key is not set.

## Troubleshooting

### Test Fails with "Agent not initialized"

**Cause**: Background step didn't run or agent creation failed.

**Fix**: Check that your feature file has a Background section:
```gherkin
Background:
  Given I have created an agent
```

### Test Fails with "No step definition found"

**Cause**: Step definition doesn't match the feature file step.

**Fix**: Check for typos and ensure step definition uses exact wording:
```typescript
// Feature: When I send a message "Hello"
When("I send a message {string}", async (message: string) => {
  // Must match exactly!
});
```

### Events Not Being Captured

**Cause**: Event handlers registered after events were emitted.

**Fix**: Register handlers in Background or Given steps:
```typescript
Background:
  Given I am listening for events  # Register handlers here

Scenario: Test events
  When I send a message            # Events emitted here
  Then I should receive events     # Check captured events
```

### MockProvider Not Simulating Errors

**Check error configuration**:
```typescript
const provider = new MockProvider(
  { apiKey: "test-key", model: "claude-sonnet-4" },
  {
    simulateError: true,        // Must be true
    errorType: "network",       // Specify error type
  }
);
```

## Feature Files Reference

### agent-configuration.feature (9 tests)
Tests agent creation and configuration options.

### agent-messaging.feature (7 tests)
Tests message sending, streaming, context, and token usage.

### agent-events.feature (8 tests)
Tests event emission, handlers, and event types.

### agent-lifecycle.feature (8 tests)
Tests agent ID, session management, clear(), destroy().

### error-handling.feature (10 tests)
Tests configuration errors, abort errors, API errors, and error types.

## Adding New Tests

### Step 1: Write Feature File

Add to `packages/agentx-api/features/`:

```gherkin
Feature: New Feature
  As a developer
  I want to test something
  So that I can ensure it works

  Scenario: Test case name
    Given some precondition
    When I do something
    Then I should see expected result
```

### Step 2: Create Step Definitions

Add to `packages/agentx-node/tests/steps/`:

```typescript
import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import { sharedContext as context } from "../helpers/sharedContext";

Given("some precondition", () => {
  // Setup
});

When("I do something", async () => {
  // Action
});

Then("I should see expected result", () => {
  // Assertion
  expect(actualResult).toBe(expectedResult);
});
```

### Step 3: Run Tests

```bash
pnpm build                          # Build package first
pnpm test dist/features/new.feature # Run new feature
```

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pnpm install
    pnpm build
    pnpm test
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cucumber/Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [@deepracticex/vitest-cucumber](https://github.com/deepractice/vitest-cucumber)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

## Summary

- ✅ **42/42 tests passing**
- 📝 **5 feature files** covering all core functionality
- 🧪 **BDD approach** with Gherkin + TypeScript
- 🎭 **MockProvider** for fast unit tests
- 🔍 **Debug mode** for troubleshooting
- 🧹 **Clean separation** between features and implementation
