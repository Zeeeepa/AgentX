/**
 * Cucumber.js configuration
 *
 * Usage:
 *   bun test                              # All tests (excluding @integration, @pending)
 *   bun test --tags @container            # Only container tests
 *   bun test --tags @image                # Only image tests
 *   bun test --tags @agent                # Only agent tests
 *   bun test --tags @message              # Only message tests
 *   bun test --tags @event                # Only event tests
 *   bun test --tags @agentx               # Only agentx client tests
 *   bun test --tags @journey              # Only journey tests
 *   bun test --tags @developer            # Only developer journey tests
 *   bun test --tags @operator             # Only operator journey tests
 *   bun test features/container/          # Specific feature directory
 */

export default {
  format: ["progress-bar", "html:reports/cucumber-report.html"],
  formatOptions: { snippetInterface: "async-await" },
  import: ["support/**/*.ts", "steps/**/*.ts"],
  paths: ["features/**/*.feature", "journeys/**/*.feature"],
  tags: "not @integration and not @pending and not @skip",
  worldParameters: {
    defaultTimeout: 30000,
  },
};
