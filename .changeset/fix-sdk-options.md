---
"@agentxjs/runtime": patch
---

fix: correct Claude Agent SDK options configuration

- Remove incorrect `executable` option (was passing process.execPath instead of 'node'/'bun'/'deno')
- Add required `allowDangerouslySkipPermissions: true` when using `bypassPermissions` mode
