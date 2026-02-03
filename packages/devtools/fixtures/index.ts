/**
 * Built-in Fixtures for MockDriver
 *
 * These fixtures simulate common conversation patterns.
 * They can be used directly or as templates for custom fixtures.
 */

import type { Fixture } from "../src/types";

/**
 * Simple text reply - no tool calls
 *
 * Simulates: "Hello!" -> "Hello! How can I help you today?"
 */
export const SIMPLE_REPLY: Fixture = {
  name: "simple-reply",
  description: "Simple text response without tool calls",
  events: [
    {
      type: "message_start",
      delay: 0,
      data: {
        message: {
          id: "msg_mock_001",
          model: "claude-mock",
        },
      },
    },
    {
      type: "text_content_block_start",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "text_delta",
      delay: 5,
      data: { text: "Hello! " },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "How can I " },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "help you " },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "today?" },
    },
    {
      type: "text_content_block_stop",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "message_stop",
      delay: 5,
      data: {
        stopReason: "end_turn",
      },
    },
  ],
};

/**
 * Multi-paragraph response
 *
 * Simulates a longer response with multiple sentences
 */
export const LONG_REPLY: Fixture = {
  name: "long-reply",
  description: "Longer multi-sentence response",
  events: [
    {
      type: "message_start",
      delay: 0,
      data: {
        message: {
          id: "msg_mock_002",
          model: "claude-mock",
        },
      },
    },
    {
      type: "text_content_block_start",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "text_delta",
      delay: 5,
      data: { text: "I'd be happy to help you with that!\n\n" },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "Here's what I can do:\n" },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "1. Answer your questions\n" },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "2. Help with coding tasks\n" },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "3. Assist with writing\n\n" },
    },
    {
      type: "text_delta",
      delay: 10,
      data: { text: "What would you like to work on?" },
    },
    {
      type: "text_content_block_stop",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "message_stop",
      delay: 5,
      data: {
        stopReason: "end_turn",
      },
    },
  ],
};

/**
 * Tool call response - demonstrates tool_use flow
 *
 * Simulates: "What time is it?" -> tool_call(get_current_time) -> "It's 2:30 PM"
 */
export const TOOL_CALL: Fixture = {
  name: "tool-call",
  description: "Response that includes a tool call",
  events: [
    {
      type: "message_start",
      delay: 0,
      data: {
        message: {
          id: "msg_mock_003",
          model: "claude-mock",
        },
      },
    },
    {
      type: "text_content_block_start",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "text_delta",
      delay: 5,
      data: { text: "Let me check that for you." },
    },
    {
      type: "text_content_block_stop",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "tool_use_content_block_start",
      delay: 10,
      index: 1,
      data: {
        id: "tool_001",
        name: "get_current_time",
      },
    },
    {
      type: "input_json_delta",
      delay: 5,
      index: 1,
      data: { partialJson: "{" },
    },
    {
      type: "input_json_delta",
      delay: 5,
      index: 1,
      data: { partialJson: '"timezone":' },
    },
    {
      type: "input_json_delta",
      delay: 5,
      index: 1,
      data: { partialJson: '"UTC"' },
    },
    {
      type: "input_json_delta",
      delay: 5,
      index: 1,
      data: { partialJson: "}" },
    },
    {
      type: "tool_use_content_block_stop",
      delay: 5,
      index: 1,
      data: {},
    },
    {
      type: "message_stop",
      delay: 5,
      data: {
        stopReason: "tool_use",
      },
    },
    // After tool result, continue with text
    {
      type: "message_start",
      delay: 50,
      data: {
        message: {
          id: "msg_mock_003b",
          model: "claude-mock",
        },
      },
    },
    {
      type: "text_content_block_start",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "text_delta",
      delay: 5,
      data: { text: "The current time is 2:30 PM UTC." },
    },
    {
      type: "text_content_block_stop",
      delay: 5,
      index: 0,
      data: {},
    },
    {
      type: "message_stop",
      delay: 5,
      data: {
        stopReason: "end_turn",
      },
    },
  ],
};

/**
 * Error response
 */
export const ERROR_RESPONSE: Fixture = {
  name: "error",
  description: "Simulates an API error",
  events: [
    {
      type: "error_received",
      delay: 50,
      data: {
        message: "Rate limit exceeded. Please try again later.",
        errorCode: "rate_limit_error",
      },
    },
  ],
};

/**
 * Empty response (for edge case testing)
 */
export const EMPTY_RESPONSE: Fixture = {
  name: "empty",
  description: "Empty response with no content",
  events: [
    {
      type: "message_start",
      delay: 0,
      data: {
        message: {
          id: "msg_mock_empty",
          model: "claude-mock",
        },
      },
    },
    {
      type: "message_stop",
      delay: 5,
      data: {
        stopReason: "end_turn",
      },
    },
  ],
};

/**
 * All built-in fixtures
 */
export const BUILTIN_FIXTURES: Map<string, Fixture> = new Map([
  ["simple-reply", SIMPLE_REPLY],
  ["long-reply", LONG_REPLY],
  ["tool-call", TOOL_CALL],
  ["error", ERROR_RESPONSE],
  ["empty", EMPTY_RESPONSE],
]);

/**
 * Get a built-in fixture by name
 */
export function getFixture(name: string): Fixture | undefined {
  return BUILTIN_FIXTURES.get(name);
}

/**
 * List all built-in fixture names
 */
export function listFixtures(): string[] {
  return Array.from(BUILTIN_FIXTURES.keys());
}
