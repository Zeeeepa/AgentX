/**
 * MockDriverFactory - Factory for creating MockDriver instances
 *
 * Usage:
 * ```typescript
 * const factory = createMockDriverFactory();
 *
 * // Use default fixture
 * const driver = factory.createDriver({ agentId: "agent-1" });
 *
 * // Use specific fixture
 * factory.setFixture("tool-call");
 * const driver2 = factory.createDriver({ agentId: "agent-2" });
 *
 * // Add custom fixture
 * factory.addFixture(myCustomFixture);
 * ```
 */

import type {
  Driver,
  DriverFactory,
  DriverConfig,
  CreateDriverOptions,
} from "@agentxjs/core/driver";
import type { Fixture, MockDriverOptions } from "../types";
import { MockDriver } from "./MockDriver";
import { BUILTIN_FIXTURES, listFixtures } from "../../fixtures";
import { createLogger } from "commonxjs/logger";

const logger = createLogger("devtools/MockDriverFactory");

/**
 * MockDriverFactory - Factory for MockDriver instances
 */
export class MockDriverFactory implements DriverFactory {
  readonly name = "MockDriverFactory";

  private currentFixture: string | Fixture = "simple-reply";
  private readonly fixtures: Map<string, Fixture>;
  private mockOptions: Partial<MockDriverOptions> = {};

  constructor() {
    // Initialize with built-in fixtures
    this.fixtures = new Map(BUILTIN_FIXTURES);
    logger.debug("MockDriverFactory created", {
      fixtures: listFixtures(),
    });
  }

  /**
   * Create a MockDriver instance
   */
  createDriver(options: CreateDriverOptions): Driver {
    return new MockDriver(options, {
      fixture: this.currentFixture,
      fixtures: this.fixtures,
      ...this.mockOptions,
    });
  }

  /**
   * Warmup (no-op for mock)
   */
  async warmup(_config: DriverConfig): Promise<void> {
    logger.debug("MockDriverFactory warmup (no-op)");
  }

  /**
   * Set the fixture to use for new drivers
   */
  setFixture(fixture: string | Fixture): void {
    this.currentFixture = fixture;
    logger.debug("Fixture set", {
      fixture: typeof fixture === "string" ? fixture : fixture.name,
    });
  }

  /**
   * Add a custom fixture
   */
  addFixture(fixture: Fixture): void {
    this.fixtures.set(fixture.name, fixture);
    logger.debug("Fixture added", { name: fixture.name });
  }

  /**
   * Set mock options for new drivers
   */
  setMockOptions(options: Partial<MockDriverOptions>): void {
    this.mockOptions = options;
  }

  /**
   * Get available fixture names
   */
  getFixtureNames(): string[] {
    return Array.from(this.fixtures.keys());
  }

  /**
   * Get a fixture by name
   */
  getFixture(name: string): Fixture | undefined {
    return this.fixtures.get(name);
  }
}

/**
 * Create a MockDriverFactory instance
 */
export function createMockDriverFactory(): MockDriverFactory {
  return new MockDriverFactory();
}
