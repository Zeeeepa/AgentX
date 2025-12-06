@request @agent
Feature: agentx.request() - Agent Commands
  Agent lifecycle and messaging through request/response pattern.

  Background:
    Given an AgentX instance
    And container "test-container" exists

  # ============================================================================
  # agent_run_request
  # ============================================================================

  @agent_run
  Scenario: request("agent_run_request", { containerId, config }) creates agent
    When I call agentx.request("agent_run_request", { containerId: "test-container", config: { name: "Assistant" } })
    Then I should receive a "agent_run_response" event
    And response.data.agentId should be defined
    And response.data.containerId should be "test-container"
    And response.data.error should be undefined

  @agent_run
  Scenario: request("agent_run_request") with systemPrompt
    When I call agentx.request("agent_run_request", { containerId: "test-container", config: { name: "Helper", systemPrompt: "You are helpful" } })
    Then I should receive a "agent_run_response" event
    And response.data.agentId should be defined

  @agent_run
  Scenario: request("agent_run_request") on non-existent container fails
    When I call agentx.request("agent_run_request", { containerId: "non-existent", config: { name: "Test" } })
    Then I should receive a "agent_run_response" event
    And response.data.error should be defined

  # ============================================================================
  # agent_get_request
  # ============================================================================

  @agent_get
  Scenario: request("agent_get_request", { agentId }) returns existing agent
    Given agent "my-agent" exists in container "test-container"
    When I call agentx.request("agent_get_request", { agentId: "my-agent" })
    Then I should receive a "agent_get_response" event
    And response.data.exists should be true
    And response.data.agentId should be "my-agent"

  @agent_get
  Scenario: request("agent_get_request", { agentId }) returns not found
    When I call agentx.request("agent_get_request", { agentId: "non-existent" })
    Then I should receive a "agent_get_response" event
    And response.data.exists should be false

  # ============================================================================
  # agent_list_request
  # ============================================================================

  @agent_list
  Scenario: request("agent_list_request", { containerId }) returns agents
    Given agent "agent-1" exists in container "test-container"
    And agent "agent-2" exists in container "test-container"
    When I call agentx.request("agent_list_request", { containerId: "test-container" })
    Then I should receive a "agent_list_response" event
    And response.data.agents should have length 2

  # ============================================================================
  # agent_receive_request
  # ============================================================================

  @agent_receive @integration
  Scenario: request("agent_receive_request", { agentId, content }) sends message
    Given agent "my-agent" exists in container "test-container"
    When I call agentx.request("agent_receive_request", { agentId: "my-agent", content: "Hello" })
    Then I should receive a "agent_receive_response" event
    And response.data.agentId should be "my-agent"
    And response.data.error should be undefined

  @agent_receive @integration
  Scenario: agent_receive_request triggers stream events
    Given agent "my-agent" exists in container "test-container"
    And I am subscribed to "text_delta" events
    When I call agentx.request("agent_receive_request", { agentId: "my-agent", content: "Say hello" })
    Then I should receive "text_delta" events
    And I should receive "assistant_message" event

  # ============================================================================
  # agent_interrupt_request
  # ============================================================================

  @agent_interrupt
  Scenario: request("agent_interrupt_request", { agentId }) interrupts agent
    Given agent "my-agent" exists in container "test-container"
    When I call agentx.request("agent_interrupt_request", { agentId: "my-agent" })
    Then I should receive a "agent_interrupt_response" event
    And response.data.agentId should be "my-agent"

  # ============================================================================
  # agent_destroy_request
  # ============================================================================

  @agent_destroy
  Scenario: request("agent_destroy_request", { agentId }) destroys agent
    Given agent "my-agent" exists in container "test-container"
    When I call agentx.request("agent_destroy_request", { agentId: "my-agent" })
    Then I should receive a "agent_destroy_response" event
    And response.data.success should be true

  @agent_destroy
  Scenario: request("agent_destroy_request") on non-existent agent
    When I call agentx.request("agent_destroy_request", { agentId: "non-existent" })
    Then I should receive a "agent_destroy_response" event
    And response.data.success should be false

  # ============================================================================
  # agent_destroy_all_request
  # ============================================================================

  @agent_destroy_all
  Scenario: request("agent_destroy_all_request", { containerId }) destroys all agents
    Given agent "agent-1" exists in container "test-container"
    And agent "agent-2" exists in container "test-container"
    When I call agentx.request("agent_destroy_all_request", { containerId: "test-container" })
    Then I should receive a "agent_destroy_all_response" event
    And container "test-container" should have 0 agents
