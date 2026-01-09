---
"@agentxjs/portagent": patch
---

fix(portagent): use import.meta.hot to detect Vite dev mode for WebSocket URL

Bun doesn't statically replace `import.meta.env.DEV` at build time (unlike Vite),
causing production builds to incorrectly use localhost:5200 for WebSocket connections.

Changed to use `import.meta.hot` which only exists when Vite dev server is running,
ensuring production builds correctly use `window.location.host`.
