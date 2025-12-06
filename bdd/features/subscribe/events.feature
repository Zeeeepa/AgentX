@subscribe @events
Feature: agentx.on() and agentx.onCommand() - Event Subscription
  Subscribe to system events and command events.

  Background:
    Given an AgentX instance

  # ============================================================================
  # on(type, handler): Unsubscribe
  # ============================================================================

  @on
  Scenario: on(type, handler) subscribes to events
    When I call agentx.on("text_delta", handler)
    Then I should receive an Unsubscribe function

  @on
  Scenario: on() handler receives events of specified type
    Given I am subscribed to "container_create_response" events
    When container "test" is created
    Then my handler should be called with "container_create_response" event
    And event.type should be "container_create_response"
    And event.data.containerId should be "test"

  @on
  Scenario: on() handler does not receive events of other types
    Given I am subscribed to "text_delta" events
    When container "test" is created
    Then my handler should not be called

  @on
  Scenario: Unsubscribe stops receiving events
    Given I am subscribed to "container_create_response" events
    When I call the unsubscribe function
    And container "test" is created
    Then my handler should not be called

  # ============================================================================
  # onCommand(type, handler): Unsubscribe
  # ============================================================================

  @onCommand
  Scenario: onCommand(type, handler) subscribes to command events
    When I call agentx.onCommand("container_create_response", handler)
    Then I should receive an Unsubscribe function

  @onCommand
  Scenario: onCommand() provides typed event data
    Given I am subscribed via onCommand to "container_create_response"
    When container "typed-test" is created
    Then my handler should be called
    And event should have typed data with containerId "typed-test"

  # ============================================================================
  # Stream Events (during agent_receive)
  # ============================================================================

  @stream @integration
  Scenario: Agent response triggers text_delta events
    Given container "test-container" exists
    And agent "my-agent" exists in container "test-container"
    And I am subscribed to "text_delta" events
    When agent "my-agent" receives message "Hello"
    Then I should receive multiple "text_delta" events
    And each event.data.text should be a string

  @stream @integration
  Scenario: Agent response triggers message_start and message_stop events
    Given container "test-container" exists
    And agent "my-agent" exists in container "test-container"
    And I am subscribed to "message_start" events
    And I am subscribed to "message_stop" events
    When agent "my-agent" receives message "Hello"
    Then I should receive "message_start" event
    And I should receive "message_stop" event

  @stream @integration
  Scenario: Agent response triggers assistant_message event
    Given container "test-container" exists
    And agent "my-agent" exists in container "test-container"
    And I am subscribed to "assistant_message" events
    When agent "my-agent" receives message "Hello"
    Then I should receive "assistant_message" event
    And event.data.content should be defined
