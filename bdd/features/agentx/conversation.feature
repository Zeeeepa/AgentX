@agentx @conversation
Feature: Conversation API
  As a developer
  I want to send messages and receive events via AgentX client
  So that I can build interactive AI applications

  Background:
    Given I have an AgentX client connected to the test server
    And I have created container "conversation-container"
    And I have created an image in container "conversation-container" with:
      | systemPrompt | You are a helpful assistant. Keep responses brief. |
    And I save the imageId as "chatImage"
    And I have created an agent from image "{chatImage}"
    And I save the agentId as "chatAgent"
    And I subscribe to all events

  @vcr
  Scenario: Send text message and receive response
    When I send message "Hello!" to agent "{chatAgent}"
    Then the response should be successful
    And I should receive "message_start" event within 30 seconds
    And I should receive "text_delta" events
    And I should receive "message_stop" event within 30 seconds

  @vcr
  Scenario: Receive text content from assistant
    When I send message "Say hello" to agent "{chatAgent}"
    Then the response should be successful
    And I should receive "message_stop" event within 30 seconds
    And the combined text_delta content should not be empty

  @vcr
  Scenario: Event stream contains required fields
    When I send message "Hi there" to agent "{chatAgent}"
    And I should receive "message_start" event within 30 seconds
    Then the "message_start" event should have context.agentId
    And the "message_start" event should have context.sessionId

  @vcr
  Scenario: Subscribe to specific event type
    Given I subscribe to "text_delta" events
    When I send message "Test" to agent "{chatAgent}"
    And I should receive "message_stop" event within 30 seconds
    Then I should have collected "text_delta" events

  @skip
  Scenario: Interrupt agent during response
    When I send message "Count from 1 to 100 slowly" to agent "{chatAgent}"
    And I wait for 1 second
    And I interrupt agent "{chatAgent}"
    Then the response should be successful
