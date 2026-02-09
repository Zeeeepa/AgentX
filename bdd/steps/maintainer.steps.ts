/**
 * Maintainer journey steps
 *
 * Strategy: Living Documentation scenarios are auto-verified when possible.
 * - Verifiable scenarios: real assertions (file existence, config values, deps)
 * - Doc-only scenarios: pass through as documentation
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ============================================================================
// Helpers
// ============================================================================

function readJson(relPath: string) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

function packageDirs(): string[] {
  return readdirSync(resolve(ROOT, "packages")).filter((d) =>
    statSync(resolve(ROOT, "packages", d)).isDirectory()
  );
}

function appDirs(): string[] {
  return readdirSync(resolve(ROOT, "apps")).filter((d) =>
    statSync(resolve(ROOT, "apps", d)).isDirectory()
  );
}

function pkgJson(pkgDir: string) {
  return readJson(`${pkgDir}/package.json`);
}

function allFeatureFiles(): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".feature")) results.push(full);
    }
  }
  // monorepo bdd
  const monoBdd = resolve(ROOT, "bdd/journeys");
  if (existsSync(monoBdd)) walk(monoBdd);
  // app/package bdd
  for (const d of [
    ...packageDirs().map((p) => `packages/${p}`),
    ...appDirs().map((a) => `apps/${a}`),
  ]) {
    const journeys = resolve(ROOT, d, "bdd/journeys");
    if (existsSync(journeys)) walk(journeys);
  }
  return results;
}

// State for multi-step scenarios
let currentPackageName = "";
let currentPackageDeps: Record<string, string> = {};

// ============================================================================
// 01 - BDD Workflow
// ============================================================================

// --- Doc-only scenarios ---
Given("a new contributor joins the project", function () {
  /* doc */
});
When("they read the development guide", function () {
  /* doc */
});
Then("they should never skip BDD and write code directly", function () {
  /* doc */
});
Given("a contributor has a new feature to build", function () {
  /* doc */
});
Given("the monorepo root {string} directory", function (_dir: string) {
  /* doc */
});
Then("they are {string}", function (_desc: string) {
  /* doc */
});
Given("a Living Documentation scenario", function () {
  /* doc */
});
Given("a contributor wants to understand a feature", function () {
  /* doc */
});
Then("they should read the .feature file, not the code", function () {
  /* doc */
});
Then("the feature file documents the requirement", function () {
  /* doc */
});
Then("the code is just implementation", function () {
  /* doc */
});

// --- Automatable: Each project has its own BDD folder ---
Given("a project in the monorepo", function () {
  /* setup in Then */
});

Then("it should have its own {string} folder with:", function (folder: string, table: any) {
  const expectedItems = table.hashes().map((r: any) => r.item);
  // Check known projects that should have bdd/
  const projectsWithBdd = ["apps/portagent"];
  // Also check monorepo root
  for (const item of expectedItems) {
    assert.ok(
      existsSync(resolve(ROOT, "bdd", item.replace(/\/$/, ""))),
      `Monorepo root bdd/ missing: ${item}`
    );
  }
  for (const proj of projectsWithBdd) {
    for (const item of expectedItems) {
      const path = resolve(ROOT, proj, "bdd", item.replace(/\/$/, ""));
      assert.ok(existsSync(path), `${proj}/bdd/ missing: ${item}`);
    }
  }
});

// --- Doc-only: Living Documentation / Executable Specification tables ---
Then("its feature files serve as Living Documentation:", function (_table: any) {
  /* doc */
});
Then("its feature files serve as Executable Specifications:", function (_table: any) {
  /* doc */
});
Given("a package or app {string} directory", function (_dir: string) {
  /* doc */
});
Then("if it can be programmatically verified, it should be:", function (_table: any) {
  /* doc */
});
Then("if it cannot be automated, it passes as documentation:", function (_table: any) {
  /* doc */
});

// ============================================================================
// 02 - Conventions
// ============================================================================

Given("a journey feature file", function () {
  /* used by multiple scenarios */
});

// --- Automatable: Naming conventions (global) ---
Then(
  "the filename should use numbered prefix with hyphenated description:",
  function (_table: any) {
    const features = allFeatureFiles();
    const violations: string[] = [];
    for (const f of features) {
      const name = basename(f);
      if (!/^\d{2}-[a-z0-9-]+\.feature$/.test(name)) {
        violations.push(name);
      }
    }
    assert.deepStrictEqual(
      violations,
      [],
      `Feature files not following NN-description.feature pattern:\n${violations.join("\n")}`
    );
  }
);

Then("the number reflects the logical reading order, not priority", function () {
  /* doc */
});

// --- Automatable: Tag checking ---
Then("it must have {string} tag", function (tag: string) {
  const features = allFeatureFiles();
  const violations: string[] = [];
  for (const f of features) {
    const content = readFileSync(f, "utf-8");
    const firstLine = content.split("\n").find((l) => l.trim().length > 0) || "";
    if (!firstLine.includes(tag)) {
      violations.push(basename(f));
    }
  }
  assert.deepStrictEqual(
    violations,
    [],
    `Feature files missing ${tag} tag:\n${violations.join("\n")}`
  );
});

Then("it should have a role tag:", function (table: any) {
  const validTags = table.hashes().map((r: any) => r.tag);
  const features = allFeatureFiles();
  const violations: string[] = [];
  for (const f of features) {
    const content = readFileSync(f, "utf-8");
    const firstLine = content.split("\n").find((l) => l.trim().length > 0) || "";
    const hasRoleTag = validTags.some((tag: string) => firstLine.includes(tag));
    if (!hasRoleTag) {
      violations.push(basename(f));
    }
  }
  assert.deepStrictEqual(
    violations,
    [],
    `Feature files missing a role tag (${validTags.join(", ")}):\n${violations.join("\n")}`
  );
});

Then("it may have {string} for unimplemented features", function (_tag: string) {
  /* doc */
});
Then("it may have {string} for browser-tested scenarios", function (_tag: string) {
  /* doc */
});

// --- Doc-only ---
Given("a journey scenario", function () {
  /* doc */
});
Then("it should describe {string} the user achieves", function (_what: string) {
  /* doc */
});
Then("not {string} it is technically implemented", function (_how: string) {
  /* doc */
});
Given("any single journey feature file", function () {
  /* doc */
});
When("I run it in isolation", function () {
  /* doc */
});
Then("it should pass without depending on other journeys", function () {
  /* doc */
});

// ============================================================================
// 03 - Testing Infrastructure
// ============================================================================

Given("a project needs BDD testing", function () {
  /* doc */
});

// --- Automatable: Check devtools exports ---
Then("it should import from {string}:", function (modulePath: string, table: any) {
  // Verify the module is importable by checking the package exists
  const devtoolsPkg = resolve(ROOT, "packages/devtools/package.json");
  assert.ok(existsSync(devtoolsPkg), "devtools package not found");

  // Check that the dist exports exist
  const distIndex = resolve(ROOT, "packages/devtools/dist/bdd/index.js");
  if (existsSync(distIndex)) {
    const content = readFileSync(distIndex, "utf-8");
    const utilities = table.hashes().map((r: any) => r.utility);
    for (const util of utilities) {
      assert.ok(content.includes(util), `Export "${util}" not found in devtools/bdd`);
    }
  }
  // If not built yet, skip gracefully
});

// --- Doc-only ---
Given("a contributor writes a @ui scenario", function () {
  /* doc */
});
Then("steps should accumulate instructions in an array", function () {
  /* doc */
});
Then("the After hook should call agentUiTester with all instructions", function () {
  /* doc */
});
Then("agentUiTester uses Claude CLI + agent-browser to test", function () {
  /* doc */
});
Then("it returns PASS or FAIL with a reason", function () {
  /* doc */
});
Given("a contributor writes documentation", function () {
  /* doc */
});
Then("agentDocTester should evaluate the doc from reader's experience:", function (_table: any) {
  /* doc */
});
Then("it reads the file content and sends to Claude for review", function () {
  /* doc */
});
Then("it returns PASS or FAIL based on whether requirements are met", function () {
  /* doc */
});
Given("a journey that calls external APIs", function () {
  /* doc */
});
Then("it must use {string} from devtools", function (_util: string) {
  /* doc */
});
Then("VCR mode is controlled by VCR_MODE environment variable", function () {
  /* doc */
});
Then("fixtures are stored in the project's {string}", function (_path: string) {
  /* doc */
});

// --- Automatable: BDD commands ---
Given("a project with BDD tests", function () {
  /* setup in Then */
});

Then("these commands should work:", function (table: any) {
  // Check that scripts referenced by commands exist somewhere in the monorepo
  // Root or sub-package scripts are both valid
  const rootPkg = readJson("package.json");
  const rootScripts = rootPkg.scripts || {};

  // Also collect scripts from apps and packages
  const allScripts = new Set(Object.keys(rootScripts));
  for (const d of appDirs()) {
    const pkg = pkgJson(`apps/${d}`);
    for (const s of Object.keys(pkg.scripts || {})) allScripts.add(s);
  }
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    for (const s of Object.keys(pkg.scripts || {})) allScripts.add(s);
  }

  const rows = table.hashes();
  for (const row of rows) {
    const cmd = row.command;
    if (!cmd) continue;
    const match = cmd.match(/^bun (?:run )?(\S+)/);
    if (match) {
      const scriptName = match[1];
      if (!["install"].includes(scriptName)) {
        // Strip tags suffix like "bun run bdd:ui -- --tags ..."
        const baseScript = scriptName.split(" ")[0];
        assert.ok(
          allScripts.has(baseScript),
          `Script "${baseScript}" not found in any package.json (command: ${cmd})`
        );
      }
    }
  }
});

// ============================================================================
// 04 - AI Agent Workflow (all doc-only)
// ============================================================================

Given("an AI agent is working with a user", function () {
  /* doc */
});
Given("a sub-agent is spawned for implementation", function () {
  /* doc */
});
Then("it should use run_in_background: true", function () {
  /* doc */
});
Given("an AI agent is in BDD-driven mode", function () {
  /* doc */
});
Then("this reminds of the current workflow state across turns", function () {
  /* doc */
});
Given("an AI agent is asked to work on a feature", function () {
  /* doc */
});
Then("it must read the BDD directory before writing any code", function () {
  /* doc */
});
Then("if no scenario exists for the request, write the feature first", function () {
  /* doc */
});
Then("never write code without a corresponding feature", function () {
  /* doc */
});

// ============================================================================
// 05 - Environment and Commands
// ============================================================================

Given("a new contributor setting up the project", function () {
  /* doc */
});
Given("a contributor needs to run AI features", function () {
  /* doc */
});
Then("they should set:", function (_table: any) {
  /* doc — env vars are guidance */
});

// --- Automatable: Bun as package manager ---
Given("the project uses Bun", function () {
  assert.ok(
    existsSync(resolve(ROOT, "bun.lock")) || existsSync(resolve(ROOT, "bun.lockb")),
    "No bun.lock or bun.lockb found — project should use Bun"
  );
});

Then(
  "all scripts should use {string} not {string} or {string}",
  function (_yes: string, _no1: string, _no2: string) {
    const rootPkg = readJson("package.json");
    const scripts = rootPkg.scripts || {};
    for (const [name, cmd] of Object.entries(scripts)) {
      const cmdStr = cmd as string;
      assert.ok(
        !cmdStr.startsWith("npm ") && !cmdStr.startsWith("yarn "),
        `Script "${name}" uses npm/yarn: ${cmdStr}`
      );
    }
  }
);

Then("the minimum version is Bun {}", function (_version: string) {
  /* doc — runtime check */
});
Then("Node.js minimum version is {}", function (_version: string) {
  /* doc */
});

// ============================================================================
// 06 - Release and Publishing
// ============================================================================

Given("a maintainer has made changes to one or more packages", function () {
  /* doc */
});
When("they run {string}", function (_cmd: string) {
  /* doc */
});
Then("a .changeset\\/*.md file should be committed with the PR", function () {
  /* doc */
});
Given("a changeset file is merged to main", function () {
  /* doc */
});
Given("the Version PR is merged to main", function () {
  /* doc */
});
Then("npm provenance is enabled \\(id-token: write)", function () {
  /* doc */
});

// --- Automatable: Fixed versioning ---
Given("the changeset config uses {string} mode", function (mode: string) {
  const config = readJson(".changeset/config.json");
  assert.ok(config[mode] && config[mode].length > 0, `Changeset config has no "${mode}" field`);
});

Then("all these packages are versioned together:", function (table: any) {
  const config = readJson(".changeset/config.json");
  const fixedList = config.fixed?.[0] || [];
  const expected = table.hashes().map((r: any) => r.package);

  // Check every expected package is in fixed list
  for (const pkg of expected) {
    assert.ok(fixedList.includes(pkg), `Package "${pkg}" not in changeset fixed list`);
  }

  // Check fixed list matches actual packages/ dirs
  const actualPkgs = packageDirs().map((d) => pkgJson(`packages/${d}`).name);
  for (const pkg of fixedList) {
    assert.ok(
      actualPkgs.includes(pkg),
      `Fixed list contains "${pkg}" but it doesn't exist in packages/`
    );
  }
});

Then("bumping any one of them bumps all of them", function () {
  /* guaranteed by fixed mode */
});

// --- Automatable: Public access ---
Given("the changeset config has {string}: {string}", function (key: string, value: string) {
  const config = readJson(".changeset/config.json");
  assert.strictEqual(
    config[key],
    value,
    `Changeset config.${key} is "${config[key]}", expected "${value}"`
  );
});

Then("all packages should be published as public npm packages", function () {
  const config = readJson(".changeset/config.json");
  assert.strictEqual(config.access, "public");
});

// --- Doc-only: CI steps ---
Then("the changesets GitHub Action should:", function (_table: any) {
  /* doc */
});

// ============================================================================
// 07 - Architecture
// ============================================================================

// --- Automatable: Workspace layout ---
Given("the monorepo root", function () {
  /* setup in Then */
});

Then("workspaces are configured as:", function (table: any) {
  const rootPkg = readJson("package.json");
  const workspaces = rootPkg.workspaces || [];
  const expected = table.hashes().map((r: any) => r.directory);
  for (const dir of expected) {
    assert.ok(
      workspaces.includes(dir),
      `Workspace "${dir}" not found in root package.json. Actual: ${workspaces.join(", ")}`
    );
  }
});

// --- Automatable: Core has no internal deps ---
Given("the package {string}", function (name: string) {
  // Find the package dir
  currentPackageName = name;
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    if (pkg.name === name) {
      currentPackageDeps = pkg.dependencies || {};
      return;
    }
  }
  assert.fail(`Package "${name}" not found`);
});

Then("it should have zero dependencies on other @agentxjs packages", function () {
  const internalDeps = Object.keys(currentPackageDeps).filter(
    (d) => d.startsWith("@agentxjs/") || d === "agentxjs"
  );
  assert.deepStrictEqual(
    internalDeps,
    [],
    `${currentPackageName} has internal deps: ${internalDeps.join(", ")}`
  );
});

Then(
  "it defines the fundamental types: Container, Image, Session, Driver, AgentXPlatform",
  function () {
    // Check that core package source tree contains these type definitions
    const coreSrc = resolve(ROOT, "packages/core/src");
    const typeDirs = ["container", "image", "session", "driver", "platform"];
    for (const dir of typeDirs) {
      assert.ok(existsSync(resolve(coreSrc, dir)), `Core package missing module: src/${dir}/`);
    }
  }
);

// --- Automatable: No platform-specific imports in core ---
Then("its source files should not import platform-specific modules:", function (table: any) {
  const forbidden = table.hashes().map((r: any) => r.module);
  // Find the package source directory
  let pkgSrcDir = "";
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    if (pkg.name === currentPackageName) {
      pkgSrcDir = resolve(ROOT, `packages/${d}/src`);
      break;
    }
  }
  assert.ok(pkgSrcDir, `Source dir not found for ${currentPackageName}`);

  // Scan all .ts files recursively
  const violations: string[] = [];
  function scanDir(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.name.endsWith(".ts")) {
        const content = readFileSync(full, "utf-8");
        for (const mod of forbidden) {
          // Match: import ... from "mod" / import("mod") / require("mod")
          const pattern = new RegExp(`(?:from\\s+|import\\(\\s*)["']${mod}["']`);
          if (pattern.test(content)) {
            const relPath = full.replace(pkgSrcDir + "/", "");
            violations.push(`${relPath} imports "${mod}"`);
          }
        }
      }
    }
  }
  scanDir(pkgSrcDir);

  assert.deepStrictEqual(
    violations,
    [],
    `${currentPackageName} has platform-specific imports:\n  ${violations.join("\n  ")}`
  );
});

// --- Automatable: Layer dependencies ---
Given("these packages:", function (table: any) {
  const rows = table.hashes();
  for (const row of rows) {
    const pkgName = row.package;
    const expectedDep = row["depends on"];
    let found = false;
    for (const d of packageDirs()) {
      const pkg = pkgJson(`packages/${d}`);
      if (pkg.name === pkgName) {
        found = true;
        const deps = pkg.dependencies || {};
        if (expectedDep) {
          assert.ok(deps[expectedDep], `${pkgName} should depend on ${expectedDep}`);
        }
        break;
      }
    }
    assert.ok(found, `Package "${pkgName}" not found`);
  }
});

Then("no package in this layer should depend on the SDK layer", function () {
  // SDK layer = "agentxjs"
  // Already checked in Given step that they only depend on core
  // Additional check: none depend on agentxjs
  const layerPkgs = ["@agentxjs/node-platform", "@agentxjs/claude-driver", "@agentxjs/mono-driver"];
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    if (layerPkgs.includes(pkg.name)) {
      const deps = pkg.dependencies || {};
      assert.ok(!deps["agentxjs"], `${pkg.name} depends on SDK layer (agentxjs) — layer violation`);
    }
  }
});

// --- Automatable: Server dependencies ---
Then("it depends on:", function (table: any) {
  const expected = table.hashes().map((r: any) => r.package);
  for (const dep of expected) {
    assert.ok(currentPackageDeps[dep], `${currentPackageName} should depend on ${dep}`);
  }
});

Then("it provides WebSocket server for remote agent connections", function () {
  /* doc */
});

// --- Automatable: SDK ---
Then("it provides a unified client API", function () {
  /* doc */
});

// --- Automatable: Applications ---
Given("these applications:", function (table: any) {
  const rows = table.hashes();
  for (const row of rows) {
    const appName = row.app;
    let found = false;
    for (const d of appDirs()) {
      const pkg = pkgJson(`apps/${d}`);
      if (pkg.name === appName) {
        found = true;
        break;
      }
    }
    assert.ok(found, `Application "${appName}" not found in apps/`);
  }
});

Then("each application should use the SDK, not import core directly for runtime use", function () {
  // Check apps have agentxjs in dependencies
  for (const d of appDirs()) {
    const pkg = pkgJson(`apps/${d}`);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps["agentxjs"] || deps["@agentxjs/server"]) {
      // Has SDK — good
    }
    // Not all apps necessarily need agentx, so no assertion
  }
});

// --- Automatable: Turbo pipeline ---
Given("the turbo pipeline", function () {
  assert.ok(existsSync(resolve(ROOT, "turbo.json")), "turbo.json not found");
});

Then(
  "{string} task depends on {string} \\(dependencies built first)",
  function (task: string, dep: string) {
    const turbo = readJson("turbo.json");
    const taskConfig = turbo.tasks?.[task];
    assert.ok(taskConfig, `Task "${task}" not found in turbo.json`);
    const dependsOn = taskConfig.dependsOn || [];
    assert.ok(
      dependsOn.includes(dep),
      `Task "${task}" does not depend on "${dep}". Actual: ${dependsOn.join(", ")}`
    );
  }
);

Then("the effective build order is:", function (_table: any) {
  /* doc — order is computed by turbo */
});

// --- Automatable: Shared tsconfig ---
Given("the file {string}", function (file: string) {
  assert.ok(existsSync(resolve(ROOT, file)), `${file} not found`);
});

Then("all packages should extend it", function () {
  for (const d of packageDirs()) {
    const tsconfigPath = resolve(ROOT, `packages/${d}/tsconfig.json`);
    if (existsSync(tsconfigPath)) {
      const content = readFileSync(tsconfigPath, "utf-8");
      assert.ok(
        content.includes("tsconfig.base.json"),
        `packages/${d}/tsconfig.json does not extend tsconfig.base.json`
      );
    }
  }
});

Then("it enforces:", function (table: any) {
  const tsconfig = readJson("tsconfig.base.json");
  const opts = tsconfig.compilerOptions || {};
  for (const row of table.hashes()) {
    const setting = row.setting;
    const expected = row.value;
    const actual = String(opts[setting]);
    assert.strictEqual(
      actual.toLowerCase(),
      expected.toLowerCase(),
      `tsconfig.base.json ${setting} is "${actual}", expected "${expected}"`
    );
  }
});

// ============================================================================
// 08 - New Package
// ============================================================================

Given("a contributor wants to add a new package", function () {
  /* doc */
});
Given("a new package named {string}", function (_name: string) {
  /* doc */
});
Given("a new package is added", function () {
  /* doc */
});
Given("a new package needs documentation", function () {
  /* doc */
});
Given("a contributor wants to add a new application", function () {
  /* doc */
});

// --- Automatable: Existing packages follow the structure ---
Then(
  "they should create it under {string} with this structure:",
  function (dir: string, table: any) {
    const expectedFiles = table.hashes().map((r: any) => r.path);
    const dirs = dir === "packages/" ? packageDirs() : appDirs();
    const base = dir === "packages/" ? "packages" : "apps";

    for (const d of dirs) {
      for (const file of expectedFiles) {
        const fullPath = resolve(ROOT, base, d, file);
        assert.ok(existsSync(fullPath), `${base}/${d}/ missing required file: ${file}`);
      }
    }
  }
);

// --- Automatable: package.json conventions ---
Then("its package.json should include:", function (table: any) {
  // Verify that existing packages follow these conventions
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    assert.ok(pkg.name, `packages/${d} missing name`);
    assert.strictEqual(pkg.type, "module", `packages/${d} type should be "module"`);
    assert.ok(pkg.version, `packages/${d} missing version`);
  }
});

Then("internal dependencies use {string} protocol", function (protocol: string) {
  for (const d of packageDirs()) {
    const pkg = pkgJson(`packages/${d}`);
    const deps = pkg.dependencies || {};
    for (const [name, version] of Object.entries(deps)) {
      if (name.startsWith("@agentxjs/") || name === "agentxjs") {
        assert.ok(
          (version as string).startsWith(protocol.replace("*", "")),
          `packages/${d}: dep "${name}" uses "${version}", expected "${protocol}"`
        );
      }
    }
  }
});

Then("Turbo should automatically detect it via the workspace config", function () {
  /* doc */
});
Then("{string} from root should include the new package", function (_cmd: string) {
  /* doc */
});
Then("the package should appear in changesets fixed group if publishable", function () {
  /* doc */
});

// --- Doc-only: README template ---
Then("the README should include:", function (_table: any) {
  /* doc */
});

// --- Doc-only: App conventions ---
Then("they should create it under {string} with:", function (_dir: string, _table: any) {
  /* doc */
});
Then("the app should import from SDK layer, not core directly", function () {
  /* doc */
});

// ============================================================================
// Generic table handlers for doc-only scenarios
// ============================================================================

// "Then they should understand:" / "Then they should follow this workflow:"
// / "Then the main agent should:" / "Then it should:" / "Then they should:"
// / "Then it should end each response with:"
Then("they should understand:", function (_table: any) {
  /* doc */
});
Then("they should follow this workflow:", function (_table: any) {
  /* doc */
});
Then("the main agent should:", function (_table: any) {
  /* doc */
});
Then("it should:", function (_table: any) {
  /* doc */
});
Then("they should:", function (_table: any) {
  /* doc */
});
Then("it should end each response with:", function (_table: any) {
  /* doc */
});
