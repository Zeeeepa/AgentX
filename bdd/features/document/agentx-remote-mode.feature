@document @agentx @remote
Feature: AgentX Remote Mode (Documentation)
  Validates code examples from the agentxjs README.
  Remote mode connects to an AgentX server via WebSocket.

  Background:
    Given the test server is running

  Scenario: Connect to server and create resources
    Given I have a remote AgentX client connected to the test server
    When I create container "doc-remote" via remote client
    Then the container "doc-remote" should exist via remote client
    When I create an image in container "doc-remote" via remote with systemPrompt "You are helpful"
    Then the image should have been created with a valid imageId

  Scenario: Full conversation flow via remote
    Given I have a remote AgentX client connected to the test server
    And I have container "doc-flow" via remote client
    And I have an image in container "doc-flow" via remote with systemPrompt "Reply briefly."
    And I have an agent from the image via remote client
    When I send message "What is 1+1? Just the number." via remote client
    Then I should receive text_delta events via remote client
    And the combined text should not be empty
