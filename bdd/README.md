# Monorepo BDD

Maintainer-level journeys and shared resources.

## Structure

```text
bdd/
├── journeys/
│   └── maintainer/           # Monorepo governance
│       └── governance.feature
└── fixtures/                 # Shared VCR recordings
    └── recording/
```

## Product Journeys

Each project has its own journeys:

| Project    | Path                   | Personas          |
| ---------- | ---------------------- | ----------------- |
| portagent  | `apps/portagent/bdd/`  | contributor, user |
| agentx SDK | `packages/agentx/bdd/` | developer         |

## Running Tests

```bash
# Portagent
cd apps/portagent && bun run bdd

# SDK
cd packages/agentx && bun run bdd

# Specific tags
bun run bdd --tags @contributor
bun run bdd --tags @developer
```

## VCR Fixtures

Fixtures are stored in `bdd/fixtures/recording/` and shared across projects.

To re-record a scenario, delete its fixture file and run the test with API keys configured.
