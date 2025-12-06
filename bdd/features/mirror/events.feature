Feature: Mirror Events
  As a browser client using MirrorRuntime
  I want to receive events when interacting with the server
  So that I can track connection status and operation results

  Background:
    Given a MirrorRuntime instance is created with MockPeer

  # ============================================================================
  # Connection Events
  # ============================================================================

  Rule: Connection status events

    Scenario: Receive connected event when upstream connects
      Given I am subscribed to mirror events
      When the peer upstream state changes to "connected"
      Then I should receive event with type "connected"
      And the event should have source "environment"
      And the event should have category "connection"
      And the event should have intent "notification"

    Scenario: Receive disconnected event when upstream disconnects
      Given I am subscribed to mirror events
      And the peer is connected
      When the peer upstream state changes to "disconnected"
      Then I should receive event with type "disconnected"
      And the event should have source "environment"
      And the event should have category "connection"
      And the event should have intent "notification"

    Scenario: Receive reconnecting event when upstream reconnects
      Given I am subscribed to mirror events
      When the peer upstream state changes to "reconnecting"
      Then I should receive event with type "reconnecting"
      And the event should have source "environment"
      And the event should have category "connection"
      And the event should have intent "notification"

  # ============================================================================
  # Request Events (Mirror → Server)
  # ============================================================================

  Rule: Container request events

    Scenario: Emit create_container_request when creating container
      Given I am subscribed to mirror events
      And the peer is connected
      When I create a container with id "container-1" on mirror
      Then I should receive event with type "create_container_request"
      And the event should have source "container"
      And the event should have category "lifecycle"
      And the event should have intent "request"
      And the event context should have containerId "container-1"

  # ============================================================================
  # Forwarded Events (Server → Mirror)
  # ============================================================================

  Rule: Events forwarded from upstream

    Scenario: Receive text_delta event from upstream
      Given I am subscribed to mirror events
      And the peer is connected
      When the upstream sends a "text_delta" event with text "Hello"
      Then I should receive event with type "text_delta"
      And the event data should contain text "Hello"

    Scenario: Receive message_start event from upstream
      Given I am subscribed to mirror events
      And the peer is connected
      When the upstream sends a "message_start" event
      Then I should receive event with type "message_start"

    Scenario: Receive message_stop event from upstream
      Given I am subscribed to mirror events
      And the peer is connected
      When the upstream sends a "message_stop" event
      Then I should receive event with type "message_stop"

    Scenario: Receive container_created event from upstream
      Given I am subscribed to mirror events
      And the peer is connected
      When the upstream sends a "container_created" event for container "container-1"
      Then I should receive event with type "container_created"
      And the event context should have containerId "container-1"

  # ============================================================================
  # Event Classification
  # ============================================================================

  Rule: Events have proper classification

    Scenario: All mirror events have source, category, and intent
      Given I am subscribed to mirror events
      When the peer upstream state changes to "connected"
      Then the event should have property "source"
      And the event should have property "category"
      And the event should have property "intent"
      And the event should have property "timestamp"
