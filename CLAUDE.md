# CLAUDE.md

## The Iron Law: BDD First

**Before writing ANY code, read the BDD directory.**

```text
project/bdd/journeys/  ← Start here
```

Features are living documentation:

- **Scenario exists** → Implement according to it
- **No scenario** → Write the feature first, then code
- **Unsure if allowed** → Check if feature covers it

**Never allowed**: Skip BDD and write code directly.

---

## BDD Directory Structure

Each project has its own `bdd/` directory:

```text
apps/portagent/bdd/           # Web App
├── journeys/contributor/     # Building portagent
├── journeys/user/            # Using portagent
└── steps/

packages/agentx/bdd/          # SDK
├── journeys/developer/       # Using SDK
└── steps/

bdd/                          # Monorepo
├── journeys/maintainer/      # Release, CI, governance
└── fixtures/                 # Shared VCR recordings
```

**Only journeys matter.** No journey = not important.

---

## Development Workflow

### New Feature

```text
1. Write .feature file
2. Write .steps.ts
3. Run tests → fail
4. Implement code
5. Tests pass
6. Commit
```

### Bug Fix

```text
1. Write .feature to reproduce (@bug @wip)
2. Run → fail
3. Fix code
4. Tests pass
```

### Find Code

**Read the feature file.** Steps point to implementation.

---

## Running Tests

```bash
cd apps/portagent && bun run bdd
cd packages/agentx && bun run bdd

# Specific tags
bun run bdd --tags @developer
bun run bdd --tags @contributor
```

---

## Feature Format

```gherkin
@journey @developer
Feature: First Conversation
  A developer wants to create an agent and chat.

  Scenario: Create agent and chat locally
    Given a local AgentX environment with provider "anthropic"
    When I create a container "my-app"
    And I create an image "Assistant" in "my-app" with prompt "You are helpful"
    And I run the image as an agent
    When I send message "Hello"
    Then I should receive a non-empty reply
```

---

## Shared Tools

```typescript
import {
  createCucumberConfig,
  paths,
  launchBrowser,
  startDevServer,
} from "@agentxjs/devtools/bdd";
```

---

## Commands

```bash
bun install
bun build
bun dev
bun dev server
```

---

## Environment

```bash
ANTHROPIC_API_KEY
DEEPRACTICE_API_KEY
DEEPRACTICE_BASE_URL
DEEPRACTICE_MODEL
```

---

## Remember

> **Feature files are the documentation.**
> **Code is just implementation.**
> **No feature = no code.**
