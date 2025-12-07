---
"agentxjs": patch
"@agentxjs/runtime": patch
"@agentxjs/ui": patch
"@agentxjs/portagent": patch
---

fix: remove private packages from published dependencies

Move @agentxjs/types, @agentxjs/common, @agentxjs/agent from dependencies
to devDependencies. These packages are bundled via tsup noExternal config
and should not appear in the published package.json dependencies.
