/**
 * Mock Driver Module
 *
 * Provides MockDriver for playback testing with fixtures.
 *
 * Usage:
 * ```typescript
 * import { createMockDriverFactory } from "@agentxjs/devtools/mock";
 *
 * const factory = createMockDriverFactory();
 * factory.setFixture("simple-reply");
 * const driver = factory.createDriver({ agentId: "agent-1" });
 * ```
 */

export { MockDriver } from "./MockDriver";
export { MockDriverFactory, createMockDriverFactory } from "./MockDriverFactory";
