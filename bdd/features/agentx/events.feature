Feature: AgentX Events
  As a developer
  I want to subscribe to AgentX events
  So that I can react to agent activities

  Background:
    Given I have an AgentX instance

  # ============================================================================
  # Subscribe to specific event
  # ============================================================================

  Scenario: Subscribe to text_delta events
    Given I have subscribed to "text_delta" events
    And I have a running agent
    When the agent receives a message
    Then I should receive text_delta events

  Scenario: Subscribe to message_start events
    Given I have subscribed to "message_start" events
    And I have a running agent
    When the agent receives a message
    Then I should receive a message_start event

  Scenario: Subscribe to message_stop events
    Given I have subscribed to "message_stop" events
    And I have a running agent
    When the agent receives a message and completes response
    Then I should receive a message_stop event

  # ============================================================================
  # Subscribe to all events
  # ============================================================================

  Scenario: Subscribe to all events
    Given I have subscribed to all events using onAll
    And I have a running agent
    When the agent receives a message
    Then I should receive all event types

  # ============================================================================
  # Unsubscribe
  # ============================================================================

  Scenario: Unsubscribe from events
    Given I have subscribed to "text_delta" events
    When I call the unsubscribe function
    And a text_delta event occurs
    Then I should not receive the event

  # ============================================================================
  # Multiple subscribers
  # ============================================================================

  Scenario: Multiple subscribers receive same event
    Given subscriber A is subscribed to "text_delta" events
    And subscriber B is subscribed to "text_delta" events
    When a text_delta event occurs
    Then both subscribers should receive the event
