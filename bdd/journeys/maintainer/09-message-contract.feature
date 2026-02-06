@journey @maintainer
Feature: Message Format Contract
  As a maintainer, I enforce the message conversion contract between layers,
  so tool results and conversation history are never corrupted across boundaries.

  # ============================================================================
  # Core Principle: AgentX Message is the canonical format
  # ============================================================================
  #
  #  Core Layer (Message types)     Driver Layer (Converters)     AI SDK (ModelMessage)
  #  ┌─────────────────────┐       ┌──────────────────────┐      ┌─────────────────┐
  #  │ UserMessage          │       │                      │      │ role: "user"     │
  #  │ AssistantMessage     │──────→│  toVercelMessage()   │─────→│ role: "assistant"│
  #  │ ToolResultMessage    │       │  toVercelMessages()  │      │ role: "tool"     │
  #  │ ErrorMessage         │       │                      │      │                  │
  #  └─────────────────────┘       └──────────────────────┘      └─────────────────┘
  #
  #  Rule: Converters MUST use Core types directly, never use `as unknown as`.
  #        Field names and structures must match the Core type definitions.
  #

  Scenario: ToolResultMessage converts to Vercel ToolModelMessage
    Given the core defines ToolResultMessage as:
      | field       | type            | source                    |
      | toolCallId  | string          | ID matching the tool call |
      | toolResult  | ToolResultPart  | { id, name, output }      |
    And ToolResultPart.output is a ToolResultOutput union:
      | type             | value type | when                      |
      | text             | string     | Normal text result        |
      | json             | unknown    | Structured JSON result    |
      | error-text       | string     | Error as text             |
      | error-json       | unknown    | Error as JSON             |
      | execution-denied | reason?    | User denied execution     |
    When the driver converts it to Vercel AI SDK format
    Then the Vercel ToolModelMessage must have:
      | field                  | mapped from               |
      | content[0].toolCallId  | message.toolCallId        |
      | content[0].toolName    | message.toolResult.name   |
      | content[0].output      | message.toolResult.output |
    And the output must preserve the ToolResultOutput discriminated union
    # Never flatten, stringify, or unwrap the output — pass it through as-is

  Scenario: AssistantMessage with tool calls converts correctly
    Given the core defines AssistantMessage.content as array containing ToolCallPart:
      | field | type                   |
      | id    | string (tool call ID)  |
      | name  | string (tool name)     |
      | input | Record<string, unknown>|
    When the driver converts it to Vercel AI SDK format
    Then each ToolCallPart must map to:
      | vercel field  | mapped from       |
      | toolCallId    | part.id           |
      | toolName      | part.name         |
      | args          | part.input        |

  Scenario: Converters use Core types, not ad-hoc casts
    Given a converter function in the driver layer
    Then it must import and use Core message types directly:
      | do                                          | don't                                            |
      | message as ToolResultMessage                | message as unknown as { toolResult: { result } } |
      | msg.toolResult.output                       | msg.toolResult.result                            |
      | msg.toolResult.name                         | "unknown"                                        |
    And type-safe access prevents silent undefined bugs

  Scenario: Tool result round-trips through session storage
    Given a tool executes and returns a result
    When the engine creates a ToolResultMessage via messageAssemblerProcessor
    Then the message is stored in the session repository
    And when the driver loads history for the next LLM call
    Then toVercelMessages() converts each stored message
    And the ToolResultOutput arrives at the AI SDK intact
    # The full cycle: tool_result event → ToolResultMessage → storage → load → toVercelMessage → AI SDK
