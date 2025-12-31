---
"@agentxjs/portagent": patch
---

fix: include unstorage/drivers/db0 in compiled binary

Fixed startup failure on Windows and Linux where the compiled binary could not find the `unstorage/drivers/db0` module. This module was incorrectly marked as an optional external dependency, but it is actually required for SQLite persistence.

Fixes #188
