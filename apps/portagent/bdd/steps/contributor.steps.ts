/**
 * Contributor journey steps for portagent
 */

import { Given, When, Then, After, AfterAll } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  launchBrowser,
  getPage,
  closePage,
  closeBrowser,
  startDevServer,
  stopDevServer,
} from "@agentxjs/devtools/bdd";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "../..");
const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// ============================================================================
// Step Definitions
// ============================================================================

Given("the portagent app is configured", async function () {
  const packageJsonPath = resolve(APP_DIR, "package.json");
  assert.ok(existsSync(packageJsonPath), "package.json should exist");
});

When("I start the portagent dev server", async function () {
  await startDevServer({
    cwd: APP_DIR,
    port: DEV_SERVER_PORT,
  });
});

Then(
  "the server should be running on port {int}",
  async function (port: number) {
    const response = await fetch(`http://localhost:${port}`);
    assert.ok(response.ok, `Server should respond on port ${port}`);
  }
);

Given("the portagent dev server is running", async function () {
  await startDevServer({
    cwd: APP_DIR,
    port: DEV_SERVER_PORT,
  });

  await launchBrowser({ headless: false });
  await getPage();
});

When("I visit the homepage", async function () {
  const page = await getPage();
  await page.goto(DEV_SERVER_URL);
  await page.waitForLoadState("domcontentloaded");
});

Then("I should see {string} in the page title", async function (text: string) {
  const page = await getPage();
  const title = await page.title();
  assert.ok(title.includes(text), `Page title should contain "${text}"`);
});

Then("I should see a welcome message", async function () {
  const page = await getPage();
  const welcomeText = page.locator("text=Welcome");
  const isVisible = await welcomeText.isVisible();
  assert.ok(isVisible, "Welcome message should be visible");

  // Pause for visual inspection in headed mode
  if (!process.env.CI) {
    await new Promise((r) => setTimeout(r, 3000));
  }
});

// ============================================================================
// Cleanup
// ============================================================================

After({ tags: "@contributor" }, async function () {
  await closePage();
});

AfterAll(async function () {
  await closeBrowser();
  stopDevServer();
});
