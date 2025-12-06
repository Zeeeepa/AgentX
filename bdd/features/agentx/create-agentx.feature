Feature: createAgentX
  As a developer
  I want to create AgentX instances via createAgentX
  So that I can use a unified API in Server or Browser environments

  # ============================================================================
  # Source Mode (Server)
  # ============================================================================

  Scenario: Create default Source mode instance
    Given ANTHROPIC_API_KEY environment variable is set
    When I call createAgentX()
    Then it should return an AgentX instance
    And the instance should be in Source mode

  Scenario: Create Source mode instance with config
    When I call createAgentX with apiKey and model
    Then it should return an AgentX instance
    And the instance should be in Source mode

  Scenario: Create Source mode instance with Persistence
    Given I have a Persistence instance
    When I call createAgentX with persistence
    Then it should return an AgentX instance
    And the instance should use the specified Persistence

  # ============================================================================
  # Mirror Mode (Browser)
  # ============================================================================

  Scenario: Create Mirror mode instance
    When I call createAgentX with serverUrl "ws://localhost:5200"
    Then it should return an AgentX instance
    And the instance should be in Mirror mode

  Scenario: Create Mirror mode instance with token
    When I call createAgentX with serverUrl and token
    Then it should return an AgentX instance
    And the instance should be in Mirror mode

  # ============================================================================
  # Type Guards
  # ============================================================================

  Scenario: isMirrorConfig type guard returns true for MirrorConfig
    Given config has serverUrl "ws://localhost:5200"
    When I call isMirrorConfig with the config
    Then it should return true

  Scenario: isSourceConfig type guard returns true for SourceConfig
    Given config has apiKey "sk-ant-xxx"
    When I call isSourceConfig with the config
    Then it should return true

  # ============================================================================
  # Dispose
  # ============================================================================

  Scenario: Dispose AgentX instance
    Given I have an AgentX instance
    When I call agentx.dispose()
    Then all resources should be cleaned up
