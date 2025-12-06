@agentx
Feature: createAgentX(config?: AgentXConfig): Promise<AgentX>
  Factory function to create AgentX instance.
  Supports LocalConfig (default) and RemoteConfig (with server URL).

  # ============================================================================
  # createAgentX() - Default (Local Mode)
  # ============================================================================

  @local
  Scenario: createAgentX() returns AgentX instance with defaults
    When I call createAgentX()
    Then I should receive an AgentX instance
    And AgentX should have method "request"
    And AgentX should have method "on"
    And AgentX should have method "onCommand"
    And AgentX should have method "emitCommand"
    And AgentX should have method "listen"
    And AgentX should have method "close"
    And AgentX should have method "dispose"

  # ============================================================================
  # createAgentX(LocalConfig) - LLM Configuration
  # ============================================================================

  @local @llm
  Scenario: createAgentX({ llm: { apiKey } }) uses custom API key
    When I call createAgentX with llm.apiKey "sk-test-key"
    Then I should receive an AgentX instance

  @local @llm
  Scenario: createAgentX({ llm: { baseUrl } }) uses custom base URL
    When I call createAgentX with llm.baseUrl "https://my-proxy.com"
    Then I should receive an AgentX instance

  @local @llm
  Scenario: createAgentX({ llm: { model } }) uses custom model
    When I call createAgentX with llm.model "claude-opus-4-20250514"
    Then I should receive an AgentX instance

  # ============================================================================
  # createAgentX(LocalConfig) - Storage Configuration
  # ============================================================================

  @local @storage
  Scenario: createAgentX({ storage: { driver: "memory" } }) uses memory storage
    When I call createAgentX with storage.driver "memory"
    Then I should receive an AgentX instance

  @local @storage
  Scenario: createAgentX({ storage: { driver: "sqlite", path } }) uses SQLite storage
    When I call createAgentX with storage.driver "sqlite" and storage.path "./test.db"
    Then I should receive an AgentX instance

  @local @storage @pending
  Scenario: createAgentX({ storage: { driver: "postgresql", url } }) uses PostgreSQL
    When I call createAgentX with storage.driver "postgresql" and storage.url "postgres://localhost:5432/test"
    Then I should receive an AgentX instance

  # ============================================================================
  # createAgentX(RemoteConfig) - Remote Mode
  # ============================================================================

  @remote @pending
  Scenario: createAgentX({ server }) connects to remote server
    Given an AgentX server is running on port 5200
    When I call createAgentX with server "ws://localhost:5200"
    Then I should receive an AgentX instance

  # ============================================================================
  # dispose(): Promise<void>
  # ============================================================================

  @local
  Scenario: dispose() releases all resources
    Given an AgentX instance
    When I call agentx.dispose()
    Then the promise should resolve
    And all resources should be released
