# Unified Design Tokens & Composite Surface Architecture

* **Author:** Jihad
* **Status:** Draft
* **Date:** 2026-11-07

--------------------------------------------------------------------------------

## Overview

This architectural initiative establishes a canonical, three-tier design system foundation for `labveil-app` (Next.js / React 19 / Tailwind CSS v4). It replaces ad-hoc inline styling, hardcoded hex/rgb color literals, and duplicated component wrappers with:
1. **A Single-Source Semantic Token Contract** in `globals.css` registered under Tailwind v4 `@theme inline`, standardizing a 100% dark theme today while guaranteeing zero-component-touch light mode switching in the future.
2. **Headless & Composite Layout Primitives** (`Surface` and compound `Card`) in `@/shared/ui` with zero React Context (100% React Server Component safe), Radix `asChild` composition, and a dedicated zero-padding bleed zone (`Card.Canvas`) for media viewports and timeline scrubbers.
3. **AST-Driven Monotonic Ratchet Enforcement** in `scripts/ui-check.cjs` that strictly forbids raw palette color classes and unapproved arbitrary brackets outside `globals.css` and `shared/ui`, backed by a resilient `{ file, rule, count }` baseline.

## The Problem

Today, developers building new features (such as Cinema Studio views, generation grids, or prompt bar controls) repeatedly author custom Tailwind layouts from scratch. This introduces several architectural deficiencies:
* **Token Fragmentation & Hardcoded Literals:** Colors like `#161718`, `#0f1011`, and `rgba(255,255,255,0.05)` are scattered across feature files. Because these colors are hardcoded rather than bound to semantic roles (`--surface-base`, `--surface-elevated`, `--border-subtle`), switching to a future light theme or altering design themes would require touching hundreds of call sites.
* **Component Prop Sprawl vs. Compositional Dead-Ends:** When teams attempt to standardize cards, they either create monolithic components with dozens of rigid boolean props (`hasBadge`, `paddingSmall`, `isInteractive`) or bypass base components completely with custom `<div>` soup.
* **Domain Rigidity in Specialized Views:** Cinema Studio and the Media Library require edge-to-edge media previews, floating toolbars, and timeline scrubbers. Standard padded containers force developers to write negative margins (`-m-4`) or abandon the design system.
* **Linter Bypass & False Positives:** Previous checks either failed on valid geometry classes (`w-full`, `aspect-video`) or allowed raw palette leaks (`bg-zinc-900`, `text-white`, `border-white/10`) to bypass quality gates.

## Goals

* **G1: Unified Semantic Token Architecture:** Define semantic CSS variables in `globals.css` under `@theme inline` covering surfaces (`base`, `elevated`, `sunken`, `overlay`), typography (`content-base`, `content-muted`, `content-subtle`), and borders (`subtle`, `default`, `interactive`), matching active dark theme values with 100% visual parity.
* **G2: Server Component Safe Layout Primitives:** Implement `@/shared/ui/surface.jsx` and `@/shared/ui/card.jsx` without `"use client"` or React Context, supporting Radix `asChild` delegation and consumer layout class overrides via `tailwind-merge`.
* **G3: Sovereign Media Bleed Zone:** Implement `<Card.Canvas>` within `Card` providing a zero-padding container for aspect-ratio video, canvas overlays, and timeline scrubbers without hacking outer card boundaries.
* **G4: AST-Driven Monotonic Ratchet:** Upgrade `scripts/ui-check.cjs` with Rule `U8` (banning raw Tailwind palette classes outside token/primitive files) and migrate the baseline schema to `{ file, rule, count }` to prevent line-number drift in CI.
* **G5: Verified Canary Migration:** Refactor `Cinema Studio` panels and `Media Library` cards to consume the new primitives with before/after visual parity verified via screenshots.

## Non-Goals

* **NG1: No Changes to Existing 39 Primitives:** All existing components in `src/shared/ui/` (`button.jsx`, `dialog.jsx`, `input.jsx`, `select.jsx`, etc.) remain in their current directory and retain identical export signatures. No moving files into `shared/ui/primitives/`.
* **NG2: No Production Activation of Light Mode:** Only the semantic token architecture and variable names are prepared. Activating or redesigning the light theme in production is deferred to a future initiative.
* **NG3: No Specialized ControlBarShell:** The specialized Prompt Bar control bar shell is deferred to a subsequent milestone after `Surface` and `Card` stabilize.
* **NG4: No Domain Business Logic Changes:** Zero modifications to Zustand stores, React Query hooks, server actions, or data schemas.

## Critical User Journeys (CUJs)

### CUJ 1: Developer Assembles a Standard Content Card
* **Given**: A developer building a new settings panel, folder card, or project summary.
* **When**: The developer imports `Card` from `@/shared/ui/card` and structures `<Card><Card.Header><Card.Title>Title</Card.Title></Card.Header><Card.Body>Content</Card.Body></Card>`.
* **Then**: The card renders with canonical border radius (`rounded-md`), semantic elevated background, and subtle border. No custom CSS or raw color classes are written. `npm run ui:check` passes with zero violations.

### CUJ 2: Cinema Studio Engineer Implements Media Preview with Floating Controls
* **Given**: An engineer implementing an interactive 16:9 video player with a timeline scrubber and floating actions in Cinema Studio.
* **When**: The engineer wraps the media in `<Card.Canvas className="aspect-video bg-black">` and places the timeline inside `<Card.Canvas>` while using `<Card.Body>` for generation metadata.
* **Then**: The video bleeds cleanly edge-to-edge without negative margins or broken borders. The outer card preserves theme invariants, while the inner canvas retains full layout freedom.

### CUJ 3: Automated Ratchet Prevents Raw Palette Leaks in CI
* **Given**: A developer attempts to add `<div className="bg-zinc-900 text-white border-white/10">` in a feature component.
* **When**: `npm run ui:check` executes locally or in CI.
* **Then**: Rule `U8` flags the commit, identifying the raw palette utilities and prompting the developer to replace them with `bg-surface-elevated`, `text-content-base`, and `border-border-subtle`.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### Architectural Overview

The architecture implements a strict three-tier hierarchy enforcing boundary insulation between tokens, primitives, and domain feature modules:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: SEMANTIC TOKEN CONTRACT (src/app/globals.css)                  │
│ Registered via Tailwind v4 @theme inline                              │
│ --color-surface-base        --color-surface-elevated                   │
│ --color-surface-sunken      --color-surface-overlay                    │
│ --color-content-base        --color-content-muted                      │
│ --color-border-subtle       --color-border-default                     │
│ Native opacity via CSS color-mix (e.g. bg-surface-base/50)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes tokens
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 2: STRUCTURAL LAYOUT PRIMITIVES (src/shared/ui/)                  │
│ • Surface (Headless CVA container + Radix asChild)                     │
│ • Card (RSC compound: Header, Title, Canvas, Body, Footer)             │
│ Rules: Zero React Context • Zero "use client" • twMerge className     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes primitives
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 3: DOMAIN FEATURE COMPOSITES (src/features/ & src/widgets/)        │
│ • Cinema Studio: StudioPanel (Surface), MediaGridItem (Card + Canvas)  │
│ • Media Library: MediaItemCard (Card + Canvas bleed zone)              │
│ Zero raw hex • Zero raw palette colors (enforced by scripts/ui-check)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Token Specification (`src/app/globals.css`)

Tokens are mapped into the Tailwind v4 inline theme. In Tailwind v4, standard color values registered in `@theme inline` automatically participate in native CSS `color-mix`, ensuring slash-opacity (`bg-surface-base/80`, `border-border-subtle/50`) functions out of the box without legacy space-separated RGB channel variables.

```css
@theme inline {
  /* Surface Layers */
  --color-surface-base: #0f1011;
  --color-surface-elevated: #161718;
  --color-surface-sunken: #090a0a;
  --color-surface-overlay: rgba(22, 23, 24, 0.85);

  /* Content & Typography */
  --color-content-base: #f5f5f5;
  --color-content-muted: #8e8e93;
  --color-content-subtle: #636366;

  /* Borders & Dividers */
  --color-border-subtle: rgba(255, 255, 255, 0.07);
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-border-interactive: rgba(255, 255, 255, 0.25);
}
```

### 2. Primitive Implementations (`src/shared/ui/`)

#### A. Headless `Surface` (`src/shared/ui/surface.jsx`)
`Surface` provides the baseline geometric container. It utilizes `class-variance-authority` (CVA) for variant resolution and `@radix-ui/react-slot` for `asChild` delegation. It deliberately contains no state, hooks, or React Context, ensuring zero RSC hydration penalty.

```jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const surfaceVariants = cva(
  "transition-colors duration-150 border",
  {
    variants: {
      tone: {
        base: "bg-surface-base text-content-base border-border-subtle",
        elevated: "bg-surface-elevated text-content-base border-border-default",
        sunken: "bg-surface-sunken text-content-base border-border-subtle",
        overlay: "bg-surface-overlay text-content-base border-border-default backdrop-blur-md",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      tone: "base",
      radius: "md",
    },
  }
);

export const Surface = React.forwardRef(function Surface(
  { className, tone, radius, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn(surfaceVariants({ tone, radius }), className)}
      {...props}
    />
  );
});
Surface.displayName = "Surface";
```

#### B. Compound `Card` (`src/shared/ui/card.jsx`)
`Card` is built directly on top of `Surface`. It exports functional layout compound components without React Context. Calling `<Card className="p-4">Content</Card>` functions as an all-in-one container, while structured views compose subcomponents.

```jsx
import * as React from "react";
import { Surface } from "./surface";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Card({ className, interactive, tone = "elevated", radius = "md", ...props }) {
  return (
    <Surface
      tone={tone}
      radius={radius}
      className={cn(
        "flex flex-col overflow-hidden relative",
        interactive && "cursor-pointer hover:border-border-interactive transition-colors active:scale-[0.995]",
        className
      )}
      {...props}
    />
  );
}

Card.Header = function CardHeader({ className, ...props }) {
  return <div className={cn("flex items-center justify-between px-4 py-3 border-b border-border-subtle/50 gap-2 shrink-0", className)} {...props} />;
};

Card.Title = function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-sm font-medium tracking-tight text-content-base", className)} {...props} />;
};

Card.Canvas = function CardCanvas({ className, ...props }) {
  // Edge-to-edge bleed zone with zero padding for video, WebGL, or scrubbers
  return <div className={cn("relative w-full overflow-hidden bg-surface-sunken", className)} {...props} />;
};

Card.Body = function CardBody({ className, ...props }) {
  return <div className={cn("p-4 flex-1", className)} {...props} />;
};

Card.Footer = function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center justify-between px-4 py-3 border-t border-border-subtle/50 bg-surface-sunken/40 shrink-0", className)} {...props} />;
};
```

### 3. Automated Ratchet Enforcement (`scripts/ui-check.cjs`)

The existing ratchet is enhanced with an explicit check for raw Tailwind color palette utilities outside token/primitive definitions:

* **Rule `U8` (Raw Palette Utility Violation):**
  - **Pattern:** Class tokens matching `\b(bg|text|border|ring|fill|stroke)-(zinc|gray|neutral|red|blue|amber|slate|stone|white|black)(?:-\d+)?(?:\/\d+)?\b`.
  - **Allowed Scope:** Excluded inside `src/app/globals.css` and `src/shared/ui/`.
  - **Remediation:** Developers must replace raw palette classes with semantic tokens (`bg-surface-elevated`, `text-content-muted`, `border-border-subtle`).
* **Resilient Baseline Schema:**
  - `ui-baseline.json` stores violation records by `{ "RULE_ID|relative/file/path.jsx": count }`.
  - Storing count per rule and file guarantees that adding or removing lines elsewhere in a file does not produce false CI failures.

### 4. Vertical-Slice Migration Strategy

The migration executes canary vertical slices with visual regression verification:

```text
[Baseline Capture]  ──>  [Deploy Tokens & Primitives]  ──>  [Canary Feature Refactor]  ──>  [Visual Parity Diff]
Take screenshots of       Add variables to globals.css      1. Media Library Item Grid      Compare rendered pixels
/cinema-studio and        Add surface.jsx & card.jsx        2. Cinema Studio Right Panel    against baseline shots
/assets in dev browser    Pass npm run ui:check             Verify zero broken selectors    (0 pixel shift target)
```

--------------------------------------------------------------------------------

## Alternatives Considered

### 1. Pure Prop-Driven Monolithic Components (`<Card header="..." footer="..." />`)
* **Description:** Constructing a single configurable `<Card>` component that accepts data and callback props for headers, badges, actions, and media.
* **Pros:** Highly uniform visual output; minimal boilerplate when cards only display standard text.
* **Cons:** Unmaintainable prop sprawl as features demand specialized layouts (`headerActionsLeft`, `headerActionsRight`, `showScrubber`, `footerVariant`). Makes edge-to-edge canvas previews and custom toolbar placements nearly impossible without hacky escape hatches.
* **Reason for Rejection:** *Rejected by author:* Induces severe prop explosion. In complex creative suites like Cinema Studio, composition (`children` and compound slots) provides vastly superior ergonomic flexibility compared to parameterized monoliths.

### 2. Compound Components Utilizing React Context (`createContext`)
* **Description:** Sharing state and theme configuration between `<Card>`, `<Card.Header>`, and `<Card.Body>` using an internal React Context Provider.
* **Pros:** Allows child components to infer parent orientation, density, or variant automatically.
* **Cons:** Requires adding the `"use client"` directive to all layout wrappers, forcing static pages, dashboard grids, and read-only cards into client-side JavaScript hydration bundles in React 19 / Next.js App Router.
* **Reason for Rejection:** *Rejected by author:* Violates React Server Component (RSC) performance and architecture goals. The hybrid approach (pure functional compound subcomponents without Context) achieves identical visual composition while executing cleanly on the server.

### 3. File Relocation to `src/shared/ui/primitives/` and `src/shared/ui/layout/`
* **Description:** Reorganizing `@/shared/ui/` into explicit subdirectories (`primitives/button.jsx`, `layout/card.jsx`).
* **Pros:** Aesthetic folder cleanliness separating basic controls from layout containers.
* **Cons:** High churn breaking existing imports across 140+ directories in `src/features/`, `src/widgets/`, and `src/views/`. Requires either massive alias rewrites or complex dual-barrel re-exports.
* **Reason for Rejection:** *Rejected by author:* High blast-radius with zero runtime benefit. Preserving flat, canonical paths (`@/shared/ui/button`, `@/shared/ui/card`) guarantees 100% backward compatibility.

### 4. Line-Number Based Linter Baseline
* **Description:** Storing known legacy styling violations by line number (e.g., `src/features/media.jsx:42`).
* **Pros:** Easy to generate directly from line-by-line grep output.
* **Cons:** Extremely fragile. Any pull request that inserts or deletes a line of code shifts line numbers across the remainder of the file, producing spurious CI failures on completely untouched code.
* **Reason for Rejection:** *Rejected by author:* High developer friction and false CI alarms. A file-and-rule count schema (`{ "RULE_ID|path": count }`) is robust against line shifts while strictly guaranteeing that net-new violations are rejected.

### 5. Channel-Splitting Color Tokens for Opacity (`--surface-base: 15 16 17;`)
* **Description:** Splitting RGB or HSL channels into separate numeric tokens to support Tailwind v3 opacity syntax (`rgb(var(--surface-base) / 0.5)`).
* **Pros:** Standard approach in Tailwind v3 design systems.
* **Cons:** Unwieldy CSS variables that do not represent valid color values in browser devtools or standard CSS color previews.
* **Reason for Rejection:** *Rejected by author:* Obsolete in Tailwind CSS v4. Registering standard hex/rgba tokens under `@theme inline` enables modern native `color-mix(in oklab, var(--color) <alpha>, transparent)` without variable decomposition.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

The implementation follows a staged rollout where foundational tokens and primitives are deployed and verified before touching any feature code.

### Phase 1: Semantic Token Contract & Opacity Verification
* **Step 1.1**: Open [globals.css](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css) and append the semantic token definitions (`--color-surface-*`, `--color-content-*`, `--color-border-*`) inside `@theme inline`.
* **Step 1.2**: Verify that Tailwind v4 compiles native `color-mix` utility classes (e.g. `bg-surface-base/80`, `border-border-subtle/50`) without CSS build warnings.
* **Step 1.3**: Update [tokens.md](file:///C:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/tokens.md) to document the semantic variables and their designated use cases.

### Phase 2: Core Primitives Construction
* **Step 2.1**: Create [surface.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/surface.jsx) exporting `Surface` and `surfaceVariants`. Ensure it uses `@radix-ui/react-slot` for `asChild` delegation, `cva`, and `twMerge`. Verify it contains NO `"use client"` or React Context.
* **Step 2.2**: Create/update [card.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx) exporting `Card`, `Card.Header`, `Card.Title`, `Card.Canvas`, `Card.Body`, and `Card.Footer`. Verify `Card.Canvas` applies zero padding and relative positioning for aspect-ratio media bleeds.
* **Step 2.3**: Update [components.md](file:///C:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/components.md) with API specs and code examples for `Surface` and `Card`.
* **Step 2.4**: Add a dedicated showcase section in [dev/ui/page.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx) rendering all `Surface` tones and `Card` configurations.

### Phase 3: AST Ratchet & Palette Enforcement Upgrade
* **Step 3.1**: Update [ui-check.cjs](file:///C:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs) to introduce Rule `U8` (forbidding raw Tailwind palette classes `bg-zinc-*`, `text-white`, `border-white/10` outside token and primitive directories).
* **Step 3.2**: Run `node scripts/ui-check.cjs --init-baseline` or update `ui-baseline.json` to record existing legacy violation counts under the `{ "RULE|path": count }` schema.
* **Step 3.3**: Verify that running `npm run ui:check` passes on existing files and fails when a test file introduces a net-new raw palette utility.

### Phase 4: Canary Migration & Visual Parity Verification
* **Step 4.1**: Capture baseline screenshots of `/cinema-studio` and `/assets` in the local development browser.
* **Step 4.2**: Refactor [CoreMediaItemView](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/index.jsx) in the Media Library to consume `<Card>` and `<Card.Canvas>`.
* **Step 4.3**: Refactor Cinema Studio panels in [src/components/cinema-studio/](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/) to consume `<Surface tone="elevated">`.
* **Step 4.4**: Capture post-refactor screenshots and perform a pixel-level comparison against baseline shots. Verify 100% visual parity with zero layout shifts.
* **Step 4.5**: Execute `npm run ui:check --shrink-baseline` to ratify the migration progress and lock in the reduced violation count.

---

### Enumeration of Affected Files

| File Path | Action | Rationale |
| :--- | :--- | :--- |
| `src/app/globals.css` | **Modify** | Central declaration of semantic tokens (`--color-surface-*`, `--color-content-*`, `--color-border-*`) inside `@theme inline` with native Tailwind v4 `color-mix` opacity support. |
| `src/shared/ui/surface.jsx` | **Create** | Headless geometric container implementing `asChild` and semantic tones without React Context (100% Server Component safe). |
| `src/shared/ui/card.jsx` | **Create / Update** | Canonical composite card container exporting pure functional compound parts (`Header`, `Title`, `Canvas`, `Body`, `Footer`) with zero-padding media bleed support. |
| `scripts/ui-check.cjs` | **Modify** | Introduces Rule `U8` to prevent raw palette utilities from bypassing quality checks, operating against a committed `{ file, rule, count }` baseline. |
| `ui-baseline.json` | **Modify** | Locks in the legacy baseline counts under the resilient file-and-rule schema, ensuring net-new files in features are strictly 100% compliant. |
| `docs/ui-system/tokens.md` | **Modify** | Documents the new semantic surface, content, and border tokens for engineering team onboarding. |
| `docs/ui-system/components.md` | **Modify** | Documents `Surface` and `Card` component APIs, compound usage patterns, and the zero call-site restyling rules. |
| `src/app/dev/ui/page.jsx` | **Modify** | Provides an interactive visual playground rendering all tone and layout combinations for manual and automated visual inspection. |
| `src/widgets/CoreMediaItemView/index.jsx` | **Modify** | Canary vertical slice 1: migrates media library grid cards to `<Card>` and `<Card.Canvas>`. |
| `src/components/cinema-studio/common/index.jsx` | **Modify** | Canary vertical slice 2: migrates studio side panels to `<Surface tone="elevated">`. |
