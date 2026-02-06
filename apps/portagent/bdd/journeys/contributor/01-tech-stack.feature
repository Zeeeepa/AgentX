@journey @contributor
Feature: Tech Stack Setup
  As a contributor, I need the portagent built with Next.js + Hono,
  so I have a solid foundation for building the chat UI with auth.

  # ============================================================================
  # Next.js Framework
  # ============================================================================

  Scenario: Next.js app runs in development
    Given the portagent project
    When I start the dev server
    Then it should be running on port 3000
    And I should see the Next.js app in browser

  Scenario: App Router structure is correct
    Given the portagent project
    Then I should see "app/" directory
    And I should see "app/layout.tsx"
    And I should see "app/page.tsx"

  # ============================================================================
  # Hono API Routes
  # ============================================================================

  Scenario: Hono handles API routes
    Given the portagent dev server is running
    When I request "GET /api/health"
    Then I should receive JSON { "ok": true }

  Scenario: API routes are organized with Hono
    Given the portagent project
    Then I should see "app/api/[...route]/route.ts"
    And it should export GET and POST handlers

  # ============================================================================
  # UI Components
  # ============================================================================

  Scenario: Tailwind CSS is configured
    Given the portagent project
    When I check the styles
    Then Tailwind v4 should be working
    And utility classes should apply correctly

  Scenario: AI Elements components are available
    Given the portagent project
    When I import from "@ai-sdk/react"
    Then I should be able to use useChat hook

  # ============================================================================
  # AgentX Integration
  # ============================================================================

  Scenario: AgentX SDK is installed
    Given the portagent project
    When I import "agentxjs"
    Then I should be able to create an AgentX client
