Feature: defineAgent
  As a developer
  I want to define agents using defineAgent
  So that I can create reusable agent configurations

  Scenario: Define agent with name only
    When I call defineAgent with name "Assistant"
    Then it should return an AgentConfig
    And the config name should be "Assistant"

  Scenario: Define agent with name and systemPrompt
    When I call defineAgent with name "Assistant" and systemPrompt "You are helpful"
    Then it should return an AgentConfig
    And the config name should be "Assistant"
    And the config systemPrompt should be "You are helpful"

  Scenario: Define agent with all fields
    When I call defineAgent with:
      | name        | Assistant           |
      | systemPrompt| You are helpful     |
      | description | A helpful assistant |
    Then it should return an AgentConfig
    And the config should have all specified fields
