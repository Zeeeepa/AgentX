@agentx @agent
Feature: Agent API
  As a developer
  I want to manage agent lifecycle via AgentX client
  So that I can create, run, and destroy AI agents

  Background:
    Given I have an AgentX client connected to the test server
    And I have created container "agent-test-container"
    And I have created an image in container "agent-test-container" with:
      | systemPrompt | You are a test assistant |
    And I save the imageId as "testImage"

  Scenario: Create agent from image
    When I create agent from image "{testImage}"
    Then the response should be successful
    And the agent response should have agentId
    And the agent response should have sessionId
    And I save the agentId as "createdAgent"

  Scenario: Create agent with custom ID
    When I create agent from image "{testImage}" with agentId "custom-agent-123"
    Then the response should be successful
    And the agent response agentId should be "custom-agent-123"

  Scenario: Get existing agent
    Given I have created an agent from image "{testImage}"
    And I save the agentId as "existingAgent"
    When I get agent "{existingAgent}"
    Then the response should be successful
    And the agent should exist

  Scenario: Get non-existing agent
    When I get agent "non-existing-agent-id"
    Then the agent should not exist

  Scenario: List agents
    Given I have created an agent from image "{testImage}"
    And I save the agentId as "listAgent1"
    And I have created an agent from image "{testImage}"
    And I save the agentId as "listAgent2"
    When I list agents
    Then the response should be successful
    And the agent list should include "{listAgent1}"
    And the agent list should include "{listAgent2}"

  Scenario: Destroy agent
    Given I have created an agent from image "{testImage}"
    And I save the agentId as "destroyAgent"
    When I destroy agent "{destroyAgent}"
    Then the response should be successful
    When I get agent "{destroyAgent}"
    Then the agent should not exist
