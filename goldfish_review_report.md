# Goldfish Review Resolution Report: Stage 7 Critic Review

**Target Document:** `docs/designs/unified-design-tokens-and-surface-primitives.md`  
**Resolver:** Primary Elephant Context  
**Input Report:** `critic_report.md`

---

## Findings Triage & Resolution Actions

| Finding ID | Classification | Resolution Status | Technical Remediation Applied |
| :--- | :--- | :--- | :--- |
| **B1** | Blocker | **PROPOSE FIX** | Normalized `CardHeader` to keep default vertical column layout (`flex flex-col gap-1.5 p-4 sm:p-5`), preserving title/description stacking. Normalized `Card` to accept and map legacy `variant` prop (`interactive`, `glass`, `default`). |
| **B2** | Blocker | **PROPOSE FIX** | Removed arbitrary bracket `active:scale-[0.995]`, replaced with canonical `active:scale-95`. Updated CUJ 2 to `<Card.Canvas className="aspect-video bg-surface-sunken">` to satisfy Rule U8. |
| **B3** | Blocker | **PROPOSE FIX** | Added explicit baseline bootstrap step documenting `node scripts/ui-check.cjs --init-baseline` before enabling Rule U8 in CI. |
| **M1** | Major | **PROPOSE FIX** | Renamed border tokens to `--color-line-subtle`, `--color-line-default`, `--color-line-interactive`, eliminating the stuttering `border-border-*` syntax. |
| **M2** | Major | **PROPOSE FIX** | Linked `:root` CSS custom properties to `@theme inline` variables, guaranteeing zero-component-touch light mode switching. |
| **M3** | Major | **PROPOSE FIX** | Upgraded Rule U8 regex to match directional borders (`border-t-*`, `border-b-*`), dividers (`divide-*`), and outline utilities. |
| **M4** | Major | **PROPOSE FIX** | Added `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-interactive` to interactive `Card` state for WCAG compliance. |
| **N1** | Nit | **PROPOSE FIX** | Added explicit 1-sentence heuristic defining when to reach for `Surface` vs `Card`. |
