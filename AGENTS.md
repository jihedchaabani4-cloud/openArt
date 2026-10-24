# my-app (frontend)

Root rules apply (see ../AGENTS.md). Read ../docs/agents/rules/frontend.md and ui-system.md before touching UI.

- Two tracks: upload tickets 07-09 = NO visual change. Design-system track = tokens/primitives, one screen per commit, screenshots for approval.
- Colors, spacing, radius, font sizes come from tokens only. No hardcoded values, no className restyling at call sites.
- Before creating a component: open docs/ui-system/inventory.md and the primitives folder (generated file, run `npm run ui:inventory` first). Reuse first.
- `npm run ui:check` before every commit. `npm run ui:inventory` to refresh the inventory.
- No new dependency. No console.*. No fetch inside components (use the API client or a hook).
