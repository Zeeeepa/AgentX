/**
 * Shared Cucumber configuration for BDD tests
 *
 * Usage in project's cucumber.js:
 *
 * ```js
 * import { createCucumberConfig } from "@agentxjs/devtools/bdd";
 *
 * export default createCucumberConfig({
 *   paths: ["bdd/journeys/** /*.feature"],
 *   import: ["bdd/steps/** /*.ts"],
 * });
 * ```
 */

export interface CucumberConfigOptions {
  /** Feature file paths */
  paths: string[];
  /** Step definition paths */
  import: string[];
  /** Tags to filter (default: exclude @pending and @skip) */
  tags?: string;
  /** Default timeout in ms (default: 30000) */
  timeout?: number;
  /** Format output (default: progress) */
  format?: string[];
}

export function createCucumberConfig(options: CucumberConfigOptions) {
  return {
    format: options.format ?? ["progress"],
    formatOptions: { snippetInterface: "async-await" },
    import: options.import,
    paths: options.paths,
    tags: options.tags ?? "not @pending and not @skip",
    worldParameters: {
      defaultTimeout: options.timeout ?? 30000,
    },
  };
}
