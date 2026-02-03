@container
Feature: Container Get API
  As a developer using AgentX
  I want to get container information
  So that I can check if containers exist

  Background:
    Given I create an AgentX client connected to the test server

  @get
  Scenario: Get existing container
    When I call createContainer with a unique id
    And I call getContainer with id "${containerId}"
    Then the response should succeed
    And response.exists should be truthy
    And response.containerId should be "${containerId}"

  @get
  Scenario: Get non-existent container
    When I call getContainer with id "non-existent-container"
    Then the response should succeed
    And response.exists should be falsy
