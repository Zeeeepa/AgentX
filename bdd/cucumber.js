/**
 * Cucumber.js configuration
 *
 * Usage:
 *   bun run test                          # All tests
 *   bun run test:devtools                 # Only devtools tests
 */

import { resolve, dirname } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Load .env.local from monorepo root
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

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
