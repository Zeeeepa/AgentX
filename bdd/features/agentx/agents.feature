Feature: AgentsAPI
  As a developer
  I want to manage agents via agentx.agents
  So that I can run and control AI agents

  Background:
    Given I have an AgentX instance
    And I have created a container

  # ============================================================================
  # Run
  # ============================================================================

  Scenario: Run an agent in a container
    Given I have an AgentConfig
    When I call agentx.agents.run with containerId and config
    Then it should return an Agent
    And the agent should be running

  Scenario: Run multiple agents in same container
    Given I have an AgentConfig
    When I run 2 agents in the same container
    Then I should have 2 agents in that container

  Scenario: Run agent in non-existent container
    When I call agentx.agents.run with "non-existent-id" and config
    Then it should throw an error

  # ============================================================================
  # Get
  # ============================================================================

  Scenario: Get agent by id
    Given I have a running agent
    When I call agentx.agents.get with the agent id
    Then it should return the agent

  Scenario: Get non-existent agent
    When I call agentx.agents.get with "non-existent-id"
    Then it should return undefined

  # ============================================================================
  # List
  # ============================================================================

  Scenario: List all agents
    Given I have 3 agents running in different containers
    When I call agentx.agents.list()
    Then it should return an array of 3 agents

  Scenario: List agents in specific container
    Given I have 2 agents in container A
    And I have 1 agent in container B
    When I call agentx.agents.list with container A id
    Then it should return an array of 2 agents

  # ============================================================================
  # Destroy
  # ============================================================================

  Scenario: Destroy an agent
    Given I have a running agent
    When I call agentx.agents.destroy with the agent id
    Then it should return true
    And the agent should be destroyed

  Scenario: Destroy non-existent agent
    When I call agentx.agents.destroy with "non-existent-id"
    Then it should return false
