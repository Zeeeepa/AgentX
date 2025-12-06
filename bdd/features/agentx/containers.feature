Feature: ContainersAPI
  As a developer
  I want to manage containers via agentx.containers
  So that I can organize agents into isolated environments

  Background:
    Given I have an AgentX instance

  # ============================================================================
  # Create
  # ============================================================================

  Scenario: Create a container
    When I call agentx.containers.create()
    Then it should return a Container
    And the container should have an auto-generated id

  Scenario: Create multiple containers
    When I call agentx.containers.create() twice
    Then I should have 2 containers
    And each container should have a unique id

  # ============================================================================
  # Get
  # ============================================================================

  Scenario: Get container by id
    Given I have created a container
    When I call agentx.containers.get with the container id
    Then it should return the container

  Scenario: Get non-existent container
    When I call agentx.containers.get with "non-existent-id"
    Then it should return undefined

  # ============================================================================
  # List
  # ============================================================================

  Scenario: List all containers
    Given I have created 3 containers
    When I call agentx.containers.list()
    Then it should return an array of 3 containers
