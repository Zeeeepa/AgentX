@document @agentx @local
Feature: AgentX Local Mode (Documentation)
  Validates code examples from the agentxjs README.
  Local mode creates an embedded runtime without a WebSocket server.

  Background:
    Given I have a local AgentX client with provider "anthropic"

  Scenario: Create container and image locally
    When I create container "doc-test" via local client
    Then the container "doc-test" should exist via local client
    When I create an image in container "doc-test" with systemPrompt "You are helpful"
    Then the image should have been created successfully

  Scenario: Send message and receive streamed events locally
    Given I have container "doc-local" via local client
    And I have an image in container "doc-local" with systemPrompt "You are a helpful assistant. Reply briefly."
    And I have an agent from the image via local client
    When I send message "Say hello in one word" via local client
    Then I should receive text_delta events via local client
    And I should receive a message_stop event via local client

  Scenario: Event subscription works locally
    Given I have container "doc-events" via local client
    And I have an image in container "doc-events" with systemPrompt "Reply with just 'ok'"
    And I have an agent from the image via local client
    And I subscribe to "text_delta" events via local client
    When I send message "Hi" via local client
    Then the event handler should have been called
