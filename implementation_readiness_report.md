# Stage 9: Implementation Readiness Review
**Target Document:** `docs/designs/unified-design-tokens-and-surface-primitives.md`  
**Primary Focus:** `## Detailed Implementation Plan` (Lines 350–394) evaluated against the repository  
**Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`  

---

## 1. Executive Summary & Verdict

### **Verdict: CHANGES REQUIRED**

The technical design document contains high-quality high-level architecture, but the **Detailed Implementation Plan (Phases 1–4, Lines 350–394) cannot be executed as written**. If an engineer follows the plan step-by-step, the implementation will fail at multiple junctures:
1. **Build Failure (Phase 2):** Attempts to import `@radix-ui/react-slot` which does not exist in `package.json` (the repo uses `radix-ui`).
2. **CI Crash & Lockout (Phase 3):** Step 3.2 instructs running `node scripts/ui-check.cjs --init-baseline`, which immediately crashes with exit code 1 because `ui-baseline.json` already exists. Furthermore, `--shrink-baseline` cannot ingest new rules, guaranteeing that Rule U8 will cause 100% of existing legacy code to fail CI.
3. **Severe Visual Regressions (Phase 4):** Refactoring `ElementInfoSidebar.jsx` to `<Surface tone="elevated">` wraps an unstyled, borderless CSS grid column inside a dark, bordered card, breaking the Cinema Studio layout. Similarly, `MediaCard.jsx` has a 1px radius (`rounded-xxxs`) and `bg-surface-card` (#1e1f20), whereas proposed `Card` hardcodes `rounded-md` (6px) and defaults to `elevated` (#161718), making the claimed "0 pixel shift target" impossible.
4. **Token Naming Contradiction (Phase 1):** Steps 1.1 and 1.2 specify `--color-border-*` and `border-border-subtle`, directly contradicting the architecture's own `--line-*` / `--color-line-*` design (intended to prevent stuttering names) and breaking Tailwind utility compilation for the primitives.
5. **Component Prop Collision (Phase 2):** Proposed `Card` hardcodes `"rounded-md"` in its own `className`, which overrides and breaks the `radius` prop passed to `<Surface>` via `cn()`.

---

## 2. Concrete Blockers (Implementation Failure / Build Failure / CI Crash)

### Blocker 1: Step 3.2 Crashes with Fatal Error; Ratchet Cannot Bootstrap Rule U8
* **Plan Text (Step 3.2):**  
  > `Run node scripts/ui-check.cjs --init-baseline or update ui-baseline.json to record existing legacy violation counts under the { "RULE|path": count } schema.`
* **Codebase Reality:**  
  1. `ui-baseline.json` **already exists** in the repository root (138 entries).
  2. Inspecting `scripts/ui-check.cjs` (lines 86–89):
     ```javascript
     if (arg === '--init-baseline') {
       if (fs.existsSync(BASELINE)) {
         console.error('ui-baseline.json already exists. Use --shrink-baseline.');
         return 1;
       }
       ...
     }
     ```
     Running `node scripts/ui-check.cjs --init-baseline` **aborts immediately with exit code 1**.
  3. Inspecting `scripts/lib/ratchet.cjs` (lines 38–45):
     ```javascript
     function shrink(counts, baseline) {
       const out = {};
       for (const [k, allowed] of Object.entries(baseline)) {
         const n = Math.min(allowed, counts[k] || 0);
         if (n > 0) out[k] = n;
       }
       return out;
     }
     ```
     `shrink()` iterates **only over keys already present in `baseline`**. When Rule `U8` is added to `RULES` in `scripts/ui-check.cjs`, no `U8|...` keys exist in `ui-baseline.json`. Running `--shrink-baseline` will completely ignore all `U8` violations.
  4. Consequently, running `npm run ui:check` (the default compare step) will report every existing neutral palette class across the entire codebase as net-new violations (`allowed: 0, found: N`) and permanently fail CI.
* **Required Plan Remediation:**  
  Phase 3 must remove the broken `--init-baseline` instruction and prescribe an exact bootstrapping command or script to merge `U8` violations into `ui-baseline.json` without destroying existing baseline counts for rules `U1`–`U7`. For example:
  ```bash
  node -e "
    const r = require('./scripts/lib/ratchet.cjs');
    const base = r.loadBaseline('./ui-baseline.json') || {};
    // Collect U8 violations and merge keys:
    // base[k] = count
    r.writeBaseline('./ui-baseline.json', base);
  "
  ```

---

### Blocker 2: Step 2.1 Specifies Non-Existent Dependency `@radix-ui/react-slot`
* **Plan Text (Step 2.1 & Line 138):**  
  > `Ensure it uses @radix-ui/react-slot for asChild delegation, cva, and twMerge.`
* **Codebase Reality:**  
  1. Inspect `package.json` (lines 14–35). `@radix-ui/react-slot` is **not installed**.
  2. The package installed is `"radix-ui": "^1.4.3"`.
  3. Inspect the canonical primitive `src/shared/ui/button.jsx` (lines 27, 65):
     ```javascript
     import { Slot } from "radix-ui";
     ...
     const Comp = asChild ? Slot.Root : "button";
     ```
  4. If `surface.jsx` is authored with `import { Slot } from "@radix-ui/react-slot"`, the Next.js build / Turbopack will throw `Module not found: Can't resolve '@radix-ui/react-slot'`.
* **Required Plan Remediation:**  
  Update Step 2.1, Section 2.A (lines 137–172), and Table 384 to explicitly mandate:
  ```javascript
  import { Slot } from "radix-ui";
  ...
  const Comp = asChild ? Slot.Root : "div";
  ```

---

### Blocker 3: Step 1.1 / Table 383 Token Naming Contradiction (`--line-*` vs `--color-border-*`)
* **Plan Text (Step 1.1, Step 1.2, Lines 383, 390):**  
  > Step 1.1: `append the semantic token definitions (--color-surface-*, --color-content-*, --color-border-*) inside @theme inline.`  
  > Step 1.2: `Verify that Tailwind v4 compiles native color-mix utility classes (e.g. bg-surface-base/80, border-border-subtle/50)`  
  > Line 383: `semantic tokens (--color-surface-*, --color-content-*, --color-border-*)`  
  > Line 390: `replace raw border-white/10 examples with semantic border-border-subtle tokens.`
* **Document & Architecture Contradiction:**  
  1. In Section 1 (Architecture, lines 109–128), the document explicitly named the line tokens to avoid stuttering names:
     ```css
     /* Line & Border Tokens (avoids stuttering border-border-*) */
     --line-subtle: rgba(255, 255, 255, 0.07);
     --line-default: rgba(255, 255, 255, 0.12);
     --line-interactive: rgba(255, 255, 255, 0.25);

     @theme inline {
       --color-line-subtle: var(--line-subtle);
       --color-line-default: var(--line-default);
       --color-line-interactive: var(--line-interactive);
     }
     ```
  2. In Section 2, `surfaceVariants` (lines 147–150) and `Card` (lines 206, 222, 259) consume `border-line-subtle`, `border-line-default`, and `hover:border-line-interactive`.
  3. If an engineer follows Phase 1 Step 1.1 and adds `--color-border-subtle`, Tailwind v4 compiles `border-border-subtle`, and all primitive classes (`border-line-subtle`) in Phase 2 become dead, unstyled CSS classes!
* **Required Plan Remediation:**  
  Purge all occurrences of `--color-border-*` and `border-border-subtle` in Step 1.1, Step 1.2, and the Affected Files table (lines 383, 390). Unify entirely around `--color-line-subtle`, `--color-line-default`, `--color-line-interactive` (`border-line-subtle`, `border-line-default`, `border-line-interactive`).

---

### Blocker 4: Step 4.3 Canary Target `ElementInfoSidebar.jsx` Causes Severe Visual Regression
* **Plan Text (Step 4.3, Line 311, Table 393):**  
  > `Refactor Cinema Studio sidebar panel in ElementInfoSidebar.jsx to consume <Surface tone="elevated">.`
* **Codebase Reality:**  
  1. Inspect `src/components/cinema-studio/elements/ElementInfoSidebar.jsx` (lines 102–104):
     ```jsx
     return (
       <div className={cn("lg:col-span-3 xl:col-span-3 flex flex-col gap-4", className)}>
     ```
     `ElementInfoSidebar` is an **unstyled CSS grid column**. It possesses **no background color, no borders, and no border radius**. It is simply a flex container holding form controls (Input, Dropdown, Textareas).
  2. Wrapping this container in `<Surface tone="elevated">` injects:
     `bg-surface-elevated` (#282a2c), `border-line-default` (1px solid border), and `rounded-md` (6px radius).
  3. This introduces an unwanted solid card shell around the entire sidebar form, severely altering the layout and aesthetic of the Cinema Studio editor. It directly violates the "0 pixel shift target" defined in Step 4.4.
  4. In contrast, `src/components/cinema-studio/elements/HowToDrawer.jsx` (line 32) is a true surface container:
     `<motion.div className="... bg-[#121215] border-l border-white/10 p-6 ...">`
     It has a raw hex background, a border, and is already tracked in `ui-baseline.json` (line 12).
* **Required Plan Remediation:**  
  Remove `ElementInfoSidebar.jsx` as the canary target for `<Surface tone="elevated">`. Replace it with a valid container primitive call site such as `HowToDrawer.jsx` (using `Surface` as child or wrapping the drawer panel), or explicitly scope `ElementInfoSidebar`'s refactoring to internal segmented controls rather than the root container.

---

## 3. Major Issues (Architectural Inconsistencies & Regression Risks)

### Major 1: Surface Token Collision with Existing Runway Scale
* **Existing `globals.css` Scale (lines 262–277 & 290–297):**
  ```css
  --surface-canvas: #000000;
  --surface-panel: #131314;
  --surface-processing: #17181a;
  --surface-card: #1e1f20;
  --surface-elevated: #282a2c;
  --surface-highest: #333537;
  ```
  `--color-surface-elevated` is **already defined** as `#282a2c` and consumed in existing primitives (e.g. `src/shared/ui/button.jsx` line 39: `bg-surface-elevated`).
* **Design Doc Collision (lines 98–103):**
  ```css
  --surface-base: #0f1011;
  --surface-elevated: #161718;
  --surface-sunken: #090a0a;
  --surface-overlay: rgba(22, 23, 24, 0.85);
  ```
* **The Conflict:**  
  1. The design doc redefines `--surface-elevated` from `#282a2c` to `#161718`! This silently alters existing components already using `bg-surface-elevated`.
  2. The document introduces a separate 4-tier naming scale (`base`, `elevated`, `sunken`, `overlay`) that conflicts with the established 6-tier Runway scale (`canvas`, `panel`, `processing`, `card`, `elevated`, `highest`).
  3. In Phase 1 Step 1.1, the plan must explicitly document mapping and reconciliation: `surface-base` maps to `--surface-card` (#1e1f20) and `surface-elevated` retains `#282a2c` (or uses a dedicated alias like `surface-container`).

---

### Major 2: Unresolved `radius` Prop Collision in `Card` Primitive
* **Proposed Code in Section 2 (lines 190–208):**
  ```jsx
  const Card = React.forwardRef(function Card(
    { className, variant = "default", interactive, tone, radius = "md", ...props },
    ref
  ) {
    return (
      <Surface
        ref={ref}
        tone={resolvedTone}
        radius={radius}
        className={cn(
          "rounded-md text-content-base ...",
          className
        )}
        {...props}
      />
    );
  });
  ```
* **The Collision:**  
  1. If a caller renders `<Card radius="sm">`, `<Surface>` evaluates `surfaceVariants({ radius: "sm" })` -> `"rounded-sm"`.
  2. But `<Card>` hardcodes `"rounded-md"` in its own `className` passed to `<Surface>`.
  3. Inside `<Surface>`, `cn("rounded-sm", "rounded-md text-content-base ...")` is merged by `tailwind-merge`.
  4. `tailwind-merge` resolves conflicting border radius utilities in favor of the later class (`rounded-md`).
  5. The `radius` prop on `Card` is **completely overridden and disabled**.
* **Required Plan Remediation:**  
  Remove `"rounded-md"` from `Card`'s hardcoded `className`. Border radius must be delegated entirely to `<Surface radius={radius}>`.

---

### Major 3: Visual & Geometry Regressions in Canary Slice 1 (`MediaCard.jsx`)
* **Existing `MediaCard.jsx` State (lines 40–44):**
  - Radius: `rounded-xxxs` (Runway hairline = 1px).
  - Background: `bg-surface-card` (#1e1f20).
  - Footer: `bg-surface-panel border-t border-white/10`.
  - Media container (line 61): `<div className="relative w-full h-full">` (transparent, no background).
* **Proposed Canary Refactor (Step 4.2):**
  - Refactoring to `<Card>` applies default `radius="md"` (6px) and default `tone="elevated"` (#161718 or #282a2c).
  - `<Surface>` variants in `surface.jsx` (lines 152–157) only support `radius: { none, sm, md, full }` — they do not support `xxxs` or `hairline`!
  - Proposed `<Card.Canvas>` hardcodes `bg-surface-sunken` (#090a0a), which injects an unrequested background color into the media viewport.
  - Therefore, migrating `MediaCard.jsx` without updating `Surface` radius variants to support Runway tokens will cause a 5px radius shift and color tone mismatch, directly contradicting the "0 pixel shift target" in Step 4.4.

---

### Major 4: False Assertion of Schema Migration in Goal G4 and Section 3
* **Plan Claims (Lines 29, 298–300, 340, 387):**  
  > `migrate the baseline schema to { file, rule, count } to prevent line-number drift in CI.`
* **Codebase Reality:**  
  `ui-baseline.json` **already uses the `{ "RULE|path": count }` schema** throughout its 138 entries. Line-number baselines do not exist in this repository. Claiming a schema migration obscures the actual task (which is simply adding Rule `U8`).

---

## 4. Minor Issues & Style Nits

1. **Mischaracterization of `ui-check.cjs` as "AST-Driven":**  
   Lines 14, 29, and 365 describe `scripts/ui-check.cjs` as "AST-Driven". In reality, `ui-check.cjs` (lines 61–65) is a line-by-line regex scanner (`lines.forEach`, `l.match(rule.re)`). Calling it AST-driven is inaccurate.
2. **Missing `React.forwardRef` and `cn` in Step 2.1:**  
   Step 2.1 mentions `cva and twMerge`, but fails to mention that `Surface` must use `React.forwardRef` and must import `cn` from `@/shared/lib/utils` (which has custom Runway extensions for `xxxs`, `hairline`, `sharp`, etc.).
3. **Ghost File in Table 380:**  
   `docs/ui-system/usage-rules.md` is listed in Table line 390 as **Modify**, but it is never referenced anywhere in Phases 1–4 of the Detailed Implementation Plan.
4. **Action Mismatch in Table 385:**  
   `src/shared/ui/card.jsx` is marked as `Create/update` in Step 2.2, but the file already exists (104 lines). Table 385 correctly identifies it as `Modify`, but Step 2.2 should state `Update card.jsx`.

---

## 5. Required Action Items Before Approval

Before approving the technical design for implementation, the author must revise `## Detailed Implementation Plan` (Lines 350–394) and related architectural sections:

1. **Phase 1 (Step 1.1 & 1.2):** Replace `--color-border-*` and `border-border-subtle` with `--color-line-subtle`, `--color-line-default`, `--color-line-interactive` (`border-line-subtle`, `border-line-default`, `border-line-interactive`). Document the reconciliation with existing Runway tokens (`--surface-canvas`, `--surface-card`, etc.).
2. **Phase 2 (Step 2.1 & 2.2):**
   - Change imports to `import { Slot } from "radix-ui"` and use `<Slot.Root>`.
   - Remove `"rounded-md"` from `Card`'s `className` to resolve the `radius` prop collision.
   - Add Runway radius variants (`xxxs`, `xs`) to `surfaceVariants` so `MediaCard` can maintain its 1px border radius.
3. **Phase 3 (Step 3.2):** Replace `node scripts/ui-check.cjs --init-baseline` with an explicit script to bootstrap and merge Rule `U8` counts into `ui-baseline.json`.
4. **Phase 4 (Step 4.2 & 4.3):**
   - Replace `ElementInfoSidebar.jsx` with a genuine container surface (e.g. `HowToDrawer.jsx`).
   - Specify explicit props for `MediaCard.jsx` (`<Card radius="xxxs" tone="card">`) to guarantee true zero-visual-shift parity.
5. **Affected Files Table (Lines 380–394):** Align all token references, component actions, and schema descriptions with the real repository state.
