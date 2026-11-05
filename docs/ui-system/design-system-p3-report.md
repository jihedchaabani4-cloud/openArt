# Runway Design System — Phase P3 Report: Corrections, UI Ratchet & Component Specifications

**Repository:** OpenArt / Labveil Frontend (`my-app`)  
**Branch:** `runway-design`  
**Phase:** P3 (Corrections, UI Ratchet Expansion, Button Audit & Component Specifications)  
**Status:** Completed & Fully Validated  
**Canonical Specification:** `design.md` (root and `my-app/docs/ui-system/design.md`)

---

## Executive Summary

Phase P3 addresses the confirmed architectural findings from the Design System Audit, strengthens automated UI governance through the `ui:check` ratchet, audits the entire button primitive variant footprint, and formalizes complete component specifications for all 16 design primitives within a 3-layer token architecture.

All changes have been verified against the full test suite (800 passing tests across 124 files), production Turbopack build (31 routes compiled), ESLint (0 errors), and the enhanced UI ratchet (0 new violations).

---

## 1. Confirmed Findings and Fixes

### 1.1 Resolution of `--glass-raised-box-shadow` Cascade Conflict

* **Issue Confirmed:** The Design System Audit identified a conflicting duplicate CSS declaration in `src/app/globals.css`. While line 349 declared `--glass-raised-box-shadow: none;` in accordance with the **Zero Box-Shadow Law**, a legacy declaration remained at line 447 declaring:
  ```css
  --glass-raised-box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.4);
  ```
  Because both declarations targeted the `:root` pseudo-class and line 447 appeared later in document order, the shadow declaration overrode the `none` declaration. This caused any element referencing `var(--glass-raised-box-shadow)` to render a 32px diffused drop shadow.
* **Resolution:** The duplicate declaration on line 447 was deleted. The single authoritative declaration at line 349 (`--glass-raised-box-shadow: none;`) now governs all `:root` scopes.
* **Cascade Verification:** The CSS cascade now guarantees that all glass surfaces maintain flat surfaces with zero drop-shadows, matching Runway's clean dark-aesthetic standard.

---

## 2. Before / After Evidence with File Paths and Line Numbers

### 2.1 `src/app/globals.css`

* **Before (Duplicate Conflict at Line 447):**
  ```css
  /* Line 349 */
  --glass-raised-box-shadow: none;

  /* Line 447 (conflicting override) */
  --flow-panel-border-radius: var(--panel-border-radius, 8px);
  --glass-raised-box-shadow: 0 16px 32px -8px rgba(0,0,0,.4);
  --ogb-account-switcher-block-size: 2.5rem;
  ```

* **After (Sole Authoritative Declaration at Line 349):**
  ```css
  /* Line 349 */
  --glass-raised-box-shadow: none;

  /* Lines 446-449 (line 447 pruned) */
  --flow-menu-panel-min-width: 12rem;
  --flow-panel-border-radius: var(--panel-border-radius, 8px);
  --ogb-account-switcher-block-size: 2.5rem;
  ```

### 2.2 `scripts/ui-check.cjs`

* **Rule U1 Before:**
  ```javascript
  { id: 'U1', desc: 'raw color literal (#hex, rgb(), hsl()) outside token files', ext: /\.(jsx?|tsx?|css)$/,
    skip: (r) => TOKEN_FILES.some((t) => r.includes(t)),
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?)\(\s*\d/g },
  ```
* **Rule U1 After (Modern CSS Color 4 `oklch()` & `oklab()` Support):**
  ```javascript
  { id: 'U1', desc: 'raw color literal (#hex, rgb(), hsl(), oklch(), oklab()) outside token files', ext: /\.(jsx?|tsx?|css)$/,
    skip: (r) => TOKEN_FILES.some((t) => r.includes(t)),
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?)\(\s*\d|\b(?:oklch|oklab)\(/g },
  ```

* **Rule U4 Before:**
  ```javascript
  { id: 'U4', desc: 'fetch( inside components/ (use the API client or a hook)', ext: /\.(jsx?|tsx?)$/,
    only: (r) => /(^|\/)components\//.test(r), re: /\bfetch\s*\(/g },
  ```
* **Rule U4 After (Expanded to `components/`, `features/`, and `widgets/`):**
  ```javascript
  { id: 'U4', desc: 'fetch( inside components/, features/, or widgets/ (use the API client or a hook)', ext: /\.(jsx?|tsx?)$/,
    only: (r) => /(^|\/)(components|features|widgets)\//.test(r), re: /\bfetch\s*\(/g },
  ```

### 2.3 `ui-baseline.json`

To prevent regression while avoiding false positives on pre-existing code, the newly detected legacy violations were recorded:
* **U1 Baseline Addition:**
  * Added 1 violation for `NewElementCardKrea.jsx:14`: `oklch(26.9%_0_0)`.
  * Baseline entry: `"U1|src/components/cinema-studio/elements/NewElementCardKrea.jsx": 4` (was 3).
  * Total U1 baseline: 448.
* **U4 Baseline Additions (Pre-existing service-layer fetch calls):**
  * `"U4|src/features/characters/services/characterService.js": 1`
  * `"U4|src/features/prompt-bar/providers/ltx/ltxClient.js": 2`
  * `"U4|src/features/workflows/services/ElementVisionService.js": 5`
  * Total U4 baseline: 8.

### 2.4 Dedicated Ratchet Unit Tests (`src/shared/__tests__/uiCheckRules.test.js`)

A dedicated test suite was added to verify rule detection mechanics:
* 8 tests covering:
  - Standard hex code detection (`#282a2c`, `#fff`).
  - RGB/RGBA and HSL/HSLA detection.
  - CSS Color 4 `oklch()` literals.
  - CSS Color 4 `oklab()` literals.
  - Raw `fetch()` detection across `components/`, `features/`, `widgets/`.
  - Negative matching for safe identifiers (`refetch()`, `useQuery({ refetch })`).
  - Directory inclusion filters for target slices.
  - Directory exclusion for non-target slices (`services/`, `lib/`).

---

## 3. Button Primitive Variant Migration Analysis

An AST and grep inventory of all 49 variants declared in `src/shared/ui/button.jsx` across all JSX callers in `src/` yielded the following usage breakdown:

### 3.1 Active Canonical Presentation Variants (11 variants, 146 total usages)
| Variant | Usages | Purpose / Canonical Role |
|---|---|---|
| `ghost` | 73 | Secondary actions, icon buttons, toolbar triggers, flat buttons |
| `secondary` | 15 | Surface-elevated secondary buttons (`bg-white/10`) |
| `white` | 14 | High-contrast white solid CTA buttons |
| `neon` | 12 | Brand accent highlight buttons (`#ccff00`) |
| `outline` | 11 | Outlined actions with hairline border |
| `default` | 8 | Primary solid action button (`bg-primary text-primary-foreground`) |
| `pill` | 6 | Rounded-full chip / pill buttons |
| `danger` | 3 | Destructive actions (`bg-destructive/10 text-destructive`) |
| `destructive-filled` | 1 | High-emphasis destructive action (`bg-destructive text-white`) |
| `pill-active` | 1 | Active state indicator for pill buttons |
| `link` | 1 | Inline text-anchor styled button |

### 3.2 Active Legacy Aliases (8 variants, 26 total usages)
| Legacy Variant | Usages | Canonical Target Equivalent | Recommendation |
|---|---|---|---|
| `studio-ghost` | 6 | `variant="ghost"` | Codemod to `ghost` |
| `primary` | 5 | `variant="default"` | Codemod to `default` |
| `destructive` | 4 | `variant="danger"` | Codemod to `danger` |
| `ghost-destructive` | 3 | `variant="ghost" className="text-destructive"` | Codemod to `ghost` + text token |
| `studio-white` | 3 | `variant="white"` | Codemod to `white` |
| `studio-normal` | 3 | `variant="secondary"` | Codemod to `secondary` |
| `groupBtn` | 1 | `<ButtonGroup>` child button | Codemod to standard button in `<ButtonGroup>` |
| `flow-generate` | 1 | Feature-specific generation button | Extract to feature-level component |

### 3.3 Dead / Zero-Caller Variants (30 variants, 0 total usages)
The following 30 variants have **0 usages** across the entire application:
* **Studio Tile & Toggle Aliases (12):** `studio-node-thumb`, `studio-option-tile`, `studio-tab`, `studio-tab-active`, `studio-toggle`, `studio-toggle-active`, `studio-toggle-mixed`, `studio-generate`, `studio-generate-icon`, `studio-segmented`, `studio-compact`, `studio-tool`.
* **Flow Form & Camera Aliases (18):** `flow-compact`, `flow-tab`, `flow-tab-active`, `flow-toggle`, `flow-toggle-active`, `flow-toggle-mixed`, `flow-ratio`, `flow-ratio-active`, `flow-resolution`, `flow-resolution-active`, `flow-camera`, `flow-camera-active`, `flow-camera-motion`, `flow-camera-motion-active`, `flow-color`, `flow-color-active`, `flow-style`, `flow-style-active`.

### 3.4 Migration Strategy
1. **Phase A (Zero-Risk Dead Variant Pruning):** In a subsequent cleanup phase, remove the 30 zero-usage variants from `cva` in `button.jsx`. This immediately reduces component complexity by 60% with zero caller impact.
2. **Phase B (Alias Codemod):** Execute targeted single-line codemods replacing the 25 legacy alias call sites with their canonical equivalents.
3. **Phase C (Compound Button Extraction):** Move `flow-generate` (the only feature-level button style) to `src/features/prompt-bar/ui/FlowGenerateButton.jsx` to keep the shared primitive 100% agnostic.

---

## 4. Updated Component Specification Matrix

The Design System documentation in `design.md` has been upgraded to a strict **3-Layer Token Hierarchy**:
1. **Primitive Tokens:** Absolute geometry scale (`sharp` = 4px, `subtle` = 6px, `comfortable` = 8px, `generous` = 16px, `full` = 9999px).
2. **Component Mapping:** Semantic radius tokens assigned to individual UI components.
3. **Implementation Mapping:** CSS variables and Tailwind utility classes (`rounded-sm`, `rounded-lg`, `rounded-2xl`, `rounded-full`).

### Comprehensive Component Specification Catalog (16 Components)

| Component | Primitive Radius | Tailwind Class | Padding Rules | Internal Spacing | Height / Sizing | Border & Elevation |
|---|---|---|---|---|---|---|
| **`<Button />`** | `sharp` (4px) / `full` (9999px) | `rounded-sm` / `rounded-full` | `default`: `px-4 py-2`<br/>`sm`: `px-3 py-1.5`<br/>`lg`: `px-6 py-3`<br/>`icon`: `p-2` | `gap-2` | `sm`: 32px (h-8)<br/>`default`: 40px (h-10)<br/>`lg`: 48px (h-12)<br/>`icon`: 36x36px | `shadow-none`; hairline border on `outline`/`secondary` |
| **`<ButtonGroup />`** | `sharp` (4px) / `full` (9999px) | `rounded-sm` / `rounded-full` | `p-1` container padding | `gap-0.5` | `max-w-fit`, height follows children | `border-none shadow-none` |
| **`<Input />`** | `sharp` (4px) | `rounded-sm` | `default`: `px-3 py-2`<br/>`search`: `px-2.5`<br/>`blur`: `pl-3.5 pr-2.5 py-0.5` | `gap-2` | `search`: 42px<br/>`blur`: 36px<br/>`default`: 52px stack | Hairline `border-white/5`, `shadow-none` |
| **`<Textarea />`** | `comfortable` (8px) / `sharp` (4px) | `rounded-lg` / `rounded-sm` | `default`: `p-4`<br/>`personality`: `p-3.5 sm:p-4`<br/>`blur`: `p-3` | `gap-1.5` | Dynamic auto-resize (min 160px, max 300px) | Hairline `border-white/8`, `shadow-none` |
| **`<Checkbox />`** | `sharp` (4px) | `rounded-sm` | `p-0` (indicator centered) | N/A | Strict `16x16px` (`size-4`) | Hairline `border-white/20`, checked `bg-white` |
| **`<RadioGroup />`** | `full` (9999px) | `rounded-full` | `p-0` (indicator centered) | `gap-2` item stack | Strict `16x16px` (`size-4`) | Hairline `border-white/20`, indicator `size-2` |
| **`<Slider />`** | `full` (9999px) | `rounded-full` | `p-0` (track & thumb) | N/A | Track: `h-1.5` / `h-1`<br/>Thumb: `16x16px` (`size-4`) | Flat track, solid white thumb with active scale ring |
| **`<Switch />`** | `full` (9999px) | `rounded-full` | `p-0.5` interior | N/A | Root: `w-9 h-5`<br/>Thumb: `16x16px` (`size-4`) | Flat track, thumb translates `translate-x-4` |
| **`<Card />`** | `comfortable` (8px) | `rounded-lg` | Card: `p-0`<br/>Header/Content: `p-6`<br/>Footer: `p-6 pt-0` | `gap-1.5` | Container-driven / grid tile fit | Flat `bg-card`, hairline `border-white/10`, `shadow-none` |
| **`<Badge />`** | `sharp` (4px) / `full` (9999px) | `rounded-sm` / `rounded-full` | `px-2.5 py-0.5` | `gap-1` | Height: ~20px (`text-xs font-semibold`) | Hairline border or solid flat, `shadow-none` |
| **`<Dialog />`** | `generous` (16px) | `rounded-2xl` | `p-6` | `gap-4` | `w-full max-w-lg` | Flat `bg-background`, hairline `border-white/10`, `shadow-none` |
| **`<DropdownMenu />`** | `comfortable` (8px) | `rounded-lg` | Panel: `p-1`<br/>Item: `px-2 py-1.5` | `gap-1` | Panel min-width `8rem`; Item: 32px | Flat `bg-popover`, hairline `border-white/10`, `shadow-none` |
| **`<ContextMenu />`** | `comfortable` (8px) | `rounded-lg` | Panel: `p-1`<br/>Item: `px-2 py-1.5` | `gap-1` | Panel min-width `8rem`; Item: 32px | Flat `bg-popover`, hairline `border-white/10`, `shadow-none` |
| **`<Popover />`** | `comfortable` (8px) | `rounded-lg` | Panel: `p-4` | `gap-2` | `w-72` | Flat `bg-popover`, hairline `border-white/10`, `shadow-none` |
| **`<Tabs />`** | `sharp` (4px) / `full` (9999px) | `rounded-sm` / `rounded-full` | List: `p-1`<br/>Trigger: `px-3 py-1.5`<br/>Content: `p-0` | `gap-1` | List: 36px (h-9); Trigger: 28px (h-7) | Flat `bg-muted`, active `bg-background`, `shadow-none` |
| **`<Tooltip />`** | `sharp` (4px) | `rounded-sm` | `px-3 py-1.5` | `gap-1.5` | Auto fit (`text-xs font-medium`) | Flat `bg-popover`, hairline `border-white/10`, `shadow-none` |

---

## 5. Unspecified Values & Design Clarifications

During component specification formalization, the following decisions were resolved based on canonical Runway patterns:
1. **StudioItemMenu 16px Panel Scope:** Confirmed that `StudioItemMenu` retains `rounded-2xl` (16px) specifically via the compound selector `.flow-menu-panel.mat-mdc-menu-panel`, while all standard `<DropdownMenu>` and `<ContextMenu>` primitives adhere strictly to `rounded-lg` (8px).
2. **Textarea Variant Radii:** Standard forms use `rounded-lg` (`comfortable`), while embedded prompt bar inputs (`blur` variant) utilize `rounded-sm` (`sharp`) to match the surrounding control row geometry.
3. **Pill-shaped Icon Buttons:** Explicitly codified `<Button shape="pill" size="icon">` (`rounded-full`) for circular action buttons, eliminating all call-site radius class overrides.

---

## 6. Comprehensive Validation Results

All four required validation checks have passed with zero errors:

### 6.1 Unit & Integration Test Suite (`npx vitest run`)
* **Test Files:** 124 passed (100%)
* **Total Tests:** 800 passed (100%)
* **Failures:** 0
* **New Tests Added:** 8 unit tests in `src/shared/__tests__/uiCheckRules.test.js` validating U1 and U4 mechanics.

### 6.2 Code Quality & Static Analysis (`npm run lint`)
* **Errors:** 0
* **Warnings:** 229 (pre-existing in legacy features, non-blocking)
* **Exit Code:** 0

### 6.3 Production Compilation (`npm run build`)
* **Engine:** Next.js 16.2.1 (Turbopack)
* **Compilation Time:** 9.1s
* **TypeScript Check:** Passed in 2.2s
* **Static Page Generation:** 14/14 static pages generated successfully in 671ms
* **Total Routes Verified:** 31 routes (all static and dynamic routes compiled without error)
* **Exit Code:** 0

### 6.4 Design System Governance Gate (`npm run ui:check`)
```text
Rule   Now  Baseline  New  Description
U1     443       448    0  raw color literal (#hex, rgb(), hsl(), oklch(), oklab()) outside token files
U2    1066      1258    0  Tailwind arbitrary value (w-[437px], p-[13px], ...)
U3      13        13    0  raw <button> outside the primitives folder (use the Button primitive)
U4       8         8    0  fetch( inside components/, features/, or widgets/ (use the API client or a hook)
U5      94        97    0  inline style={{ }} (use tokens/classes; allowed only for truly dynamic values)
U6       0         0    0  dead radius class (rounded-button, rounded-card, rounded-dialog, rounded-badge, rounded-input)

ui-check: OK (no new violations)
```

---

## 7. Remaining Risks and Recommendations

1. **Dead Button Variants Removal:** As documented in Section 3, 30 variants in `button.jsx` have zero callers. While they cause no runtime bugs, they add unnecessary surface area to the design primitive. A future PR should safely prune them.
2. **Service-Layer API Client Standardization:** The 8 baseline `fetch()` calls in `features/` should be refactored to use the centralized API client or TanStack Query mutations to achieve 0 violations under rule U4.
3. **Adherence to Zero Box-Shadow Law:** With line 447 removed from `globals.css`, developers must ensure no inline or utility-based box-shadows are reintroduced at feature level. Rule U2 and code review should maintain this discipline.
