@document @node-provider
Feature: NodeProvider (Documentation)
  Validates code examples from the @agentxjs/node-provider README.
  NodeProvider handles persistence, workspace, and event bus.

  Scenario: Create provider with default options
    When I create a NodeProvider with default options
    Then the provider should have a containerRepository
    And the provider should have an imageRepository
    And the provider should have a sessionRepository
    And the provider should have a workspaceProvider
    And the provider should have an eventBus

  Scenario: Create provider with custom data path
    Given a temporary directory for data
    When I create a NodeProvider with dataPath set to the temp directory
    Then the provider should be created successfully
    And the SQLite database should exist in the data directory

  Scenario: Provider does not contain createDriver
    When I create a NodeProvider with default options
    Then the provider should NOT have a createDriver property
