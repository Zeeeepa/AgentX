@container
Feature: Container Create API
  As a developer using AgentX
  I want to create containers
  So that I can organize my agents

  Background:
    Given I create an AgentX client connected to the test server

  @create
  Scenario: Create a new container
    When I call createContainer with a unique id
    Then the response should succeed
    And response.containerId should be "${containerId}"

  @create
  Scenario: Create container is idempotent
    When I call createContainer with a unique id
    Then the response should succeed
    When I call createContainer with id "${containerId}"
    Then the response should succeed
    And response.containerId should be "${containerId}"

  @create
  Scenario: Create container with specific ID
    When I call createContainer with id "my-workspace"
    Then the response should succeed
    And response.containerId should be "my-workspace"
