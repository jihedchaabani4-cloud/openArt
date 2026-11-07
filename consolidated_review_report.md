# Consolidated EGM Review Report: Unified Design Tokens & Surface Primitives

**Target Document:** `docs/designs/unified-design-tokens-and-surface-primitives.md`  
**Pipeline Presets:** Interactive Preset 0 (Stages 5 → 6 → 7 → 8 → 9)  
**Status:** **READY FOR REMEDIATION & FINALIZATION (4 Consolidated Blockers, 5 Consolidated Majors, 3 Consolidated Nits)**

---

## 1. Executive Summary & Review Synthesis

Across the 5 stages of the EGM Goldfish Review Protocol, the design document's core thesis—unifying design tokens via Tailwind v4 `@theme inline`, establishing RSC-safe compound `Surface` and `Card` primitives without React Context, and preventing token sprawl via automated ratchets—was unanimously validated as architecturally sound.

However, the late-stage deep reviews (Stages 8 & 9) caught critical discrepancies between the document's theoretical abstractions and the real codebase state in `my-app`:
1. **Existing Runway Design System Scale:** The codebase already possesses an active, 6-tier dark surface scale in `globals.css` (`--surface-canvas`, `--surface-panel`, `--surface-processing`, `--surface-card`, `--surface-elevated`, `--surface-highest`). The proposal's ad-hoc tokens inverted this scale (making `--surface-elevated: #161718` darker than `--surface-card: #1e1f20`) and broke existing primitives like `Button` secondary.
2. **Ratchet Bootstrap CI Crash:** Running `node scripts/ui-check.cjs --init-baseline` is rejected because `ui-baseline.json` already exists. Seeding Rule U8 requires a dedicated merge command rather than re-initialization.
3. **Card `radius` Override Bug:** Hardcoding `"rounded-md"` in `Card`'s `className` clobbers the `radius` prop passed to `<Surface>` due to `tailwind-merge` resolution order.
4. **Package & Import Realities:** The project uses the umbrella package `radix-ui` (`import { Slot } from "radix-ui"`), not `@radix-ui/react-slot`.
5. **Canary Slice Realignment:** `ElementInfoSidebar.jsx` is an unboxed layout grid where wrapping in `Surface` damages visual parity; `HowToDrawer.jsx` is the legitimate boxed panel canary. `MediaCard.jsx` requires `radius="xxxs"` (1px hairline) in `Surface`.

---

## 2. Traceability Matrix: Raw Findings to Actionable Remediations

| Action ID | Priority | Origin Stages | Finding Summary | Exact Remediation Applied to Design Doc |
| :--- | :--- | :--- | :--- | :--- |
| **ACT-01** | 🔴 Blocker | Stage 8, Stage 9 | **Token Scale Collision & Inversion:** Inverting dark elevation scale and clobbering existing `--surface-elevated: #282a2c`. | Reconcile with Runway scale in `globals.css`. Map `surface-base` to `--surface-card` (`#1e1f20`), keep `--surface-elevated` (`#282a2c`), `--surface-panel` (`#131314`), and add `--surface-sunken` (`#000000`/`--surface-canvas`). |
| **ACT-02** | 🔴 Blocker | Stage 8, Stage 9 | **CI Ratchet Lockout:** `--init-baseline` aborts when `ui-baseline.json` exists; `--shrink-baseline` cannot ingest new rules. | Provide exact Node.js one-liner in Phase 3 to load existing baseline, collect U8 violations, and merge keys without destroying U1–U7. |
| **ACT-03** | 🔴 Blocker | Stage 8, Stage 9 | **Card Radius Override:** Hardcoded `"rounded-md"` inside `Card`'s `className` defeats `<Surface radius={radius}>`. | Remove `"rounded-md"` from `Card`'s static class string, delegating radius completely to `radius` prop on `Surface`. |
| **ACT-04** | 🔴 Blocker | Stage 9 | **Missing Package:** `@radix-ui/react-slot` is not in `package.json`. | Mandate `import { Slot } from "radix-ui"` and `<Slot.Root>` matching project conventions. |
| **ACT-05** | 🟡 Major | Stage 8, Stage 9 | **Residual Border Token Names:** Lingering `--color-border-*` and `border-border-subtle` in plan. | Globally replace all occurrences with `--color-line-subtle`, `--color-line-default`, `--color-line-interactive` (`border-line-*`). |
| **ACT-06** | 🟡 Major | Stage 8, Stage 9 | **Canary Target Realignment:** `ElementInfoSidebar.jsx` is unboxed; `MediaCard.jsx` uses 1px radius. | Add `xxxs: "rounded-xxxs"` and `sharp: "rounded-sm"` to `surfaceVariants`. Migrate `HowToDrawer.jsx` (or internal sidebar controls) instead of root `ElementInfoSidebar`. |
| **ACT-07** | 🟡 Major | Stage 8 | **Interactive Card Affordance:** Missing hover background on interactive cards. | Add `hover:bg-surface-processing` / `hover:bg-white/10` to interactive variant. |
| **ACT-08** | 🟡 Major | Stage 8 | **WCAG Keyboard Focus on Divs:** `Card` missing `tabIndex={0}` and role when interactive. | Add `tabIndex={isInteractive ? 0 : undefined}` and `role={isInteractive ? "button" : undefined}` on `Card`. |
| **ACT-09** | 🟡 Major | Stage 8, Stage 9 | **Schema Migration Fiction:** Claiming G4 migrates schema when `{ "RULE|path": count }` already exists. | Clarify G4 is rule addition, not baseline schema re-architecture. |
| **ACT-10** | 🟢 Nit | Stage 8 | **Inaudible Divider Opacity:** `border-line-subtle/50` gives 3.5% opacity. | Use solid `border-line-subtle`. |
| **ACT-11** | 🟢 Nit | Stage 8 | **Redundant Class in CUJ 2:** `bg-surface-sunken` passed to `Card.Canvas` twice. | Clean up CUJ 2 call site. |
| **ACT-12** | 🟢 Nit | Stage 9 | **Accuracy on `ui-check.cjs`:** Described as "AST-Driven" when it is line-regex. | Correct description to regex line ratchet. |

---

## 3. Implementation Phasing Roadmap

Once remediated into `docs/designs/unified-design-tokens-and-surface-primitives.md`, implementation will proceed in four zero-regression phases:

1. **Phase 1: Semantic Runway Tokens in `src/app/globals.css`**
   - Bind `--line-subtle`, `--line-default`, `--line-interactive` in `:root` and map in `@theme inline`.
   - Reconcile `--color-surface-*` tokens to standard Runway variables (`--surface-canvas`, `--surface-panel`, `--surface-card`, `--surface-elevated`).
2. **Phase 2: Core Primitives Construction**
   - Create `src/shared/ui/surface.jsx` using `import { Slot } from "radix-ui"`, `cva`, `cn` from `@/shared/lib/utils`, and `React.forwardRef`.
   - Update `src/shared/ui/card.jsx` using Dual Export Pattern with aliases, `tabIndex`, interactive hover background, and clean radius delegation.
3. **Phase 3: Ratchet Rule U8 in `scripts/ui-check.cjs`**
   - Add neutral palette regex Rule U8.
   - Run baseline merge script to safely seed existing U8 violation counts into `ui-baseline.json`.
4. **Phase 4: Verified Canary Refactors**
   - Refactor `src/features/media/ui/MediaCard.jsx` to `<Card radius="xxxs" tone="card">` and `<Card.Canvas>`.
   - Refactor `src/components/cinema-studio/elements/HowToDrawer.jsx` to `<Surface tone="panel">`.
   - Run `npm run ui:check --shrink-baseline` to lock in zero net regressions.
