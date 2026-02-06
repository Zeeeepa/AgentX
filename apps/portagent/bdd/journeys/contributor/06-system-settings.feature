@journey @contributor
Feature: System Settings
  As a contributor, I build a system settings page,
  so admins can configure LLM provider and agent behavior.

  # ============================================================================
  # Settings Structure
  # ============================================================================
  #
  #  /admin/settings
  #  ┌─────────────────────────────────────────────────────┐
  #  │  System Settings                                     │
  #  │                                                      │
  #  │  LLM Provider                                        │
  #  │  ┌──────────────────────────────────────────────┐   │
  #  │  │  Provider:  [Anthropic ▼]                     │   │
  #  │  │  API Key:   [••••••••••••]                    │   │
  #  │  │  Base URL:  [https://api.anthropic.com]       │   │
  #  │  │  Model:     [claude-sonnet-4-20250514]        │   │
  #  │  └──────────────────────────────────────────────┘   │
  #  │                                                      │
  #  │  Agent Behavior                                      │
  #  │  ┌──────────────────────────────────────────────┐   │
  #  │  │  System Prompt: [You are a helpful...]        │   │
  #  │  └──────────────────────────────────────────────┘   │
  #  │                                                      │
  #  │  MCP Servers                                         │
  #  │  ┌──────────────────────────────────────────────┐   │
  #  │  │  [+ Add MCP Server]                           │   │
  #  │  │                                               │   │
  #  │  │  ┌─ filesystem ──────────────────────────┐   │   │
  #  │  │  │  Type: stdio                           │   │   │
  #  │  │  │  Command: npx                          │   │   │
  #  │  │  │  Args: -y @anthropic/mcp-filesystem    │   │   │
  #  │  │  │                          [Delete]      │   │   │
  #  │  │  └───────────────────────────────────────┘   │   │
  #  │  └──────────────────────────────────────────────┘   │
  #  │                                                      │
  #  │                              [Save Settings]         │
  #  └─────────────────────────────────────────────────────┘
  #

  # ============================================================================
  # Access Control
  # ============================================================================

  @ui @pending
  Scenario: Only admins can access system settings
    Given I am logged in as user "user@example.com"
    When I visit "/admin/settings"
    Then I should be redirected to "/"

  @ui @pending
  Scenario: Admin navigates to settings from sidebar
    Given I am logged in as admin "admin@example.com"
    Then I should see "Settings" option
    When I click "Settings"
    Then I should be on "/admin/settings"
    And I should see "System Settings"

  # ============================================================================
  # LLM Provider Configuration
  # ============================================================================

  @ui @pending
  Scenario: Admin configures LLM provider
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    Then I should see "LLM Provider"
    And I should see "Provider"
    And I should see "API Key"
    And I should see "Base URL"
    And I should see "Model"

  @ui @pending
  Scenario: Admin saves LLM settings
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    And I fill in API key "sk-test-key"
    And I fill in model "claude-sonnet-4-20250514"
    And I click "Save Settings"
    Then I should see "Settings saved"

  # ============================================================================
  # Agent Behavior
  # ============================================================================

  @ui @pending
  Scenario: Admin configures system prompt
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    Then I should see "System Prompt"
    When I fill in system prompt "You are a helpful assistant"
    And I click "Save Settings"
    Then I should see "Settings saved"

  # ============================================================================
  # MCP Servers
  # ============================================================================

  @ui @pending
  Scenario: Admin adds MCP server
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    Then I should see "MCP Servers"
    When I click "Add MCP Server"
    And I fill in server name "filesystem"
    And I fill in command "npx"
    And I fill in args "-y @anthropic/mcp-filesystem"
    And I click "Save Settings"
    Then I should see "Settings saved"
    And I should see "filesystem"

  @ui @pending
  Scenario: Admin removes MCP server
    Given I am logged in as admin "admin@example.com"
    And the system has MCP server "filesystem"
    When I visit "/admin/settings"
    Then I should see "filesystem"
    When I click "Delete" on "filesystem"
    And I click "Save Settings"
    Then I should see "Settings saved"

  # ============================================================================
  # Persistence
  # ============================================================================

  @ui @pending
  Scenario: Settings persist after page reload
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    And I fill in model "claude-haiku-4-20250414"
    And I click "Save Settings"
    And I refresh the page
    Then I should see "claude-haiku-4-20250414"

  # ============================================================================
  # Storage
  # ============================================================================
  #
  # Settings stored in system_config table:
  #   key: "llm.provider", "llm.apiKey", "llm.baseUrl", "llm.model"
  #   key: "agent.systemPrompt"
  #   key: "mcp.servers" (JSON array of server configs)
  #
  # MCP Server config shape:
  #   { name: string, type: "stdio" | "http", command?: string,
  #     args?: string, url?: string, headers?: Record<string, string> }
  #
  # API endpoints:
  #   GET  /api/admin/settings  → get all settings
  #   PUT  /api/admin/settings  → update settings
  #
