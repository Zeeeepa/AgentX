---
"@agentxjs/portagent": patch
---

Fix npm publish: use standard root-directory publishing pattern

- Change bin entry to point directly to `./dist/cli.js`
- Convert CLI wrapper to ESM syntax
- Add `prepublishOnly` script to ensure build before publish
- Remove redundant `bin/portagent.js` and `dist/package.json` generation
