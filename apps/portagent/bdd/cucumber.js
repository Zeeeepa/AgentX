/**
 * Cucumber configuration for portagent BDD tests
 *
 * Profiles:
 * - default: excludes @ui tests
 * - ui: only @ui tests
 */

import { createCucumberConfig } from "@agentxjs/devtools/bdd";

const base = {
  paths: ["bdd/journeys/**/*.feature"],
  import: ["bdd/steps/**/*.ts"],
};

export default createCucumberConfig({
  ...base,
  tags: "not @pending and not @skip and not @ui",
});

export const ui = createCucumberConfig({
  ...base,
  tags: "@ui",
});
