@document @mono-driver
Feature: MonoDriver (Documentation)
  Validates code examples from the @agentxjs/mono-driver README.
  MonoDriver is the unified cross-platform LLM driver.

  Scenario: Create MonoDriver with Anthropic provider
    Given I create a MonoDriver with config:
      | apiKey   | test-key    |
      | provider | anthropic   |
      | model    | claude-haiku-4-5-20251001 |
    Then the driver should be created successfully
    And the driver should implement the Driver interface

  @vcr
  Scenario: Send message through MonoDriver
    Given I have a MonoDriver with provider "anthropic"
    When I send message "Say hi" to the driver
    Then I should receive a "message_start" driver event
    And I should receive "text_delta" driver events
    And I should receive a "message_stop" driver event with stopReason "end_turn"

  @vcr
  Scenario: MonoDriver streams text deltas
    Given I have a MonoDriver with provider "anthropic"
    When I send message "What is 2+2? Answer with just the number." to the driver
    Then the combined text delta should not be empty
