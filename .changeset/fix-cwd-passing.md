---
"@agentxjs/runtime": patch
---

fix(runtime): pass sandbox workdir path as cwd to Claude SDK

Previously, the cwd parameter was not being passed from RuntimeAgent to ClaudeEnvironment, causing the Claude SDK to run in the default working directory instead of the agent's isolated sandbox workdir. This fix ensures each agent operates within its designated working directory at `~/.agentx/containers/{containerId}/workdirs/{agentId}/`.
