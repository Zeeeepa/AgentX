@journey @contributor
Feature: Development Environment Setup
  As a contributor, I need an accurate CONTRIBUTING guide,
  so I can set up the dev environment and start contributing without guessing.

  # ============================================================================
  # Block 1: CONTRIBUTING.md is the source of truth for contributors
  # Verified by agentDocTester — does a new contributor understand everything?
  # ============================================================================

  @pending
  Scenario: New contributor can set up the project by reading CONTRIBUTING.md
    Given I am a new contributor who just cloned the repo
    When I read CONTRIBUTING.md
    Then I should understand:
      | section            | what it covers                                |
      | Prerequisites      | Bun, Node.js versions, Git                   |
      | Setup              | Clone, install, build commands                |
      | Daily Workflow     | dev, build, test commands                     |
      | BDD-First Workflow | Iron Law, 4-step process, where to put files  |
      | Environment Vars   | API keys needed for AI features               |
      | Project Structure  | packages/, apps/, bdd/ layout                 |
      | Commit & PR        | Conventional commits, changeset, PR process   |
    And I should not need to read any other file to get started

  # ============================================================================
  # Block 2: What CONTRIBUTING.md says is actually true
  # Verified by programmatic steps — does reality match documentation?
  # ============================================================================

  Scenario: CONTRIBUTING.md recommends the correct package manager
    Given the CONTRIBUTING.md file
    Then it should recommend "bun" as the package manager
    And it should not mention "pnpm" or "npm" or "yarn" as the package manager
    And the project should have a bun lock file

  Scenario: Setup commands in CONTRIBUTING.md actually exist
    Given the CONTRIBUTING.md file
    Then these scripts mentioned should exist in package.json:
      | script   |
      | build    |
      | dev      |
      | bdd      |
      | bdd:ui   |
      | bdd:docs |

  Scenario: Workspace layout in CONTRIBUTING.md matches reality
    Given the CONTRIBUTING.md file
    Then it should describe these directories that actually exist:
      | directory  | exists |
      | packages/  | yes    |
      | apps/      | yes    |
      | bdd/       | yes    |

  Scenario: Environment variables in CONTRIBUTING.md match what code reads
    Given the CONTRIBUTING.md file
    Then it should mention these environment variables:
      | variable             |
      | ANTHROPIC_API_KEY    |
      | DEEPRACTICE_API_KEY  |
      | DEEPRACTICE_BASE_URL |
      | DEEPRACTICE_MODEL    |

  Scenario: Prerequisites in CONTRIBUTING.md are accurate
    Given the CONTRIBUTING.md file
    Then it should state Bun minimum version as "1.3.0"
    And it should state Node.js minimum version as "22.0.0"
