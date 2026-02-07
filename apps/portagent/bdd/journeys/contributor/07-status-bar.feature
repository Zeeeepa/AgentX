@journey @contributor @ui
Feature: Chat Status Bar
  As a user, I can see a status bar above the prompt input that shows
  the agent's current state and real-time token usage, so I know
  what the agent is doing and how many tokens are being consumed.

  Background:
    Given the chat page is loaded
    And no session is active

  # ──────────────────────────────────────────────
  # Status indicator
  # ──────────────────────────────────────────────

  Scenario: Status bar is hidden when idle
    Then the status bar should not be visible

  Scenario: Status bar shows thinking state
    When the agent status becomes "thinking"
    Then the status bar should be visible
    And the status bar should show a pulsing indicator
    And the status bar should display "Thinking..."

  Scenario: Status bar shows responding state
    When the agent status becomes "responding"
    Then the status bar should be visible
    And the status bar should display "Responding..."

  Scenario: Status bar shows executing state
    When the agent status becomes "executing"
    Then the status bar should be visible
    And the status bar should display "Executing..."

  # ──────────────────────────────────────────────
  # Token usage
  # ──────────────────────────────────────────────

  Scenario: Status bar shows real-time token usage while streaming
    When the agent status becomes "responding"
    And the streaming conversation has usage with inputTokens 150 and outputTokens 30
    Then the status bar should display token usage
    And the token display should show input and output tokens

  Scenario: Status bar hides when agent returns to idle
    Given the agent status is "responding"
    When the agent status becomes "idle"
    Then the status bar should not be visible

  # ──────────────────────────────────────────────
  # Layout
  # ──────────────────────────────────────────────

  Scenario: Status bar is positioned above prompt input
    When the agent status becomes "thinking"
    Then the status bar should be between the message list and the prompt input
