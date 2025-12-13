---
"@agentxjs/ui": patch
---

fix(MobileDrawer): use internal portal container to fix z-index stacking issues

When MobileDrawer was used in host applications with high z-index elements (e.g., carousels, modals), the drawer would appear behind those elements. This was because vaul's Portal rendered to document.body by default.

Now MobileDrawer creates its own portal container with z-index: 9999, ensuring the drawer always appears on top regardless of the host application's DOM structure.
