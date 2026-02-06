#!/usr/bin/env node
/**
 * BDD CLI wrapper for cucumber-js
 *
 * Usage:
 *   bdd                    # Run all tests
 *   bdd --tags @contributor # Run specific tags
 *   bdd --config path      # Custom config path (default: bdd/cucumber.js)
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);

// Find config file
let configPath = "bdd/cucumber.js";
const configIndex = args.indexOf("--config");
if (configIndex !== -1 && args[configIndex + 1]) {
  configPath = args[configIndex + 1];
  args.splice(configIndex, 2);
}

// Check if config exists
const fullConfigPath = resolve(process.cwd(), configPath);
if (!existsSync(fullConfigPath)) {
  console.error(`Config not found: ${fullConfigPath}`);
  console.error("Create bdd/cucumber.js or specify --config path");
  process.exit(1);
}

// Run cucumber-js with tsx loader
const cucumberArgs = ["--config", configPath, ...args];

const child = spawn("cucumber-js", cucumberArgs, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: "--import tsx",
  },
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
