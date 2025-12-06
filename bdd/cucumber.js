/**
 * Cucumber.js configuration
 *
 * Profiles:
 * - default: All tests (excluding @integration)
 * - integration: Tests that call real Claude API
 * - all: Everything including integration
 */

const common = {
  format: ["progress-bar", "html:reports/cucumber-report.html"],
  formatOptions: { snippetInterface: "async-await" },
  import: ["steps/**/*.ts"],
  worldParameters: {
    defaultTimeout: 10000,
  },
};

export default {
  ...common,
  tags: "not @integration and not @pending",
};

export const integration = {
  ...common,
  tags: "@integration and not @pending",
  worldParameters: {
    defaultTimeout: 60000, // 60s for Claude API calls
  },
};

export const all = {
  ...common,
  tags: "not @pending",
  worldParameters: {
    defaultTimeout: 60000,
  },
};

// Feature-specific profiles
export const agentx = {
  ...common,
  paths: ["features/agentx.feature"],
  tags: "not @integration and not @pending",
};

export const container = {
  ...common,
  paths: ["features/request/container.feature"],
  tags: "not @integration and not @pending",
};

export const agent = {
  ...common,
  paths: ["features/request/agent.feature"],
  tags: "not @integration and not @pending",
};

export const image = {
  ...common,
  paths: ["features/request/image.feature"],
  tags: "not @integration and not @pending",
};

export const events = {
  ...common,
  paths: ["features/subscribe/events.feature"],
  tags: "not @integration and not @pending",
};

export const server = {
  ...common,
  paths: ["features/server/listen.feature"],
  tags: "not @integration and not @pending",
};
