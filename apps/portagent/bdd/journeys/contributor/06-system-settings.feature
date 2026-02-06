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

  @ui
  Scenario: Admin navigates to settings from sidebar
    Given I am logged in as admin "admin@example.com"
    Then I should see "Settings" option
    When I click "Settings"
    Then I should be on "/admin/settings"
    And I should see "System Settings"

  # ============================================================================
  # LLM Provider Configuration
  # ============================================================================

  @ui
  Scenario: Admin configures LLM provider
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    Then I should see "LLM Configuration"
    And I should see "Provider"
    And I should see "API Key"
    And I should see "Base URL"
    And I should see "Model"

  @ui
  Scenario: Admin saves LLM settings
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    And I fill in API key "sk-test-key"
    And I fill in model "claude-sonnet-4-20250514"
    And I click "Save Settings"
    Then I should see "Settings saved"

  @ui
  Scenario: Admin selects provider independently from base URL
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    Then I should see a provider selector with options "Anthropic" and "OpenAI Compatible"
    # Anthropic relay with custom base URL should keep "Anthropic" provider
    When I select provider "Anthropic"
    And I fill in base URL "https://relay.example.com/api"
    And I click "Save Settings"
    Then the driver should use the Anthropic protocol
    And the base URL should be "https://relay.example.com/api"

  # ============================================================================
  # Agent Behavior
  # ============================================================================

  @ui
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
  # Persistence & Priority
  # ============================================================================

  @ui
  Scenario: Settings persist after page reload
    Given I am logged in as admin "admin@example.com"
    When I visit "/admin/settings"
    And I fill in model "claude-haiku-4-20250414"
    And I click "Save Settings"
    And I refresh the page
    Then I should see "claude-haiku-4-20250414"

  Scenario: DB settings take priority over env vars
    Given the system_config table has "llm.model" = "claude-haiku-4-5-20251001"
    And DEEPRACTICE_MODEL env var is "claude-sonnet-4-20250514"
    When createDriver is called
    Then the driver should use model "claude-haiku-4-5-20251001"

  Scenario: Env vars are used as fallback when DB is empty
    Given the system_config table has no "llm.model"
    And DEEPRACTICE_MODEL env var is "claude-sonnet-4-20250514"
    When createDriver is called
    Then the driver should use model "claude-sonnet-4-20250514"

  @ui
  Scenario: API Key is masked in GET response
    Given the system_config table has "llm.apiKey" = "sk-ant-1234567890abcdef"
    When admin GETs "/api/admin/settings"
    Then the response llm.apiKey should be "sk-a****cdef"
    # Full key is only written via PUT, never exposed via GET

  Scenario: New conversations use latest DB config
    Given admin saves model "claude-haiku-4-5-20251001" in settings
    When a user starts a new conversation
    Then the agent driver should use model "claude-haiku-4-5-20251001"
    # createDriver reads DB on each call, no restart needed

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
  #   GET  /api/admin/settings  → get all settings (apiKey masked)
  #   PUT  /api/admin/settings  → update settings
  #
  # Config priority: DB value > env var > default
  #
