@agentx @container
Feature: Container API
  As a developer
  I want to manage containers via AgentX client
  So that I can organize my agents and images

  Background:
    Given I have an AgentX client connected to the test server

  Scenario: Create a new container
    When I create container "my-workspace"
    Then the response should be successful
    And the response containerId should be "my-workspace"

  Scenario: Get existing container
    Given I have created container "existing-container"
    When I get container "existing-container"
    Then the response should be successful
    And the container should exist

  Scenario: Get non-existing container
    When I get container "non-existing-container"
    Then the container should not exist

  Scenario: List containers
    Given I have created container "container-a"
    And I have created container "container-b"
    When I list containers
    Then the response should be successful
    And the container list should include "container-a"
    And the container list should include "container-b"

  Scenario: Create container is idempotent
    Given I have created container "idempotent-test"
    When I create container "idempotent-test"
    Then the response should be successful
    And the response containerId should be "idempotent-test"
