/**
 * Cucumber configuration for agentx SDK BDD tests
 */

import { createCucumberConfig } from "@agentxjs/devtools/bdd";

export default createCucumberConfig({
  paths: ["bdd/journeys/**/*.feature"],
  import: ["bdd/support/**/*.ts", "bdd/steps/**/*.ts"],
});
