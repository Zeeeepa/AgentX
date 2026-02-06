/**
 * Playwright utilities for BDD testing
 *
 * Uses system Chrome to avoid downloading Chromium.
 * Install: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun add -d @playwright/test
 */

import { chromium, Browser, Page } from "@playwright/test";

export interface BrowserOptions {
  headless?: boolean;
  slowMo?: number;
}

let browser: Browser | null = null;
let page: Page | null = null;

/**
 * Launch browser using system Chrome
 */
export async function launchBrowser(
  options: BrowserOptions = {}
): Promise<Browser> {
  if (browser) return browser;

  const headless = options.headless ?? process.env.CI === "true";

  browser = await chromium.launch({
    channel: "chrome",
    headless,
    slowMo: options.slowMo,
  });

  return browser;
}

/**
 * Get or create a new page
 */
export async function getPage(): Promise<Page> {
  if (page) return page;

  const b = await launchBrowser();
  page = await b.newPage();
  return page;
}

/**
 * Close current page
 */
export async function closePage(): Promise<void> {
  if (page) {
    await page.close();
    page = null;
  }
}

/**
 * Close browser and cleanup
 */
export async function closeBrowser(): Promise<void> {
  await closePage();
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Wait for a URL to be accessible
 */
export async function waitForUrl(
  url: string,
  timeout = 30000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
