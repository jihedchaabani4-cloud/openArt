# Stage 8: Intermediate Zoom Out Review (egm-zoom-out)

**Target Document:** `docs/designs/unified-design-tokens-and-surface-primitives.md`  
**Reviewer:** `egm-zoom-out` (High-altitude architecture, necessity, complexity minimization, backward compatibility, and speculative abstraction post-remediation)  
**Status:** **CHANGES REQUIRED (3 Blockers, 4 Majors, 3 Nits)**

---

## 1. Executive Summary & Altitude Verdict

From a 30,000-foot architectural viewpoint, the design document sets out commendable goals (unifying tokens, RSC-safe card layout, ratchet enforcement). However, despite the post-remediation cleanups from Stages 5–7, the proposal suffers from **critical architectural dissonance with the existing codebase**, **a broken CI bootstrap workflow**, and **flawed vertical-slice canary targets**.

Most critically:
1. **Token Hierarchy Collision & Inversion:** The document invents a new token vocabulary (`--surface-elevated: #161718`) that directly collides with and inverts the existing, production-active 6-tier Runway surface scale in `globals.css` (where `--surface-elevated` is `#282a2c`). In the dark theme, this inversion makes "elevated" surfaces darker than base cards.
2. **Non-Functional Ratchet Bootstrap:** The document instructs running `node scripts/ui-check.cjs --init-baseline`, which hard-fails in CI/local shells because `ui-baseline.json` already exists and the script rejects re-initialization.
3. **Canary Regression:** Neither of the two chosen canary files can achieve the stated "0 pixel shift target." One changes corner radii from 1px to 6px; the other places a dark bordered box around a previously transparent form column.
4. **Dead Prop Bug in Primitive Layering:** Hardcoding `rounded-md` in `Card`'s `className` clobbers the `radius` prop passed to underlying `Surface` due to `tailwind-merge` resolution order.

Verdict: **NOT APPROVED**. The architectural contract must be harmonized with existing repo realities before implementation.

---

## 2. Residual Architectural Inconsistencies & Blindspots

### A. The Parallel Token Universe & Inverted Elevation Scale
`globals.css` (lines 263–296) already implements an active 6-tier dark surface system:
```text
Canvas (#000000) -> Panel (#131314) -> Processing (#17181a) -> Card (#1e1f20) -> Elevated (#282a2c) -> Highest (#333537)
```
Existing components (including `Button` secondary variant in `src/shared/ui/button.jsx`) already consume `bg-surface-elevated` expecting `#282a2c`.

The design doc introduces:
```css
--surface-base: #0f1011;
--surface-elevated: #161718;
--surface-sunken: #090a0a;
```
* **Collision:** Redefining `--surface-elevated` to `#161718` silently changes existing consumers.
* **Inversion:** In dark UI architecture, higher elevation reflects more ambient light (lighter hex). If `--surface-elevated` becomes `#161718`, it becomes **darker** than existing `--surface-card` (`#1e1f20`). A card placed on an elevated surface would be brighter than its background container, completely breaking visual hierarchy.
* **Omission:** The doc neither deprecates nor maps existing `--surface-card`, `--surface-panel`, or `--surface-processing`.

### B. Broken Primitive Layering: `Card` Overriding `Surface` Props
In `src/shared/ui/card.jsx`:
```jsx
<Surface
  ref={ref}
  tone={resolvedTone}
  radius={radius}
  className={cn(
    "rounded-md text-content-base transition-all font-sans antialiased overflow-hidden flex flex-col relative",
    className
  )}
  {...props}
/>
```
Inside `Surface`:
```jsx
className={cn(surfaceVariants({ tone, radius }), className)}
```
When a consumer calls `<Card radius="sm" />`, `surfaceVariants` outputs `rounded-sm`. But `Card` passes `rounded-md` inside its own `className`. When `cn()` (`tailwind-merge`) evaluates `rounded-sm` followed by `rounded-md`, **`rounded-md` always wins**. The `radius` prop on `Card` is dead code.

---

## 3. Complexity & YAGNI Check

### Is `Surface` Speculative Abstraction?
`Surface` is a 30-line CVA wrapper around a `<div>` that renders background, border, and radius. 
In the entire proposed migration plan, **only one component** is slated to consume `Surface` directly: `ElementInfoSidebar.jsx`. 
`ElementInfoSidebar` is an un-boxed column of form fields where adding `Surface` introduces an unwanted border and background. 
If no feature components legitimately need a bare `Surface`, wrapping `Card` over `Surface` creates artificial layering. Alternatively, if `Surface` is retained, it must serve actual panel surfaces (e.g., drawers/popovers like `HowToDrawer.jsx`) without hardcoded overrides.

### Baseline Schema "Migration" Fiction
The doc repeatedly claims G4 migrates the baseline schema from line numbers to `{ file, rule, count }`. Inspection of `ui-baseline.json` and `scripts/lib/ratchet.cjs` reveals the codebase **already uses** `"RULE|file": count`. No schema migration is required.

---

## 4. Concrete Findings

### [Blocker] 1. Token Collision & Inverted Dark Elevation Scale
* **Location:** `docs/designs/unified-design-tokens-and-surface-primitives.md` lines 97–128; `src/app/globals.css` lines 263–296.
* **Issue:** Redefining `--surface-elevated` to `#161718` conflicts with existing `--surface-elevated: #282a2c`. It breaks existing usages (such as `Button` secondary) and inverts the elevation hierarchy by making "elevated" darker than `--surface-card` (`#1e1f20`).
* **Remediation:** Reconcile with the existing Runway surface tokens. Align tokens to the existing scale (`--surface-canvas`, `--surface-panel`, `--surface-card`, `--surface-elevated`) without clobbering `--surface-elevated`.

### [Blocker] 2. Linter Bootstrap Command Hard-Crashes CI & Local Shells
* **Location:** Section 3 (line 297), Step 3.2 (line 367).
* **Issue:** The document instructs developers to run `node scripts/ui-check.cjs --init-baseline` to seed Rule U8. In `scripts/ui-check.cjs` line 87:
  ```javascript
  if (fs.existsSync(BASELINE)) { console.error('ui-baseline.json already exists. Use --shrink-baseline.'); return 1; }
  ```
  The command aborts with code 1. Furthermore, `--shrink-baseline` cannot add new rules; it strictly computes `Math.min(allowed, current)` on keys already present in the baseline.
* **Remediation:** Provide an explicit script or mechanism (e.g., `--update-baseline` or a merge script) that appends new rule baselines without requiring manual JSON editing or crashing on existing baseline files.

### [Blocker] 3. Dead `radius` Prop in `Card` Due to Hardcoded Class Merge Order
* **Location:** Section 2.B (lines 190–213).
* **Issue:** `<Card radius="sm">` passes `radius="sm"` to `Surface`, which yields `rounded-sm`. However, `Card` also appends `"rounded-md text-content-base ..."` in the `className` string passed to `Surface`. `tailwind-merge` resolves conflicts in favor of the later class (`rounded-md`). Consumer radius overrides on `Card` are silently ignored.
* **Remediation:** Remove `rounded-md` from `Card`'s hardcoded `className`, allowing `Surface`'s `radius` variant (or consumer `className`) to govern border radius cleanly.

---

### [Major] 4. Canary Target Invalidation: Visual Parity Impossible with Canary Files
* **Location:** Section 4 (lines 302–312) & Section Detailed Implementation Plan (lines 370–376).
* **Issue:**
  1. **`ElementInfoSidebar.jsx`:** Currently an unbordered, transparent layout column. Wrapping it in `<Surface tone="elevated">` introduces a visible `#161718` background and a 1px border.
  2. **`MediaCard.jsx`:** Explicitly uses `rounded-xxxs` (`--radius-xxxs: 1px`, the Runway hairline standard for media elements). `Surface` variants only support `none`, `sm`, `md`, `full`. Migrating `MediaCard` to `<Card>` forces a 6px radius (`rounded-md`), causing an immediate visual regression.
* **Remediation:**
  - Add `xxxs` (or `hairline`) to `surfaceVariants` radius options.
  - Pick a legitimate elevated/panel canary for `Surface` (such as `src/components/cinema-studio/elements/HowToDrawer.jsx`) rather than a transparent form column.

### [Major] 5. Residual Token Naming Inconsistencies Post-Remediation
* **Location:** Lines 355, 356, 383, 390.
* **Issue:** While Section 1 correctly renamed border tokens to `--line-subtle`, `--line-default`, and `--line-interactive`, residual references to obsolete names remain in the plan:
  - Line 355: references `--color-border-*`
  - Line 356: references `border-border-subtle/50`
  - Line 383: references `--color-border-*`
  - Line 390: references `border-border-subtle`
* **Remediation:** Align all implementation steps and tables with the `--line-*` / `border-line-*` contract.

### [Major] 6. WCAG Focus Ring Non-Functional on Divs & Radix `asChild` Pitfall
* **Location:** Section 2.B (lines 206–207) & Goal G2 (line 27).
* **Issue:** 
  1. `Card` adds `focus-visible:ring-1 focus-visible:ring-line-interactive`, but `Surface` renders a standard `<div>`. A `<div>` is not focusable via keyboard navigation without `tabIndex={0}` or `role="button"`.
  2. G2 claims `Card` supports Radix `asChild`. However, `Card`'s code does not handle `asChild`, and passing `asChild` to a compound `Card` with multiple children causes Radix `Slot` to throw a fatal runtime exception.
* **Remediation:** When `isInteractive` is true, add `tabIndex={0}` and `role="button"` (or keyboard event handlers), and clarify that `asChild` is only valid on atomic leaf primitives (`Surface`), not compound multi-child cards.

### [Major] 7. Interactive Card Hover Background Regressed
* **Location:** Section 2.B (lines 206–207) vs existing `src/shared/ui/card.jsx` (line 28).
* **Issue:** Existing interactive cards have `hover:bg-white/10 hover:border-white/10`. The proposed `Card` removes background hover feedback entirely (`hover:border-line-interactive` only).
* **Remediation:** Add semantic hover background feedback (e.g. `hover:bg-surface-processing` or `hover:bg-white/10`).

---

### [Nit] 8. Redundant Styling in CUJ 2
* **Location:** Line 48 (`<Card.Canvas className="aspect-video bg-surface-sunken">`).
* **Issue:** `CardCanvas` already sets `bg-surface-sunken` by default (line 243). Specifying it again in `className` in the CUJ is redundant.

### [Nit] 9. Inaudible 3.5% Opacity on Card Header / Footer Dividers
* **Location:** Lines 222, 259 (`border-line-subtle/50`).
* **Issue:** `--line-subtle` is `rgba(255, 255, 255, 0.07)`. Adding `/50` yields 3.5% opacity, which is imperceptible on standard screens and fails contrast heuristics. Use `border-line-subtle` directly.

### [Nit] 10. Direct Import of `@radix-ui/react-slot` vs `radix-ui` Umbrella Package
* **Location:** Line 138 (`import { Slot } from "@radix-ui/react-slot"`).
* **Issue:** `package.json` specifies `"radix-ui": "^1.4.3"`. Existing primitives import `{ Slot } from "radix-ui"`. Match existing project conventions.

---

## 5. Required Action Items Before Final Sign-Off

1. **Harmonize Surfaces:** Align the token spec with existing `globals.css` (`--surface-canvas`, `--surface-panel`, `--surface-processing`, `--surface-card`, `--surface-elevated`, `--surface-highest`) and resolve the dark theme inversion.
2. **Fix Baseline Tooling:** Provide a working CLI path to baseline new Rule U8 without tripping the `--init-baseline` guard.
3. **Fix `Card` Radius Merging:** Strip `rounded-md` from `Card`'s hardcoded class string so `radius` works.
4. **Fix Canary Selections:** Include `radius="xxxs"` in `Surface` for `MediaCard`, and select a genuine boxed panel (`HowToDrawer.jsx`) for `Surface`.
5. **Clean Residual Names:** Eliminate all lingering `border-border-*` strings in Phase 1 and Affected Files tables.
