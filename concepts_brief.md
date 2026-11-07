# Unified Design Tokens & Composite Surface Architecture

* **Author:** Jihad
* **Date:** 2026-11-07

## Overview

This architectural initiative establishes a unified, multi-tier design system for `labveil-app` (Next.js / React 19 / Tailwind CSS v4). It transitions the frontend from ad-hoc inline styling and hardcoded color literals into a three-tier architecture:
1. **Semantic Token Contract:** Centralized CSS variables in `globals.css` registered in `@theme inline` that decouple raw palette values from semantic roles (`--surface-base`, `--surface-elevated`, `--surface-sunken`, `--surface-overlay`, `--border-subtle`, `--content-base`, `--content-muted`), standardizing a 100% dark theme today while enabling automated light-mode switching without touching components. In Tailwind v4, opacity modifiers (`bg-surface-base/50`) operate via native `color-mix`, eliminating legacy channel-splitting hacks.
2. **Structural Layout Primitives:** Headless `Surface` and compound `Card` primitives in `@/shared/ui` with zero React Context (100% React Server Component safe, strictly omitting `"use client"`), `asChild` composition (via Radix Slot), and a first-class bleed zone (`Card.Canvas`) for Cinema Studio media and timeline scrubbers.
3. **Monotonic Ratchet Enforcement:** Upgrading `scripts/ui-check.cjs` with an AST-driven baseline ratchet recording violations as `{ file, rule, count }` (never fragile line numbers). The ratchet strictly forbids raw color literals (`#hex`, `rgb()`), unapproved bracket radiuses (`rounded-[...]`), and raw Tailwind palette utilities (`bg-zinc-*`, `text-white`, `border-white/10`) outside `globals.css` and `shared/ui`, while fully permitting call-site geometry and layout classes (`grid`, `flex`, `aspect-video`, `w-full`).

## Analysis

Seven specialized Goldfish review lenses evaluated this proposal:

1. **YAGNI & Complexity Control (Contrarian Lens):**
   - *Risk:* Abstracting multi-tier tokens for an unlaunched light theme invites speculative design failures.
   - *Resolution:* Map semantic tokens directly to the verified dark theme values currently active in production. Retain identical visual parity before introducing any alternate theme values. Start only with the tones actually utilized in Cinema Studio and Media Library (`base`, `elevated`, `sunken`, `overlay`).
2. **Prop Explosion Anti-Pattern (Tech Debt Lens):**
   - *Risk:* Banning `className` on base components forces callers to request dozens of boolean props (`fullWidth`, `hasBadge`, `paddingSmall`, `isInteractive`).
   - *Resolution:* Strictly allow layout, spacing, and positioning classes at call sites via `cn(surfaceVariants(...), className)` using `tailwind-merge`. The prohibition applies exclusively to raw palette colors, custom borders, and arbitrary radiuses.
3. **DOM Tree and CSS Cascade Invariance (Migration Lens):**
   - *Risk:* Introducing physical `<div>` wrapper elements breaks flex item sizing, CSS Grid coordinates (`subgrid`, `col-span`), and semantic HTML elements.
   - *Resolution:* Equip both `Surface` and `Card` with Radix `asChild` delegation so components can render as semantic `<article>`, `<li>`, or direct flex/grid children without intermediary nodes.
4. **React Server Component (RSC) Compatibility (Ergonomics Lens):**
   - *Risk:* Traditional compound components that rely on React Context or `"use client"` force all cards and static layout surfaces into client-side hydration.
   - *Resolution:* Eliminate React Context entirely. Omit `"use client"` in `card.jsx` and `surface.jsx`. `Card.Header`, `Card.Title`, `Card.Canvas`, `Card.Body`, and `Card.Footer` are pure functional subcomponents styled with CVA and CSS classes, remaining 100% RSC-compatible.
5. **Inventive Catalyst (Uniformity vs. Domain Sovereignty):**
   - *Contradiction:* Cinema Studio and Media Library require custom aspect ratios, floating translucent control bars, and edge-to-edge video scrubbers, which fight standard card padding.
   - *Resolution:* Split the container contract into two zones: an **Invariant Outer Boundary** (`Surface` tone, border, radius) and a **Sovereign Inner Canvas** (`<Card.Canvas>` zero-padding bleed zone) allowing unrestricted feature layout.
6. **Tailwind v4 Native Opacity Interoperability:**
   - *Risk:* Unnecessary legacy space-separated color channel variables increase CSS maintenance.
   - *Resolution:* In Tailwind v4, registering standard hex/color variables under `@theme inline` enables native CSS `color-mix(in oklab, var(--surface-base) <alpha>, transparent)`. Alpha modifiers operate directly out-of-the-box.
7. **Monotonic AST Ratchet & Palette Protection:**
   - *Risk:* A binary regex linter creates hundreds of legacy PR errors or fragile line-number drift. Moreover, banning only hex literals leaves raw palette leaks (`bg-red-500`, `text-white`, `border-white/10`) unaddressed.
   - *Resolution:* Update `scripts/ui-check.cjs` with Babel AST extraction targeting JSX `className`, `cva`, and `cn()` arguments against a committed `{ file, rule, count }` baseline (`ui-check-baseline.json`). Banned patterns include raw hex/rgb, arbitrary brackets, and raw palette color classes.

## Detailed Component Specifications

### 1. Semantic Token Hierarchy (`src/app/globals.css`)

```css
@theme inline {
  /* Surfaces */
  --color-surface-base: #0f1011;
  --color-surface-elevated: #161718;
  --color-surface-sunken: #090a0a;
  --color-surface-overlay: rgba(22, 23, 24, 0.85);

  /* Content / Typography */
  --color-content-base: #f5f5f5;
  --color-content-muted: #8e8e93;
  --color-content-subtle: #636366;

  /* Borders */
  --color-border-subtle: rgba(255, 255, 255, 0.07);
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-border-interactive: rgba(255, 255, 255, 0.25);
}
```

### 2. Structural Primitives API (`src/shared/ui/`)

#### `Surface` (`src/shared/ui/surface.jsx`)
* **Behavior:** Headless container with `asChild` Radix Slot. No React Context, Server-Component safe.
* **Props:**
  - `tone`: `'base' | 'elevated' | 'sunken' | 'overlay'` (default: `'base'`)
  - `radius`: `'none' | 'sm' | 'md' | 'full'` (default: `'md'`)
  - `asChild`: `boolean` (delegates DOM node to child element)
  - `className`: Consumer layout classes merged via `twMerge`

#### `Card` (`src/shared/ui/card.jsx`)
* **Behavior:** Compound semantic layout container built on `Surface`. No React Context, Server-Component safe.
* **Compound Elements:**
  - `Card`: Root container with `overflow-hidden` and optional `interactive` hover state.
  - `Card.Header`: `flex items-center justify-between px-4 py-3 border-b border-border-subtle/50`.
  - `Card.Title`: `text-sm font-medium text-content-base`.
  - `Card.Canvas`: **Zero-padding Bleed Zone** (`relative w-full overflow-hidden bg-surface-sunken`) for aspect-ratio video, image previews, and floating toolbars.
  - `Card.Body`: `p-4 flex-1`.
  - `Card.Footer`: `flex items-center justify-between px-4 py-3 border-t border-border-subtle/50 bg-surface-sunken/40`.

### 3. Automated Ratchet Invariants (`scripts/ui-check.cjs`)

* **New Rule U8 (Raw Palette Utility Violation):**
  - Forbids direct usage of standard Tailwind palette classes (`bg-zinc-*`, `bg-gray-*`, `text-white`, `text-black`, `border-white/10`, `bg-red-500`) outside `globals.css` and `src/shared/ui/`.
  - Consumers must use semantic tokens: `bg-surface-*`, `text-content-*`, `border-border-*`.
* **Baseline Schema:**
  - Stored in `ui-baseline.json` as a map of `{ "RULE|relative_path": count }`.
  - Monotonic invariant: Any file edit must maintain or decrease its baseline violation count; net-new files in `features/` or `widgets/` must have 0 violations.

### 4. Migration & Verification Protocol

1. **Pre-Migration Visual Snapshot:** Capture baseline screenshots of `/cinema-studio` and `/assets`.
2. **Phase 1 (Tokens & Primitives):** Commit `globals.css` tokens, `surface.jsx`, and `card.jsx`. Run `npm run ui:check`.
3. **Phase 2 (Canary Feature Slices):**
   - Refactor `src/features/media/ui/MediaItem.jsx` (or equivalent grid card) to use `<Card>` and `<Card.Canvas>`.
   - Refactor Cinema Studio panels to `<Surface tone="elevated">`.
4. **Post-Migration Parity Verification:** Compare visual rendered output against pre-migration snapshots to guarantee 100% pixel parity.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Define semantic surface, border, and text tokens in `src/app/globals.css` matching active dark theme values.
  - Implement `@/shared/ui/surface.jsx` with CVA, Radix `Slot` (`asChild`), and semantic tones (`base`, `elevated`, `sunken`, `overlay`) without `"use client"`.
  - Implement `@/shared/ui/card.jsx` composite with compound subcomponents (`Card.Header`, `Card.Title`, `Card.Canvas`, `Card.Body`, `Card.Footer`) without `"use client"`.
  - Add Rule U8 to `scripts/ui-check.cjs` with an AST-based parser and committed `{ file, rule, count }` baseline ratchet checking both raw color literals and raw Tailwind palette utilities.
  - Migrate Cinema Studio and Media Library card surfaces with before/after visual parity verification.
* **Out-of-Scope Non-Goals:**
  - **No touching existing 39 primitives:** Existing primitives in `@/shared/ui/` (`button.jsx`, `dialog.jsx`, `input.jsx`, etc.) remain in place with identical export paths. No file relocation to `shared/ui/primitives/`.
  - **No production activation of Light Mode:** Only the semantic token architecture and variable names are prepared; theme switching is deferred.
  - **No `ControlBarShell` in this phase:** The prompt-bar specialized shell is deferred to a subsequent milestone after `Surface` and `Card` stabilize.
  - **No modifications to business logic:** Zero changes to Zustand stores, API queries/mutations, or server-side workflows.

## Alternatives Weighed

* **Pure Component Props System (`<Card header="Title" actions={[...]} />`):**
  - *Rejected by author:* Fails when complex action layouts, timeline scrubbers, or multi-button clusters are required. Creates unmaintainable prop sprawl.
* **Pure Compound Component with React Context:**
  - *Rejected by author:* Forces `"use client"` on all layout shells, defeating React 19 RSC optimizations.
* **Line-Number Based Ratchet Baseline:**
  - *Rejected by author:* Causes immediate CI failures whenever code lines shift due to unrelated edits. Replaced by a resilient `{ file, rule, count }` baseline schema.
* **Relocating Primitives to `src/shared/ui/primitives/`:**
  - *Rejected by author:* High churn breaking imports across dozens of files. Retaining canonical `@/shared/ui/*` paths guarantees 100% backward compatibility.
* **Channel-Splitting Color Tokens for Opacity:**
  - *Rejected by author:* Tailwind v4 natively handles opacity via `color-mix` on registered `@theme` variables; splitting channels adds dead complexity.

## Key Decisions & Staging for Next Steps

* **Stage 0 (Tokens):** Standardize semantic tokens in `globals.css` ensuring visual parity with active dark theme styles and testing native Tailwind v4 `color-mix` alpha modifiers.
* **Stage 1 (Primitives):** Implement `Surface` and `Card` in `@/shared/ui` with `asChild`, CVA, and zero React Context (Server Component safe).
* **Stage 2 (Ratchet):** Update `scripts/ui-check.cjs` with AST parsing for raw palette utilities and implement `{ file, rule, count }` in `ui-check-baseline.json`.
* **Stage 3 (Vertical Slices):** Capture baseline screenshots, refactor `Cinema Studio` and `Media Library` cards to consume `Card` and `Card.Canvas`, and verify visual parity.
* **Stage 4 (Catalog):** Document and render all token and primitive variants in `/dev/ui`.
