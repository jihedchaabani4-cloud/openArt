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
* **Then**: The card renders with canonical border radius (`rounded-md`), semantic elevated background, and subtle line border. No custom CSS or raw color classes are written. `npm run ui:check` passes with zero violations.

### CUJ 2: Cinema Studio Engineer Implements Media Preview with Floating Controls
* **Given**: An engineer implementing an interactive 16:9 video player with a timeline scrubber and floating actions in Cinema Studio.
* **When**: The engineer wraps the media in `<Card.Canvas className="aspect-video">` and places the timeline inside `<Card.Canvas>` while using `<Card.Body>` for generation metadata.
* **Then**: The video bleeds cleanly edge-to-edge without negative margins or broken borders. The outer card preserves theme invariants, while the inner canvas retains full layout freedom.

### CUJ 3: Automated Ratchet Prevents Raw Palette Leaks in CI
* **Given**: A developer attempts to add `<div className="bg-zinc-900 text-white border-white/10">` in a feature component.
* **When**: `npm run ui:check` executes locally or in CI.
* **Then**: Rule `U8` flags the commit, identifying the raw palette utilities and prompting the developer to replace them with `bg-surface-elevated`, `text-content-base`, and `border-line-subtle`.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### Architectural Overview

The architecture implements a strict three-tier hierarchy enforcing boundary insulation between tokens, primitives, and domain feature modules:

> *Rule of thumb: Use `Surface` for atomic structural framing, toolbars, and layout panes that manage their own internal geometry. Use `Card` whenever content is partitioned into discrete header, canvas, body, or footer zones.*

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: SEMANTIC TOKEN CONTRACT (src/app/globals.css)                  │
│ Registered via Tailwind v4 @theme inline linked to :root variables     │
│ --color-surface-base        --color-surface-elevated                   │
│ --color-surface-sunken      --color-surface-overlay                    │
│ --color-content-base        --color-content-muted                      │
│ --color-line-subtle         --color-line-default                       │
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
│ • Cinema Studio: HowToDrawer (Surface), MediaCard (Card+Canvas)        │
│ • Media Library: MediaCard (Card + Canvas bleed zone)                  │
│ Zero raw hex • Zero raw palette colors (enforced by scripts/ui-check)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Token Specification (`src/app/globals.css`)

Tokens are declared in `:root` and mapped into the Tailwind v4 inline theme. In Tailwind v4, standard color values registered in `@theme inline` automatically participate in native CSS `color-mix`, ensuring slash-opacity (`bg-surface-card/80`, `border-line-subtle`) functions out of the box without legacy space-separated RGB channel variables. Registering through CSS variables in `:root` guarantees zero-component-touch light mode switching in the future.

The semantic token contract harmonizes directly with the active 6-tier Runway surface hierarchy in `src/app/globals.css`, eliminating elevation inversion and preserving existing consumers (such as `Button` secondary).

```css
:root {
  /* Canonical Runway Surface Scale */
  --surface-canvas: #000000;
  --surface-panel: #131314;
  --surface-processing: #17181a;
  --surface-card: #1e1f20;
  --surface-elevated: #282a2c;
  --surface-highest: #333537;

  /* Ergonomic Surface Semantic Aliases */
  --surface-base: var(--surface-card);
  --surface-sunken: var(--surface-canvas);
  --surface-overlay: rgba(22, 23, 24, 0.85);

  /* Content & Typography */
  --content-base: #f5f5f5;
  --content-muted: #8e8e93;
  --content-subtle: #636366;

  /* Line & Border Tokens (avoids stuttering border-border-*) */
  --line-subtle: rgba(255, 255, 255, 0.07);
  --line-default: rgba(255, 255, 255, 0.12);
  --line-interactive: rgba(255, 255, 255, 0.25);
}

@theme inline {
  --color-surface-canvas: var(--surface-canvas);
  --color-surface-panel: var(--surface-panel);
  --color-surface-processing: var(--surface-processing);
  --color-surface-card: var(--surface-card);
  --color-surface-base: var(--surface-base);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-highest: var(--surface-highest);
  --color-surface-sunken: var(--surface-sunken);
  --color-surface-overlay: var(--surface-overlay);

  --color-content-base: var(--content-base);
  --color-content-muted: var(--content-muted);
  --color-content-subtle: var(--content-subtle);

  --color-line-subtle: var(--line-subtle);
  --color-line-default: var(--line-default);
  --color-line-interactive: var(--line-interactive);
}
```

### 2. Primitive Implementations (`src/shared/ui/`)

#### A. Headless `Surface` (`src/shared/ui/surface.jsx`)
`Surface` provides the baseline geometric container. It utilizes `class-variance-authority` (CVA) for variant resolution, `radix-ui` for `asChild` delegation, and imports canonical `cn` from `@/shared/lib/utils`. It deliberately contains no state, hooks, or React Context, ensuring zero RSC hydration penalty.

```jsx
import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

export const surfaceVariants = cva(
  "transition-colors duration-150 border",
  {
    variants: {
      tone: {
        base: "bg-surface-base text-content-base border-line-subtle",
        panel: "bg-surface-panel text-content-base border-line-default",
        processing: "bg-surface-processing text-content-base border-line-subtle",
        card: "bg-surface-card text-content-base border-line-subtle",
        elevated: "bg-surface-elevated text-content-base border-line-default",
        highest: "bg-surface-highest text-content-base border-line-default",
        sunken: "bg-surface-sunken text-content-base border-line-subtle",
        overlay: "bg-surface-overlay text-content-base border-line-default backdrop-blur-md",
      },
      radius: {
        none: "rounded-none",
        xxxs: "rounded-xxxs",
        xs: "rounded-xs",
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
  const Comp = asChild ? Slot.Root : "div";
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

#### B. Compound & Backward-Compatible `Card` (`src/shared/ui/card.jsx`)
`Card` is built on top of `Surface`. To satisfy Non-Goal NG1 and guarantee 100% backward compatibility with existing callers across the repository, it employs the **Dual Export & Synonym Pattern**: exporting all existing named components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) while attaching dot-notation aliases directly to `Card` (including `Card.Body = CardContent` and the zero-padding `Card.Canvas = CardCanvas`).

```jsx
import * as React from "react";
import { Surface } from "./surface";
import { cn } from "@/shared/lib/utils";

const Card = React.forwardRef(function Card(
  { className, variant = "default", interactive, tone, radius = "md", ...props },
  ref
) {
  const resolvedTone = tone || (variant === "glass" ? "overlay" : "card");
  const isInteractive = interactive ?? (variant === "interactive");

  return (
    <Surface
      ref={ref}
      tone={resolvedTone}
      radius={radius}
      data-slot="card"
      data-variant={variant}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      className={cn(
        "text-content-base transition-all font-sans antialiased overflow-hidden flex flex-col relative",
        isInteractive && "cursor-pointer hover:bg-surface-processing hover:border-line-interactive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-interactive transition-all active:scale-95",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(function CardHeader({ className, bordered = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-4 sm:p-5",
        bordered && "border-b border-line-subtle pb-3",
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} data-slot="card-title" className={cn("text-base font-semibold tracking-tight text-content-base leading-snug", className)} {...props} />;
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} data-slot="card-description" className={cn("text-xs text-content-muted leading-relaxed", className)} {...props} />;
});
CardDescription.displayName = "CardDescription";

const CardCanvas = React.forwardRef(function CardCanvas({ className, ...props }, ref) {
  // Edge-to-edge bleed zone with zero padding for video, WebGL, or scrubbers
  return <div ref={ref} data-slot="card-canvas" className={cn("relative w-full overflow-hidden bg-surface-sunken", className)} {...props} />;
});
CardCanvas.displayName = "CardCanvas";

const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} data-slot="card-content" className={cn("p-4 sm:p-5 pt-0 sm:pt-0 flex-1", className)} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(function CardFooter({ className, bordered = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex items-center p-4 sm:p-5 pt-0 sm:pt-0 gap-2 shrink-0",
        bordered && "border-t border-line-subtle pt-3",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

// Attach dot-notation compound aliases to Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Body = CardContent; // Ergonomic alias for CardContent
Card.Canvas = CardCanvas;
Card.Footer = CardFooter;

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardCanvas,
  CardFooter,
};
```

### 3. Automated Ratchet Enforcement (`scripts/ui-check.cjs`)

The existing regex line-based ratchet is enhanced with an explicit check for raw neutral color palette utilities outside token/primitive definitions:

* **Rule `U8` (Raw Neutral Palette Utility Violation):**
  - **Pattern:** Class tokens matching `\b(bg|text|border(?:-[tblrxy])?|divide(?:-[xy])?|ring|fill|stroke|outline)-(zinc|gray|neutral|slate|stone|white|black)(?:-\d+)?(?:\/(?:\d+|\[[^\]]+\]))?\b`.
  - **Allowed Scope:** Excluded inside `src/app/globals.css` and `src/shared/ui/`.
  - **Scope Boundary:** Status colors (`red`, `blue`, `amber`, `emerald`) are intentionally excluded until dedicated semantic status tokens are introduced, preventing false positives on existing badges or alerts.
  - **Remediation:** Developers must replace neutral palette classes with semantic tokens (`bg-surface-elevated`, `text-content-muted`, `border-line-subtle`).
  - **Bootstrap Command:** Because `ui-baseline.json` already exists and `--init-baseline` rejects re-initialization, new Rule `U8` violations are safely merged into the baseline via:
    ```bash
    node -e 'const r = require("./scripts/lib/ratchet.cjs"); const fs = require("fs"); const check = require("./scripts/ui-check.cjs"); /* merges counts */'
    ```
    (Prescribed in Phase 3 of the Implementation Plan to preserve existing U1–U7 baselines).
* **Resilient Baseline Schema:**
  - `ui-baseline.json` already utilizes the resilient `{ "RULE_ID|relative/file/path.jsx": count }` schema throughout the repository.
  - Storing count per rule and file guarantees that adding or removing lines elsewhere in a file does not produce false CI failures.

### 4. Vertical-Slice Migration Strategy

The migration executes canary vertical slices with visual regression verification:

```text
[Baseline Capture]  ──>  [Deploy Tokens & Primitives]  ──>  [Canary Feature Refactor]  ──>  [Visual Parity Diff]
Take screenshots of       Add variables to globals.css      1. src/features/media/ui/       Compare rendered pixels
/cinema-studio and        Add surface.jsx & card.jsx           MediaCard.jsx                against baseline shots
/assets in dev browser    Pass npm run ui:check             2. src/components/cinema-studio (0 pixel shift target)
                                                               elements/HowToDrawer.jsx
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
* **Step 1.1**: Open [globals.css](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css) and append the semantic token definitions (`--color-surface-*`, `--color-content-*`, `--color-line-*`) inside `@theme inline`, fully harmonizing with the existing 6-tier Runway surface variables in `:root`.
* **Step 1.2**: Verify that Tailwind v4 compiles native `color-mix` utility classes (e.g. `bg-surface-card/80`, `border-line-subtle`) without CSS build warnings.
* **Step 1.3**: Update [tokens.md](file:///C:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/tokens.md) to document the semantic variables and their designated use cases.

### Phase 2: Core Primitives Construction
* **Step 2.1**: Create [surface.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/surface.jsx) exporting `Surface` and `surfaceVariants`. Ensure it uses `import { Slot } from "radix-ui"` with `<Slot.Root>` for `asChild` delegation, `cva`, and `cn` from `@/shared/lib/utils` with `React.forwardRef`. Support `xxxs` and `xs` in radius variants to match Runway hairline media cards. Verify it contains NO `"use client"` or React Context.
* **Step 2.2**: Update [card.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx) exporting `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardCanvas`, and `CardFooter` with dot-notation aliases. Strip hardcoded `rounded-md` from `Card`'s class string to ensure clean `radius` prop delegation to `Surface`. Add keyboard accessibility (`tabIndex`, `role="button"`) and interactive hover affordance (`hover:bg-surface-processing hover:border-line-interactive`).
* **Step 2.3**: Update [components.md](file:///C:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/components.md) with API specs and code examples for `Surface` and `Card`.
* **Step 2.4**: Add a dedicated showcase section in [dev/ui/page.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx) rendering all `Surface` tones and `Card` configurations.

### Phase 3: Regex Ratchet & Palette Enforcement Upgrade
* **Step 3.1**: Update [ui-check.cjs](file:///C:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs) to introduce Rule `U8` (forbidding raw neutral Tailwind palette classes `bg-zinc-*`, `text-white`, `border-white/10` outside token and primitive directories).
* **Step 3.2**: Execute a targeted baseline merge command to ingest existing Rule `U8` violation counts into `ui-baseline.json` without wiping out rules `U1`–`U7`:
  ```bash
  node -e 'const r = require("./scripts/lib/ratchet.cjs"); const fs = require("fs"); const cp = require("child_process"); const base = r.loadBaseline("./ui-baseline.json") || {}; const output = cp.execSync("node scripts/ui-check.cjs --report", { encoding: "utf8" }); output.split("\n").filter(l => l.startsWith("U8 ")).forEach(l => { const key = l.split(" ")[1]; if (key) base[key] = (base[key] || 0) + 1; }); r.writeBaseline("./ui-baseline.json", base);'
  ```
* **Step 3.3**: Verify that running `npm run ui:check` passes cleanly with zero net-new violations.

### Phase 4: Canary Migration & Visual Parity Verification
* **Step 4.1**: Capture baseline screenshots of `/cinema-studio` and `/assets` in the local development browser.
* **Step 4.2**: Refactor [MediaCard.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaCard.jsx) in the Media Library to consume `<Card radius="xxxs" tone="card">` and `<Card.Canvas>`, preserving its exact 1px hairline border radius and surface background.
* **Step 4.3**: Refactor Cinema Studio drawer panel in [HowToDrawer.jsx](file:///C:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/HowToDrawer.jsx) to consume `<Surface tone="panel">` (replacing hardcoded `bg-[#121215]` and `border-white/10`).
* **Step 4.4**: Capture post-refactor screenshots and perform a pixel-level comparison against baseline shots. Verify 100% visual parity with zero layout shifts.
* **Step 4.5**: Execute `npm run ui:check --shrink-baseline` to ratify the migration progress and lock in the reduced violation count.

---

### Enumeration of Affected Files

| File Path | Action | Rationale |
| :--- | :--- | :--- |
| `src/app/globals.css` | **Modify** | Central declaration of semantic tokens (`--color-surface-*`, `--color-content-*`, `--color-line-*`) inside `@theme inline` harmonized with existing Runway `:root` variables. |
| `src/shared/ui/surface.jsx` | **Create** | Headless geometric container implementing `Slot.Root` from `radix-ui` and semantic Runway tones/radii without React Context (100% Server Component safe), using `@/shared/lib/utils`. |
| `src/shared/ui/card.jsx` | **Update** | Canonical composite card container exporting all existing named components alongside dot-notation aliases, clean `radius` prop delegation, interactive keyboard affordance, and `Card.Canvas` bleed zone with `React.forwardRef`. |
| `scripts/ui-check.cjs` | **Modify** | Introduces Rule `U8` (neutral palette filter) operating against the existing `{ "RULE|path": count }` baseline schema. |
| `ui-baseline.json` | **Modify** | Safely merged with legacy Rule `U8` counts, ensuring net-new files in features are strictly 100% compliant. |
| `docs/ui-system/tokens.md` | **Modify** | Documents the new semantic surface, content, and line tokens for engineering team onboarding. |
| `docs/ui-system/components.md` | **Modify** | Documents `Surface` and `Card` component APIs, compound usage patterns, and the zero call-site restyling rules. |
| `docs/ui-system/usage-rules.md` | **Modify** | Harmonizes rules to replace raw `border-white/10` examples with semantic `border-line-subtle` tokens. |
| `src/app/dev/ui/page.jsx` | **Modify** | Provides an interactive visual playground rendering all tone and layout combinations for manual and automated visual inspection. |
| `src/features/media/ui/MediaCard.jsx` | **Modify** | Canary vertical slice 1: migrates media library card to `<Card radius="xxxs" tone="card">` and `<Card.Canvas>`. |
| `src/components/cinema-studio/elements/HowToDrawer.jsx` | **Modify** | Canary vertical slice 2: migrates studio drawer panel container to `<Surface tone="panel">`. |
