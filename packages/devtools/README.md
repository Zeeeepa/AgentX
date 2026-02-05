# @agentxjs/devtools

Development tools for AgentX -- VCR-style fixture recording, mock drivers, and replay infrastructure for deterministic testing of LLM-powered agents.

## Installation

```bash
bun add -d @agentxjs/devtools
```

For recording from a real LLM, you also need a driver implementation:

```bash
bun add -d @agentxjs/claude-driver
```

## The VCR Pattern

This package implements the VCR (Video Cassette Recorder) testing pattern for LLM interactions:

1. **First run** -- No fixture file exists. The real LLM API is called, and the full stream of events (message_start, text_delta, tool_use, message_stop, etc.) is recorded to a JSON fixture file.
2. **Subsequent runs** -- The fixture file exists. Events are replayed from the file with no API calls. Tests run instantly, deterministically, and without network access or API keys.

This approach gives you:

- **Deterministic tests** -- Same fixture produces the same events every time.
- **Fast execution** -- No network latency or API rate limits.
- **CI-friendly** -- Fixture files are committed to git; CI runs without API keys.
- **Easy re-recording** -- Delete a fixture file (or pass `forceRecord: true`) to capture fresh responses.

## Quick Start

The `Devtools` class provides the highest-level API. It automatically handles the VCR logic: load an existing fixture or record a new one.

```typescript
import { createDevtools } from "@agentxjs/devtools";

const devtools = createDevtools({
  fixturesDir: "./fixtures",
  apiKey: process.env.ANTHROPIC_API_KEY, // only needed for recording
  model: "claude-haiku-4-5-20251001",
  systemPrompt: "You are a helpful assistant.",
});

// Fixture exists   --> returns MockDriver (playback)
// Fixture missing  --> calls real API, records, saves, returns MockDriver
const driver = await devtools.driver("greeting-scenario", {
  message: "Hello!",
});

await driver.initialize();

for await (const event of driver.receive(userMessage)) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
}

await driver.dispose();
```

## API Reference

### createDevtools(config)

Creates a `Devtools` instance -- the recommended entry point.

```typescript
interface DevtoolsConfig {
  fixturesDir: string;       // Directory for fixture JSON files
  apiKey?: string;            // API key (required for recording)
  baseUrl?: string;           // API base URL
  model?: string;             // LLM model identifier
  systemPrompt?: string;      // Default system prompt
  cwd?: string;               // Working directory for tool execution
  createDriver?: CreateDriver; // Custom driver factory (defaults to @agentxjs/claude-driver)
}
```

#### devtools.driver(name, options)

Returns a `Driver` ready for use. If the fixture file `{fixturesDir}/{name}.json` exists, it returns a `MockDriver` for playback. Otherwise it records a real API call, saves the fixture, and returns a `MockDriver` loaded with the recording.

```typescript
interface DriverOptions {
  message: string;          // User message to send when recording
  systemPrompt?: string;    // Override system prompt
  cwd?: string;             // Override working directory
  forceRecord?: boolean;    // Re-record even if fixture exists
}
```

#### devtools.load(name)

Loads and returns a `Fixture` object by name.

#### devtools.exists(name)

Returns `true` if the fixture file exists on disk.

#### devtools.delete(name)

Deletes a fixture file.

#### devtools.createDriverForFixture(name)

Returns a `CreateDriver` factory function that always produces a `MockDriver` loaded with the named fixture. Useful when you need a `CreateDriver` compatible with server/provider setup. The fixture must exist (loaded synchronously).

```typescript
const createDriver = devtools.createDriverForFixture("my-scenario");

// Use with server or provider
const server = await createServer({
  provider,
  createDriver,
});
```

---

### createVcrCreateDriver(config)

Creates a `CreateDriver` function with built-in VCR logic. This is the preferred approach when integrating with `@agentxjs/server` or `@agentxjs/node-provider`, because the VCR behavior is transparently embedded in the driver factory itself.

```typescript
import { createVcrCreateDriver } from "@agentxjs/devtools";

let currentFixture: string | null = null;

const vcrCreateDriver = createVcrCreateDriver({
  fixturesDir: "./fixtures/recording",
  getFixtureName: () => currentFixture,
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-haiku-4-5-20251001",
  createRealDriver: createMonoDriver,  // or any CreateDriver
  onPlayback: (name) => console.log(`[VCR] Playback: ${name}`),
  onRecording: (name) => console.log(`[VCR] Recording: ${name}`),
  onSaved: (name, count) => console.log(`[VCR] Saved: ${name} (${count} events)`),
});

// Use with server
const server = await createServer({
  provider,
  createDriver: vcrCreateDriver,
});

// Before each test scenario, set the fixture name
currentFixture = "test-scenario-name";
```

**VCR decision logic (hardcoded):**

| Condition | Behavior |
|-----------|----------|
| `getFixtureName()` returns `null` | Uses the real driver directly (no VCR) |
| Fixture file exists | Returns `MockDriver` for playback |
| Fixture file missing + API key available | Returns `RecordingDriver`; auto-saves fixture on `dispose()` |
| Fixture file missing + no API key | Throws an error |

```typescript
interface VcrCreateDriverConfig {
  fixturesDir: string;
  getFixtureName: () => string | null;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  createRealDriver?: CreateDriver;
  onPlayback?: (fixtureName: string) => void;
  onRecording?: (fixtureName: string) => void;
  onSaved?: (fixtureName: string, eventCount: number) => void;
}
```

---

### MockDriver

A `Driver` implementation that replays events from a `Fixture` object. No network calls are made.

```typescript
import { MockDriver } from "@agentxjs/devtools/mock";

const driver = new MockDriver({
  fixture: myFixture,         // Fixture object or built-in name
  speedMultiplier: 0,         // 0 = instant, 1.0 = real-time delays
  defaultDelay: 10,           // Default delay between events (ms)
});

await driver.initialize();

for await (const event of driver.receive(userMessage)) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
}

await driver.dispose();
```

**Features:**

- Plays fixture events as an `AsyncIterable<DriverStreamEvent>`.
- Supports interrupt via `driver.interrupt()`.
- Tracks an event cursor for multi-turn fixtures (multiple message_start/message_stop pairs).
- Ships with built-in fixtures: `"simple-reply"`, `"long-reply"`, `"tool-call"`, `"error"`, `"empty"`.
- Custom fixtures can be added via `driver.addFixture(fixture)` or the `fixtures` option.

#### createMockDriver(options)

Factory function that returns a `CreateDriver`-compatible function. Every call to the returned function produces a new `MockDriver` with the given options.

```typescript
import { createMockDriver } from "@agentxjs/devtools/mock";

const createDriver = createMockDriver({ fixture: "simple-reply" });

// Compatible with server/provider APIs
const driver = createDriver({ apiKey: "test", agentId: "test-agent" });
```

---

### RecordingDriver

A `Driver` wrapper that transparently records all events emitted by a real driver. The recording can then be exported as a `Fixture` and saved to disk.

```typescript
import { createRecordingDriver } from "@agentxjs/devtools/recorder";
import { createClaudeDriver } from "@agentxjs/claude-driver";

// 1. Create a real driver
const realDriver = createClaudeDriver({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  agentId: "my-agent",
  model: "claude-haiku-4-5-20251001",
  systemPrompt: "You are a helpful assistant.",
});

// 2. Wrap with recorder
const recorder = createRecordingDriver({
  driver: realDriver,
  name: "my-scenario",
  description: "User asks a greeting question",
});

// 3. Use like a normal driver
await recorder.initialize();

for await (const event of recorder.receive(userMessage)) {
  if (event.type === "text_delta") {
    process.stdout.write(event.data.text);
  }
}

// 4. Save the recording
await recorder.saveFixture("./fixtures/my-scenario.json");

// 5. Cleanup
await recorder.dispose();
```

**API:**

| Method | Description |
|--------|-------------|
| `getFixture()` | Returns the recorded `Fixture` object |
| `saveFixture(filePath)` | Writes the fixture to a JSON file |
| `eventCount` | Number of events recorded so far |
| `clearRecording()` | Resets the recording buffer |
| `getRawEvents()` | Returns raw recorded events with timestamps |

---

### Fixtures

A fixture is a JSON file containing a sequence of `DriverStreamEvent`s with timing information.

#### Format

```typescript
interface Fixture {
  name: string;              // Fixture identifier
  description?: string;      // Human-readable description
  recordedAt?: number;       // Unix timestamp of recording
  trigger?: string;          // The user message that produced this recording
  events: FixtureEvent[];    // Ordered sequence of events
}

interface FixtureEvent {
  type: string;              // Event type ("message_start", "text_delta", etc.)
  delay: number;             // Milliseconds since previous event
  data: unknown;             // Event payload
  index?: number;            // Content block index (for tool calls)
  context?: unknown;         // Optional context metadata
}
```

#### Example fixture file

```json
{
  "name": "hello-test",
  "description": "Recording of: \"Hello, say hi briefly.\"",
  "recordedAt": 1770102020745,
  "events": [
    {
      "type": "message_start",
      "delay": 0,
      "data": { "message": { "id": "msg_001", "model": "claude-haiku-4-5-20251001" } }
    },
    {
      "type": "text_delta",
      "delay": 5,
      "data": { "text": "Hi there! " }
    },
    {
      "type": "text_delta",
      "delay": 10,
      "data": { "text": "How can I help?" }
    },
    {
      "type": "message_stop",
      "delay": 5,
      "data": { "stopReason": "end_turn" }
    }
  ]
}
```

#### Built-in fixtures

The package ships with built-in fixtures for common patterns:

| Name | Description |
|------|-------------|
| `simple-reply` | Single text response ("Hello! How can I help you today?") |
| `long-reply` | Multi-paragraph response with a numbered list |
| `tool-call` | Full tool_use flow (text + tool call + tool result + follow-up) |
| `error` | API error response (rate_limit_error) |
| `empty` | message_start + message_stop with no content |

```typescript
import { getFixture, listFixtures, SIMPLE_REPLY } from "@agentxjs/devtools/fixtures";

// List all built-in fixture names
console.log(listFixtures());
// ["simple-reply", "long-reply", "tool-call", "error", "empty"]

// Get a fixture by name
const fixture = getFixture("tool-call");

// Use the constant directly
const driver = new MockDriver({ fixture: SIMPLE_REPLY });
```

#### Recording fixtures with the CLI script

The package includes a recording script for ad-hoc fixture capture:

```bash
cd packages/devtools
bun run scripts/record-fixture.ts "Hello, how are you?" my-greeting
```

This creates `fixtures/my-greeting.json` with the full recorded event stream.

Required environment variables: `DEEPRACTICE_API_KEY` (and optionally `DEEPRACTICE_BASE_URL`, `DEEPRACTICE_MODEL`).

---

## Usage in BDD / Integration Tests

The primary use case for this package is BDD tests with Cucumber. The recommended pattern uses `createVcrCreateDriver` in the test world setup:

```typescript
// support/world.ts
import { createVcrCreateDriver } from "@agentxjs/devtools";

const FIXTURES_DIR = "fixtures/recording/agentx";
let currentFixtureName: string | null = null;

BeforeAll(async function () {
  const vcrCreateDriver = createVcrCreateDriver({
    fixturesDir: resolve(process.cwd(), FIXTURES_DIR),
    getFixtureName: () => currentFixtureName,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-haiku-4-5-20251001",
    createRealDriver: createMonoDriver,
    onPlayback: (name) => console.log(`[VCR] Playback: ${name}`),
    onRecording: (name) => console.log(`[VCR] Recording: ${name}`),
    onSaved: (name, count) => console.log(`[VCR] Saved: ${name} (${count} events)`),
  });

  const server = await createServer({
    provider,
    createDriver: vcrCreateDriver,
  });
  await server.listen();
});

Before(function (scenario) {
  // Derive fixture name from scenario name
  const name = scenario.pickle.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  currentFixtureName = name;
});

After(function () {
  currentFixtureName = null;
});
```

With this setup:

- The first time a scenario runs, it calls the real API and saves a fixture.
- Every subsequent run replays from the fixture -- no API key needed.
- Fixture files are committed to the repository so CI never hits the real API.
- To re-record a scenario, delete its fixture file and run the test again.

## Package Exports

The package provides four entry points:

| Import path | Contents |
|-------------|----------|
| `@agentxjs/devtools` | Full API: `Devtools`, `createDevtools`, `createVcrCreateDriver`, `MockDriver`, `RecordingDriver`, fixtures |
| `@agentxjs/devtools/mock` | `MockDriver`, `createMockDriver` |
| `@agentxjs/devtools/recorder` | `RecordingDriver`, `createRecordingDriver` |
| `@agentxjs/devtools/fixtures` | Built-in fixtures (`SIMPLE_REPLY`, `TOOL_CALL`, etc.), `getFixture`, `listFixtures` |

## License

See the repository root for license information.
