@request @container
Feature: agentx.request() - Container Commands
  Container lifecycle management through request/response pattern.

  Background:
    Given an AgentX instance

  # ============================================================================
  # container_create_request
  # ============================================================================

  @container_create
  Scenario: request("container_create_request", { containerId }) creates container
    When I call agentx.request("container_create_request", { containerId: "test-container" })
    Then I should receive a "container_create_response" event
    And response.data.containerId should be "test-container"
    And response.data.error should be undefined

  @container_create
  Scenario: Creating duplicate container returns same container
    Given container "my-container" exists
    When I call agentx.request("container_create_request", { containerId: "my-container" })
    Then I should receive a "container_create_response" event
    And response.data.containerId should be "my-container"

  # ============================================================================
  # container_get_request
  # ============================================================================

  @container_get
  Scenario: request("container_get_request", { containerId }) returns existing container
    Given container "my-container" exists
    When I call agentx.request("container_get_request", { containerId: "my-container" })
    Then I should receive a "container_get_response" event
    And response.data.exists should be true
    And response.data.containerId should be "my-container"

  @container_get
  Scenario: request("container_get_request", { containerId }) returns not found
    When I call agentx.request("container_get_request", { containerId: "non-existent" })
    Then I should receive a "container_get_response" event
    And response.data.exists should be false

  # ============================================================================
  # container_list_request
  # ============================================================================

  @container_list
  Scenario: request("container_list_request", {}) returns empty list
    When I call agentx.request("container_list_request", {})
    Then I should receive a "container_list_response" event
    And response.data.containerIds should be an empty array

  @container_list
  Scenario: request("container_list_request", {}) returns all containers
    Given container "container-1" exists
    And container "container-2" exists
    When I call agentx.request("container_list_request", {})
    Then I should receive a "container_list_response" event
    And response.data.containerIds should contain "container-1"
    And response.data.containerIds should contain "container-2"
