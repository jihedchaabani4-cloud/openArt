---
name: ui-system-first
description: Use for any UI work in my-app (new screen, component, style change, upload UI).
---
1. Read `my-app/docs/ui-system/inventory.md` and `docs/agents/rules/ui-system.md`; open the primitives folder.
2. Component exists: use it with its existing variants. No fit: compose primitives. Still no fit: STOP and ask.
3. Values come from tokens only. Missing token or variant: ask the human, add it to the token file or primitive, never hardcode.
4. A call-site className may only position the element, never restyle it.
5. Run `npm run ui:check`; new violations = fix the code, never edit ui-baseline.json.
6. Existing screen migration: one screen per commit, before/after screenshots for the human.
