Feature: Runtime Events
  As a developer using the Runtime
  I want to subscribe to various runtime events
  So that I can react to system activities in real-time

  Background:
    Given a Runtime instance is created

  # ============================================================================
  # Event Subscription
  # ============================================================================

  Rule: Event Subscription Mechanism

    Scenario: Subscribe to all runtime events
      When I subscribe to runtime events
      And an event is emitted
      Then I should receive the event

    Scenario: Unsubscribe from events
      Given I am subscribed to runtime events
      When I unsubscribe from runtime events
      And an event is emitted
      Then I should not receive any events

    Scenario: Multiple subscribers receive the same event
      Given subscriber "A" is subscribed to runtime events
      And subscriber "B" is subscribed to runtime events
      When an event is emitted
      Then subscriber "A" should receive the event
      And subscriber "B" should receive the event

  # ============================================================================
  # Environment Events (External World)
  # ============================================================================

  Rule: Driveable Events from LLM

    Scenario: Receive message_start event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When the LLM starts a message for agent "agent-1"
      Then I should receive event with type "message_start"
      And the event should have source "environment"

    Scenario: Receive text_delta event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When the LLM streams text "Hello" for agent "agent-1"
      Then I should receive event with type "text_delta"
      And the event data should contain text "Hello"

    Scenario: Receive message_stop event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When the LLM completes a message for agent "agent-1"
      Then I should receive event with type "message_stop"

    Scenario: Receive tool_call event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When the LLM requests tool "read_file" for agent "agent-1"
      Then I should receive event with type "tool_call"
      And the event data should contain tool name "read_file"

    Scenario: Receive tool_result event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When the tool "read_file" returns result for agent "agent-1"
      Then I should receive event with type "tool_result"

    Scenario: Receive interrupted event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When agent "agent-1" is interrupted
      Then I should receive event with type "interrupted"

  Rule: Connection Events

    Scenario: Receive connected event
      Given I am subscribed to runtime events
      When the runtime connects to external service
      Then I should receive event with type "connected"

    Scenario: Receive disconnected event
      Given I am subscribed to runtime events
      When the runtime disconnects from external service
      Then I should receive event with type "disconnected"

    Scenario: Receive reconnecting event
      Given I am subscribed to runtime events
      When the runtime is reconnecting to external service
      Then I should receive event with type "reconnecting"

  # ============================================================================
  # Container Events
  # ============================================================================

  Rule: Container Lifecycle Events

    Scenario: Receive container_created event
      Given I am subscribed to runtime events
      When I create a container with id "container-1"
      Then I should receive event with type "container_created"
      And the event context should have containerId "container-1"

    Scenario: Receive container_destroyed event
      Given a container "container-1" exists
      And I am subscribed to runtime events
      When I dispose the container "container-1"
      Then I should receive event with type "container_destroyed"
      And the event context should have containerId "container-1"

    Scenario: Receive agent_registered event
      Given a container "container-1" exists
      And I am subscribed to runtime events
      When I run an agent in container "container-1"
      Then I should receive event with type "agent_registered"
      And the event context should have containerId "container-1"

    Scenario: Receive agent_unregistered event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When I destroy the agent "agent-1"
      Then I should receive event with type "agent_unregistered"
      And the event context should have agentId "agent-1"

  Rule: Sandbox Workdir Events

    Scenario: Receive file_read_request event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When agent "agent-1" requests to read file "/path/to/file"
      Then I should receive event with type "file_read_request"
      And the event should have source "sandbox"
      And the event should have category "workdir"

    Scenario: Receive file_read_result event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When file read completes for agent "agent-1"
      Then I should receive event with type "file_read_result"

    Scenario: Receive file_written event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When agent "agent-1" writes file "/path/to/file"
      Then I should receive event with type "file_written"

  Rule: Sandbox MCP Events

    Scenario: Receive tool_execute_request event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When agent "agent-1" requests to execute MCP tool "search"
      Then I should receive event with type "tool_execute_request"
      And the event should have source "sandbox"
      And the event should have category "mcp"

    Scenario: Receive tool_executed event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When MCP tool execution completes for agent "agent-1"
      Then I should receive event with type "tool_executed"

    Scenario: Receive mcp_server_connected event
      Given a container "container-1" exists
      And I am subscribed to runtime events
      When MCP server "filesystem" connects
      Then I should receive event with type "mcp_server_connected"

  # ============================================================================
  # Session Events
  # ============================================================================

  Rule: Session Lifecycle Events

    Scenario: Receive session_created event
      Given a container "container-1" exists
      And I am subscribed to runtime events
      When I run an agent in container "container-1"
      Then I should receive event with type "session_created"

    Scenario: Receive session_destroyed event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When I destroy the agent "agent-1"
      Then I should receive event with type "session_destroyed"

  Rule: Session Persist Events

    Scenario: Receive session_save_request event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When session save is requested for agent "agent-1"
      Then I should receive event with type "session_save_request"
      And the event should have intent "request"

    Scenario: Receive session_saved event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When session is saved for agent "agent-1"
      Then I should receive event with type "session_saved"
      And the event should have intent "result"

    Scenario: Receive message_persisted event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When a message is persisted for agent "agent-1"
      Then I should receive event with type "message_persisted"

  Rule: Session Action Events

    Scenario: Receive session_resumed event
      Given a container "container-1" exists
      And an agent "agent-1" is stopped in container "container-1"
      And I am subscribed to runtime events
      When I resume the agent "agent-1"
      Then I should receive event with type "session_resumed"

    Scenario: Receive session_forked event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When session is forked for agent "agent-1"
      Then I should receive event with type "session_forked"

    Scenario: Receive session_title_updated event
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When session title is updated to "New Title" for agent "agent-1"
      Then I should receive event with type "session_title_updated"

  # ============================================================================
  # Event Context
  # ============================================================================

  Rule: Events carry RuntimeContext

    Scenario: Events include containerId in context
      Given a container "container-1" exists
      And I am subscribed to runtime events
      When an event is emitted from container "container-1"
      Then the event context should have containerId "container-1"

    Scenario: Events include agentId in context
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When an event is emitted from agent "agent-1"
      Then the event context should have agentId "agent-1"
      And the event context should have containerId "container-1"

    Scenario: Events include sessionId in context
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When a session event is emitted for agent "agent-1"
      Then the event context should have sessionId

    Scenario: Request-response events share correlationId
      Given a container "container-1" exists
      And an agent "agent-1" is running in container "container-1"
      And I am subscribed to runtime events
      When a request event is emitted
      And the corresponding result event is emitted
      Then both events should have the same correlationId

  # ============================================================================
  # Event Classification
  # ============================================================================

  Rule: Events have proper classification

    Scenario: RuntimeEvent has source, category, and intent
      Given I am subscribed to runtime events
      When a runtime event is emitted
      Then the event should have property "source"
      And the event should have property "category"
      And the event should have property "intent"

    Scenario: Request events have intent "request"
      Given I am subscribed to runtime events
      When a session_save_request event is emitted
      Then the event should have intent "request"

    Scenario: Result events have intent "result"
      Given I am subscribed to runtime events
      When a session_saved event is emitted
      Then the event should have intent "result"

    Scenario: Notification events have intent "notification"
      Given I am subscribed to runtime events
      When a container_created event is emitted
      Then the event should have intent "notification"
