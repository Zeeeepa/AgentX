@journey @contributor @slow
Feature: Bootstrap Smoke Test
  As a contributor, I need the setup steps in CONTRIBUTING.md to actually work,
  so I don't waste time debugging a broken bootstrap process.

  # ============================================================================
  # End-to-end: clone → install → build → test in a fresh temp directory
  # Tagged @slow — only runs with: bun run bdd -- --tags "@slow"
  # ============================================================================

  Scenario: Fresh clone can install and build
    Given a fresh clone of the repository in a temp directory
    When I run "bun install" in the temp directory
    Then the command should succeed
    When I run "bun run build --force" in the temp directory
    Then the command should succeed
    And the temp directory is cleaned up
