/**
 * Cucumber configuration for portagent BDD tests
 */

import { createCucumberConfig } from "@agentxjs/devtools/bdd";

export default createCucumberConfig({
  paths: ["bdd/journeys/**/*.feature"],
  import: ["bdd/steps/**/*.ts"],
});
