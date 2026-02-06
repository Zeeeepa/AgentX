import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SKILL_PATH = resolve(
  __dirname,
  "../../../../.claude/skills/agent-browser/SKILL.md"
);

function loadSystemPrompt(headed = false): string {
  let skillContent = "";
  try {
    skillContent = readFileSync(SKILL_PATH, "utf-8");
  } catch {
    // Skill file not found, continue without it
  }

  return `You are a UI tester. You test web application scenarios using the agent-browser CLI.

RULES:
- ONLY use agent-browser commands via Bash tool
- Use ${headed ? "--headed " : ""}--executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" for all commands
- After each navigation or click, run: agent-browser snapshot -i
- Refs (@e1, @e2) are invalidated after page changes — always re-snapshot
- At the end, close the browser with: agent-browser close
- Output your result as a single line: PASS or FAIL followed by a brief reason

${skillContent ? `AGENT-BROWSER REFERENCE:\n${skillContent}` : ""}`;
}

export interface UiTestResult {
  passed: boolean;
  output: string;
}

export interface UiTesterOptions {
  model?: string;
  baseUrl?: string;
  timeout?: number;
  /** Show browser window (default: false) */
  headed?: boolean;
}

/**
 * Run a UI test scenario using Claude Code CLI + agent-browser.
 *
 * Uses a temporary bash script to avoid Bun subprocess auth issues
 * with nested Claude CLI invocations.
 *
 * @example
 * ```ts
 * const result = agentUiTester(`
 *   Navigate to http://localhost:3000
 *   Verify redirect to /setup
 *   Fill email "admin@example.com", password "admin123"
 *   Click Setup
 *   Verify logged in as admin
 * `);
 * expect(result.passed).toBe(true);
 * ```
 */
export function agentUiTester(
  prompt: string,
  options: UiTesterOptions = {}
): UiTestResult {
  const { model = "haiku", baseUrl, timeout = 300_000, headed = false } = options;

  const fullPrompt = baseUrl
    ? `Base URL: ${baseUrl}\n\n${prompt}`
    : prompt;

  const systemPrompt = loadSystemPrompt(headed);

  // Write prompt and system prompt to temp files to avoid shell escaping issues
  const tmpDir = join(tmpdir(), "agent-ui-tester");
  mkdirSync(tmpDir, { recursive: true });
  const promptFile = join(tmpDir, `prompt-${Date.now()}.txt`);
  const sysPromptFile = join(tmpDir, `sys-${Date.now()}.txt`);
  const scriptFile = join(tmpDir, `run-${Date.now()}.sh`);

  writeFileSync(promptFile, fullPrompt);
  writeFileSync(sysPromptFile, systemPrompt);
  writeFileSync(
    scriptFile,
    [
      "#!/bin/bash",
      "unset CLAUDECODE CLAUDE_CODE_SSE_PORT CLAUDE_CODE_ENTRYPOINT",
      `PROMPT=$(cat "${promptFile}")`,
      `SYS_PROMPT=$(cat "${sysPromptFile}")`,
      `claude -p "$PROMPT" --model ${model} --append-system-prompt "$SYS_PROMPT" --allowedTools "Bash(agent-browser:*)"`,
    ].join("\n")
  );

  try {
    const result = spawnSync("/bin/bash", [scriptFile], {
      encoding: "utf-8",
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const output = (result.stdout || result.stderr || "").trim();
    const passed = /\*{0,2}PASS\*{0,2}\b/m.test(output);

    return { passed, output };
  } catch (error: any) {
    return { passed: false, output: error.message || "Unknown error" };
  } finally {
    // Cleanup temp files
    try { unlinkSync(promptFile); } catch {}
    try { unlinkSync(sysPromptFile); } catch {}
    try { unlinkSync(scriptFile); } catch {}
  }
}
