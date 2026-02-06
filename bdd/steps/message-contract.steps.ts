/**
 * Message Contract steps
 *
 * Verifies the converter contract between Core message types and Vercel AI SDK.
 * Tests toVercelMessage() / toVercelMessages() with real message structures.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModelMessage } from "ai";
import type {
  Message,
  ToolResultMessage,
  AssistantMessage,
  ToolResultOutput,
} from "@agentxjs/core/agent";
import { toVercelMessage, toVercelMessages } from "@agentxjs/mono-driver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ============================================================================
// State
// ============================================================================

let currentMessage: Message;
let toolResultMsg: ToolResultMessage;
let assistantMsg: AssistantMessage;
let convertedResult: ModelMessage | null;
let convertedResults: ModelMessage[];

// ============================================================================
// 09 - Message Format Contract
// ============================================================================

// --- Scenario 1: ToolResultMessage converts to Vercel ToolModelMessage ---

Given("the core defines ToolResultMessage as:", function (_table: any) {
  // Construct a realistic ToolResultMessage for testing
  toolResultMsg = {
    id: "msg-tr-001",
    role: "tool",
    subtype: "tool-result",
    toolCallId: "call-abc-123",
    toolResult: {
      type: "tool-result",
      id: "call-abc-123",
      name: "bash_tool",
      output: { type: "text", value: "total 64\ndrwxr-xr-x 12 user staff 384 Jan 1 00:00 ." },
    },
    timestamp: Date.now(),
  };
  currentMessage = toolResultMsg;
});

Given("ToolResultPart.output is a ToolResultOutput union:", function (_table: any) {
  // The table documents the union variants — verified in Then step
});

When("the driver converts it to Vercel AI SDK format", function () {
  convertedResult = toVercelMessage(currentMessage);
});

Then("the Vercel ToolModelMessage must have:", function (table: any) {
  assert.ok(convertedResult, "toVercelMessage returned null for ToolResultMessage");

  const msg = convertedResult as any;
  assert.strictEqual(msg.role, "tool", "Expected role 'tool'");
  assert.ok(Array.isArray(msg.content), "Expected content to be an array");
  assert.strictEqual(msg.content.length, 1, "Expected exactly one content part");

  const part = msg.content[0];
  const rows = table.hashes();
  for (const row of rows) {
    const field = row.field as string;
    const mappedFrom = row["mapped from"] as string;

    // Resolve expected value from the source message
    const expected = resolvePath(toolResultMsg, mappedFrom);
    // Resolve actual value from converted result
    const actual = resolvePath(convertedResult, field);

    assert.deepStrictEqual(
      actual,
      expected,
      `Field "${field}" mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
});

Then("the output must preserve the ToolResultOutput discriminated union", function () {
  // Test each variant of ToolResultOutput is preserved through conversion
  const variants: Array<{ label: string; output: ToolResultOutput }> = [
    { label: "text", output: { type: "text", value: "hello world" } },
    { label: "json", output: { type: "json", value: { count: 42 } } },
    { label: "error-text", output: { type: "error-text", value: "command not found" } },
    { label: "error-json", output: { type: "error-json", value: { code: 127 } } },
    { label: "execution-denied", output: { type: "execution-denied", reason: "user cancelled" } },
  ];

  for (const { label, output } of variants) {
    const msg: ToolResultMessage = {
      id: `msg-${label}`,
      role: "tool",
      subtype: "tool-result",
      toolCallId: `call-${label}`,
      toolResult: {
        type: "tool-result",
        id: `call-${label}`,
        name: "test_tool",
        output,
      },
      timestamp: Date.now(),
    };

    const result = toVercelMessage(msg) as any;
    assert.ok(result, `toVercelMessage returned null for ${label} variant`);
    assert.deepStrictEqual(
      result.content[0].output,
      output,
      `ToolResultOutput "${label}" variant was not preserved through conversion.\n` +
        `  Expected: ${JSON.stringify(output)}\n` +
        `  Got:      ${JSON.stringify(result.content[0].output)}`
    );
  }
});

// --- Scenario 2: AssistantMessage with tool calls converts correctly ---

Given(
  "the core defines AssistantMessage.content as array containing ToolCallPart:",
  function (_table: any) {
    assistantMsg = {
      id: "msg-asst-001",
      role: "assistant",
      subtype: "assistant",
      content: [
        { type: "text", text: "Let me check that for you." },
        {
          type: "tool-call",
          id: "call-xyz-789",
          name: "bash_tool",
          input: { command: "ls -la" },
        },
      ],
      timestamp: Date.now(),
    };
    currentMessage = assistantMsg;
  }
);

Then("each ToolCallPart must map to:", function (table: any) {
  assert.ok(convertedResult, "toVercelMessage returned null for AssistantMessage");

  const msg = convertedResult as any;
  assert.strictEqual(msg.role, "assistant", "Expected role 'assistant'");
  assert.ok(Array.isArray(msg.content), "Expected content to be an array");

  // Find the tool-call part in converted content
  const toolCallParts = msg.content.filter((p: any) => p.type === "tool-call");
  assert.ok(toolCallParts.length > 0, "No tool-call parts found in converted message");

  const sourceToolCall = (assistantMsg.content as any[]).find(
    (p) => p.type === "tool-call"
  );
  const converted = toolCallParts[0];

  const rows = table.hashes();
  for (const row of rows) {
    const vercelField = row["vercel field"] as string;
    const mappedFrom = row["mapped from"] as string;

    const expected = resolveDotPath(sourceToolCall, mappedFrom.replace("part.", ""));
    const actual = converted[vercelField];

    assert.deepStrictEqual(
      actual,
      expected,
      `ToolCall field "${vercelField}" mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
});

// --- Scenario 3: Converters use Core types, not ad-hoc casts ---

Given("a converter function in the driver layer", function () {
  // Read the converter source file for static analysis
});

Then("it must import and use Core message types directly:", function (table: any) {
  const converterPath = resolve(ROOT, "packages/mono-driver/src/converters.ts");
  const source = readFileSync(converterPath, "utf-8");

  const rows = table.hashes();
  for (const row of rows) {
    const forbidden = row["don't"] as string;

    // Check that the "don't" pattern is NOT in the source
    if (forbidden && source.includes(forbidden)) {
      assert.fail(
        `converters.ts contains forbidden pattern: "${forbidden}"\n` +
          `  Should use: "${row["do"]}"`
      );
    }
  }
});

Then("type-safe access prevents silent undefined bugs", function () {
  // Verify by attempting conversion with a real ToolResultMessage
  // If field paths were wrong, output would be undefined
  const msg: ToolResultMessage = {
    id: "msg-safety",
    role: "tool",
    subtype: "tool-result",
    toolCallId: "call-safety",
    toolResult: {
      type: "tool-result",
      id: "call-safety",
      name: "safety_check",
      output: { type: "text", value: "safe" },
    },
    timestamp: Date.now(),
  };

  const result = toVercelMessage(msg) as any;
  assert.ok(result, "Conversion returned null");

  const part = result.content[0];
  assert.ok(part.toolCallId !== undefined, "toolCallId is undefined — field path is wrong");
  assert.ok(part.toolName !== undefined, "toolName is undefined — field path is wrong");
  assert.ok(part.output !== undefined, "output is undefined — field path is wrong");
  assert.notStrictEqual(part.toolName, "unknown", "toolName should not be hardcoded 'unknown'");
  assert.strictEqual(part.toolName, "safety_check", "toolName should come from toolResult.name");
});

// --- Scenario 4: Tool result round-trips through session storage ---

Given("a tool executes and returns a result", function () {
  // The messageAssemblerProcessor creates ToolResultMessage — tested via converter
});

When("the engine creates a ToolResultMessage via messageAssemblerProcessor", function () {
  // Simulate what messageAssemblerProcessor produces (line 372-379 in core)
  toolResultMsg = {
    id: "msg-roundtrip",
    role: "tool",
    subtype: "tool-result",
    toolCallId: "call-roundtrip-001",
    toolResult: {
      type: "tool-result",
      id: "call-roundtrip-001",
      name: "file_reader",
      output: {
        type: "text",
        value: '{"status":"ok","lines":42}',
      },
    },
    timestamp: Date.now(),
  };
});

Then("the message is stored in the session repository", function () {
  // Simulate serialization round-trip (JSON serialize/deserialize like SQLite would)
  const serialized = JSON.stringify(toolResultMsg);
  toolResultMsg = JSON.parse(serialized) as ToolResultMessage;
});

Then("when the driver loads history for the next LLM call", function () {
  // toVercelMessages handles the full array
  convertedResults = toVercelMessages([toolResultMsg]);
});

Then("toVercelMessages\\() converts each stored message", function () {
  assert.strictEqual(convertedResults.length, 1, "Expected 1 converted message");
});

Then("the ToolResultOutput arrives at the AI SDK intact", function () {
  const result = convertedResults[0] as any;
  assert.strictEqual(result.role, "tool");

  const part = result.content[0];
  assert.strictEqual(part.type, "tool-result");
  assert.strictEqual(part.toolCallId, "call-roundtrip-001");
  assert.strictEqual(part.toolName, "file_reader");
  assert.deepStrictEqual(part.output, {
    type: "text",
    value: '{"status":"ok","lines":42}',
  });
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve a dot/bracket path like "content[0].toolCallId" from an object
 */
function resolvePath(obj: any, path: string): any {
  // Handle paths like "message.toolCallId" or "content[0].toolCallId"
  // Strip the root reference (e.g., "message." prefix)
  const cleaned = path
    .replace(/^message\./, "")
    .replace(/^content/, "content");

  return resolveDotPath(obj, cleaned);
}

function resolveDotPath(obj: any, path: string): any {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}
