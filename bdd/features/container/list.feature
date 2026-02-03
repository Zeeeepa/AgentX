@container
Feature: Container List API
  As a developer using AgentX
  I want to list all containers
  So that I can see my available containers

  Background:
    Given I create an AgentX client connected to the test server

  @list
  Scenario: List containers returns array
    When I call listContainers
    Then the response should succeed
    And response.containerIds should be truthy

  @list
  Scenario: List containers includes created container
    When I call createContainer with a unique id
    And I call listContainers
    Then the response should succeed
    And response.containerIds should contain "${containerId}"
