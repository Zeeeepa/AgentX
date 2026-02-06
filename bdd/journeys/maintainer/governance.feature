@journey @internal @maintainer
Feature: BDD Journey Governance
  As a project maintainer, I need BDD journeys to follow consistent conventions,
  so that team collaboration remains efficient and aligned.

  # ============================================================================
  # Directory Structure
  # ============================================================================

  Scenario: Each project has its own BDD folder
    Given a project in the monorepo
    Then it should have its own "bdd/" folder
    And the folder should contain "cucumber.js", "journeys/", and "steps/"
    Examples:
      | project                    | bdd_path                      |
      | apps/portagent             | apps/portagent/bdd/           |
      | packages/agentx            | packages/agentx/bdd/          |

  Scenario: Journey files follow naming conventions
    Given a journey feature file
    Then the filename should be lowercase with hyphens
    And it should describe the user goal
    Examples:
      | good                        | bad                       |
      | first-conversation.feature  | FirstConversation.feature |
      | app-bootstrap.feature       | app_bootstrap.feature     |
      | session-resume.feature      | resume.feature            |

  # ============================================================================
  # Tagging Standards
  # ============================================================================

  Scenario: Journeys must have correct tags
    Given a journey feature file
    Then it must have "@journey" tag
    And it should have a role tag like "@developer", "@contributor", or "@user"
    And it may have "@pending" for unimplemented features
    And it may have "@wip" for work in progress

  # ============================================================================
  # VCR Recording Standards
  # ============================================================================

  Scenario: API calls must use VCR recording
    Given a journey that calls external APIs
    When implementing step definitions
    Then it must use "createVcrDriver" from devtools
    And VCR mode should be controlled by VCR_MODE environment variable
    And fixtures are stored in the project's "bdd/fixtures/recording/" folder

  Scenario: VCR fixture files follow naming conventions
    Given a scenario with title "Agent remembers conversation"
    When VCR records the API calls
    Then the fixture file should be "agent-remembers-conversation.json"
    And it should be in kebab-case derived from scenario title

  # ============================================================================
  # Shared BDD Utilities (devtools)
  # ============================================================================

  Scenario: Projects use shared BDD utilities from devtools
    Given a project needs BDD testing
    Then it should import utilities from "@agentxjs/devtools/bdd"
    And use "createCucumberConfig" for cucumber configuration
    And use "paths" for consistent path resolution
    And use "launchBrowser", "startDevServer" for UI testing

  Scenario: Running BDD tests uses the bdd CLI
    Given a project with BDD tests
    When I run tests
    Then I should use "bun run bdd" command
    And the bdd CLI automatically sets up NODE_OPTIONS for tsx

  # ============================================================================
  # Development Workflow
  # ============================================================================

  Scenario: Journey development follows discuss-first principle
    Given a new feature requirement
    When creating a journey
    Then first discuss the approach with the team
    And agree on the scenario structure
    And then write the feature file
    And then implement step definitions
    And finally record VCR fixtures

  Scenario: Work on one journey at a time
    Given multiple pending journeys
    When working on journeys
    Then focus on one journey at a time
    And complete it before starting the next
    And this ensures incremental verifiable progress

  # ============================================================================
  # Quality Standards
  # ============================================================================

  Scenario: Journeys describe user goals not implementation details
    Given a journey scenario
    Then it should describe "what" the user wants to achieve
    And not "how" it is technically implemented
    Examples:
      | good                                  | bad                                |
      | I should receive a non-empty reply    | The API should return 200 OK       |
      | The agent should remember my name     | SQLite should persist the session  |
      | I can resume the conversation         | WebSocket reconnects automatically |

  Scenario: Journeys are independently runnable
    Given any single journey feature file
    When I run it in isolation
    Then it should pass without depending on other journeys
    And it should set up its own prerequisites in Background
