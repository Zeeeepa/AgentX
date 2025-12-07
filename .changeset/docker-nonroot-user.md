---
"@agentxjs/portagent": patch
---

fix: run Docker container as non-root user

- Add agentx user (UID 1001) to Docker image
- Run container as non-root user to allow Claude Agent SDK bypassPermissions mode
- Set AGENTX_DATA_DIR to user home directory
