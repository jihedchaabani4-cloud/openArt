# Design System Alignment & Usage Audit

> **Document Type:** Evidence-Based Architecture Audit & Implementation Plan  
> **Target Application:** `my-app` (Frontend)  
> **Source of Truth:** [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md) & [`my-app/docs/ui-system/design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md)  
> **Audit Date:** 2026-11-05  
> **Status:** Completed (Read-Only Investigation & Strategy Formulation)

---

## 1. Executive Summary

This audit evaluates whether the actual frontend codebase (`my-app`) faithfully implements the visual rules, tokens, and component standards defined in [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md).

### The Central Question
**Does the current frontend consistently implement and use the Design System defined in `design.md`, and what must change to make that implementation reliable for developers and AI coding agents?**

### Key Findings Overview
1. **The Core Primitives Are Deep and Well-Encapsulated:**
   The shared UI primitives in [`src/shared/ui/`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui) ([`button.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx), [`input.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/input.jsx), [`dialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx), [`card.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx)) follow the *Zero Call-Site Restyling Law*. There are **zero raw `<button>` elements in production feature code** (all 13 raw `<button>` occurrences are isolated to playground test routes).
2. **The 159 "Dead Class" Trap (Feature-to-Token Disconnect):**
   In previous refactorings, legacy compound classes (`rounded-button`, `rounded-card`, `rounded-dialog`, `rounded-badge`, `rounded-input`) were correctly removed from the Tailwind v4 theme. However, **159 call sites across feature components still write these classes**. Because Tailwind v4 does not recognize them, the browser renders **0px border-radius** (square corners) on these buttons, cards, and dialogs.
3. **The Studio Menu & Action Pill Visual Discrepancy:**
   Inspection of live RunwayML Studio demonstrates that action triggers (e.g. Favorite + More Options on media items) are **capsule pills (`rounded-full`)**, and floating menu containers use **generous 16px curves (`rounded-2xl`)**. In contrast, [`MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472) forces `rounded-lg` on the trigger group, and [`globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1309) locks dropdown panels to 8px via `.mat-mdc-menu-panel` with an `!important` rule.
4. **CSS Token Architecture Fragmentation:**
   [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css) contains **three separate `:root` blocks** (lines 283, 1695, 1826) and 307 lines of residual Google Material 3 / VideoFX CSS that compete with the Runway design system.
5. **Ratchet Gate Blind Spot:**
   [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs) successfully blocks new raw colors (U1), arbitrary values (U2), raw `<button>` (U3), and `fetch()` calls (U4), but does not validate whether applied Tailwind classes actually exist in `@theme inline`.

---

## 2. Design Specification Inventory

Extracted directly from [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md):

| Category | Specification in `design.md` | Nature | Completeness |
|---|---|---|---|
| **Canvas Background** | `#000000` (Runway Black / OLED canvas) | Explicit | Complete |
| **Surface Hierarchy** | `#000000` (Canvas) $\rightarrow$ `#131314` (Panel) $\rightarrow$ `#1e1f20` (Card) $\rightarrow$ `#282a2c` (Elevated) $\rightarrow$ `#333537` (Highest) | Explicit | Complete |
| **Brand Accents** | Electric Neon `#EFFE17`, Accent Blue `#a8c7fa`, Danger Red `#fe6e6e`, Success Green `#80da88` | Explicit | Complete (Preserved User Scheme) |
| **Typography Family** | Single typeface commitment: abcNormal (Inter / DM Sans as fallbacks; currently Google Sans in codebase) | Explicit | Documented, but codebase uses Google Sans |
| **Typography Roles** | Display Hero (48px, line-height 1.0, tracking -1.2px) down to Micro Tag (11px, weight 450, tracking 0) | Explicit | Complete |
| **Border Radius Scale** | 4-Tier Hierarchy: `sharp` 4px (`--radius-sm`), `subtle` 6px (`--radius-md`), `comfortable` 8px (`--radius-lg`), `generous` 16px (`--radius-2xl`), `full` 9999px (`--radius-full`) | Explicit | Complete |
| **Elevation & Shadows** | **Zero Box-Shadow Law**: `shadow-none` across the entire system. Depth via photographic depth, surface contrast, and 1px hairline borders (`border-white/10`) | Explicit | Complete |
| **Spacing Scale** | 8px base grid with 4px/6px micro-steps: 4px (`xxs`), 6px (`xs`), 8px (`sm`), 12px (`md`), 16px (`base`), 20px (`lg`), 24px (`xl`), 28px (`xxl`), 32–78px (sections) | Explicit | Complete |
| **Container Widths** | Cinema Wide: 1600px; Editorial: 1280px; Compact: 980px; Dialog: 960px / 480px | Explicit | Complete |
| **Component Encapsulation** | **Zero Call-Site Restyling Law**: Primitives define all visual styling; callers specify only `variant` and `size`; `className` is layout-only | Explicit | Complete |

---

## 3. Current Design System Architecture

The frontend styling stack consists of 4 distinct architectural layers:

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Design Specification                                   │
│ design.md & my-app/docs/ui-system/design.md                     │
│ Single source of truth for visual tokens, scales, and laws      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Layer 2: Design Tokens & CSS Engine                             │
│ src/app/globals.css                                             │
│ - Tailwind v4.3.3 @theme inline (L165-281)                      │
│ - Three separate :root blocks (L283, L1695, L1826)              │
│ - Base radius tokens (--radius-sm: 4px, --radius-lg: 8px, etc.) │
│ - 307 lines of legacy Material 3 / Google VideoFX CSS           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Layer 3: Shared UI Primitives (Deep Modules)                    │
│ src/shared/ui/ (button, input, dialog, card, select, switch...) │
│ - CVA variants & sizes                                          │
│ - Strict encapsulation of hover, focus, disabled states         │
│ - Direct consumption of canonical Tailwind tokens               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Layer 4: Feature-Level UI & Composed Views                      │
│ Cinema Studio, Prompt Bar, Media Gallery, Elements, Characters  │
│ - Composes Layer 3 primitives                                   │
│ - Applies layout and grid classes                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Token Implementation Audit

### 4.1 Tailwind CSS Theme Mapping (`@theme inline`)
Tailwind v4 in this repository uses `@theme inline` inside [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L165-L281).
* **Radius Utilities:**
  * `--radius-sm: var(--radius-sm, 4px);` $\rightarrow$ `rounded-sm` (4px)
  * `--radius-md: var(--radius-md, 6px);` $\rightarrow$ `rounded-md` (6px)
  * `--radius-lg: var(--radius-lg, 8px);` $\rightarrow$ `rounded-lg` (8px)
  * `--radius-xl: var(--radius-xl, 12px);` $\rightarrow$ `rounded-xl` (12px)
  * `--radius-2xl: var(--radius-2xl, 16px);` $\rightarrow$ `rounded-2xl` (16px)
  * `--radius-full: var(--radius-full, 9999px);` $\rightarrow$ `rounded-full` (9999px)
* **Shadow Utilities:**
  * `--shadow-sm: none;`, `--shadow-md: none;`, `--shadow-lg: none;`, `--shadow-2xl: none;`, `--shadow: none;`
  * All standard Tailwind shadow utilities correctly resolve to `none`.

### 4.2 The 159 Dead Legacy Class Occurrences
Because custom compound names (`--radius-button`, `--radius-card`, `--radius-dialog`, etc.) were stripped from `@theme inline`, Tailwind v4 does not compile any styles for these class names.

A full search reveals **159 call sites** still using these non-functional classes:
* `rounded-button`: 58 occurrences
* `rounded-card`: 74 occurrences
* `rounded-dialog`: 16 occurrences
* `rounded-badge`: 9 occurrences
* `rounded-input`: 2 occurrences

**Consequence:** Elements using these classes in feature code render with browser-default square corners (0px) rather than the intended Runway radius.

### 4.3 Redundant Unused Tokens in `@theme inline`
* **Named Spacing Tokens (`--spacing-xxs` through `--spacing-section-xxl`):**
  Declared at lines 228–239 in [`globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L228-L239). A full repository grep confirms **zero usages** of classes like `p-xxs`, `gap-sm`, or `py-section`. Developers and agents consistently use standard numeric Tailwind classes (`gap-1.5`, `p-2`, `p-4`, `p-6`).
* **Runway Typography Classes (`.font-display-hero`, `.font-section-heading`...):**
  Declared at lines 1155–1200 in [`globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1155-L1200). A full repository grep confirms **zero usages** in production JSX. Feature code uses standard Tailwind font utilities (`text-xs font-semibold`, `text-sm font-medium`, `text-base font-semibold`).

### 4.4 Multiple `:root` Blocks
[`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css) contains 3 separate `:root` blocks:
1. **Line 283 (`:root`):** Primary token definitions, surface colors, base radiuses, component bindings, and Material/Flow compatibility aliases.
2. **Line 1695 (`:root`):** Legacy Google Flow Ingredient Chip tokens (`--chip-size: 3.125rem; --gap-size: 0.25rem;`).
3. **Line 1826 (`:root`):** OKLCH color palette variables (`--color-red-500`, `--color-blue-500`, etc.) and font definitions.

While not strictly conflicting, splitting declarations across 2,193 lines creates maintenance confusion.

---

## 5. Tailwind Mapping Analysis

| Tailwind Utility | Expected Value (`design.md`) | Actual Computed Value | Mechanism | Status |
|---|---|---|---|---|
| `rounded-sm` | 4px (Runway Sharp) | 4px | `@theme inline` $\rightarrow$ `--radius-sm` | **MATCH** |
| `rounded-md` | 6px (Runway Subtle) | 6px | `@theme inline` $\rightarrow$ `--radius-md` | **MATCH** |
| `rounded-lg` | 8px (Runway Comfortable) | 8px | `@theme inline` $\rightarrow$ `--radius-lg` | **MATCH** |
| `rounded-2xl` | 16px (Runway Generous) | 16px | `@theme inline` $\rightarrow$ `--radius-2xl` | **MATCH** |
| `rounded-full` | 9999px (Runway Pill) | 9999px | `@theme inline` $\rightarrow$ `--radius-full` | **MATCH** |
| `rounded-button` | 4px | **Unresolved (0px)** | Dead class (not in `@theme inline`) | **MISMATCH** |
| `rounded-card` | 8px | **Unresolved (0px)** | Dead class (not in `@theme inline`) | **MISMATCH** |
| `rounded-dialog` | 16px | **Unresolved (0px)** | Dead class (not in `@theme inline`) | **MISMATCH** |
| `shadow-none` | none | none | Tailwind v4 default | **MATCH** |
| `shadow-lg` / `shadow-2xl` | none | none | `@theme inline` maps to `none` | **MATCH** |
| `shadow-[...]` (arbitrary) | none | Computes to box-shadow | Call-site inline brackets | **MISMATCH** |
| `p-1`, `gap-1` | 4px (`xxs`) | 4px (0.25rem) | Tailwind numeric scale | **MATCH** |
| `p-1.5`, `gap-1.5` | 6px (`xs`) | 6px (0.375rem) | Tailwind numeric scale | **MATCH** |
| `p-2`, `gap-2` | 8px (`sm`) | 8px (0.5rem) | Tailwind numeric scale | **MATCH** |
| `p-3`, `gap-3` | 12px (`md`) | 12px (0.75rem) | Tailwind numeric scale | **MATCH** |
| `p-4`, `gap-4` | 16px (`base`) | 16px (1rem) | Tailwind numeric scale | **MATCH** |
| `p-6`, `gap-6` | 24px (`xl`) | 24px (1.5rem) | Tailwind numeric scale | **MATCH** |

---

## 6. Shared UI Component Audit

### 6.1 Trace: The `<Button />` Component (`@/shared/ui/button`)
* **Source:** [`src/shared/ui/button.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx)
* **Underlying Primitive:** Radix UI `Slot.Root` / native `<button>`.
* **Geometry:** `rounded-sm` (4px sharp) across all standard variants; `rounded-full` for pills; `rounded-2xl` for FABs.
* **Typography:** `text-sm font-semibold font-sans antialiased`.
* **Elevation:** `shadow-none` explicit on all variants.
* **Canonical Variants:**
  * `variant="white"` / `variant="primary"`: High-contrast white fill with black text (`bg-white text-black font-semibold`).
  * `variant="secondary"`: Dark surface container (`bg-[#282a2c] text-[#e3e3e3]`).
  * `variant="outline"`: Transparent with 1px border (`border border-[#444746]`).
  * `variant="ghost"`: Transparent with state hover layer (`hover:bg-white/10`).
  * `variant="danger"`: Red ghost icon & label (`text-[#fe6e6e]`).
  * `variant="destructive-filled"`: Crimson filled container (`bg-[#8c1d18]`).
  * `variant="neon"`: Electric lime CTA (`bg-[#EFFE17] text-black`).
* **Adoption:** 199 call sites in production code. **Zero raw `<button>` elements in production.**
* **Architectural Observation:** While the 5 canonical tiers are cleanly defined, the component retains 28 legacy alias variants (`studio-white`, `flow-toggle`, `flow-trigger`, etc.) to support older views without runtime breakage.

### 6.2 The Other Primitives

| Primitive | Implementation File | Base Geometry | Elevation | Interaction States | Status |
|---|---|---|---|---|---|
| **`<Input />`** | [`input.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/input.jsx) | `rounded-sm` (4px) | `shadow-none` | Hover & focus-within state layers | **MATCH** |
| **`<Dialog />`** | [`dialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx) | `rounded-2xl` (16px) | `shadow-none` | Radix animated overlay with backdrop blur | **MATCH** |
| **`<Card />`** | [`card.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx) | `rounded-lg` (8px) | `shadow-none` | `variant="interactive"` has hover border/bg | **MATCH** |
| **`<Switch />`** | [`switch.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/switch.jsx) | `rounded-full` | `shadow-none` | Radix checked/unchecked track transition | **MATCH** |
| **`<Badge />`** | [`badge.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/badge.jsx) | `rounded-sm` (4px) | `shadow-none` | Semantic colored chips | **MATCH** |
| **`<Tabs />`** | [`tabs.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/tabs.jsx) | `rounded-full` (pills) / `rounded-lg` (studio) | `shadow-none` | Active tab highlights | **MATCH** |
| **`<Select />`** | [`select.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx) | Trigger `rounded-sm`, Content `rounded-lg` | `shadow-none` | Radix popper alignment | **MATCH** |
| **`<DropdownMenu />`** | [`dropdown-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx) | Panel `rounded-lg` (8px) | `shadow-none` | Hover state layer on items (`rounded-sm`) | **MISMATCH with Studio spec (16px)** |
| **`<ContextMenu />`** | [`context-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/context-menu.jsx) | Panel `rounded-lg` (8px) | `shadow-none` | Hover state layer on items (`rounded-sm`) | **MISMATCH with Studio spec (16px)** |
| **`<Slider />`** | *Missing Primitive* | N/A | N/A | Handled via raw `<input type="range" />` in features | **MISSING** |

---

## 7. Feature-Level Usage Audit

### 7.1 Media Grid Items & Action Triggers
* **File:** [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472)
* **Code:**
  ```jsx
  <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg border-0 border-none">
    <ActionBtn onClick={handleLike}>...</ActionBtn>
    <StudioItemDropdownMenu items={menuItems} />
  </ButtonGroup>
  ```
* **Mismatch:**
  1. The `ButtonGroup` container uses `rounded-lg` (8px) instead of `rounded-full`. In RunwayML Studio, this action trigger is a smooth capsule pill.
  2. Inside [`ActionBtn.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10), the class `rounded-button` is applied inline, which resolves to 0px.
  3. Inside [`dropdown-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L43), the menu container is constrained to 8px (`var(--mat-menu-container-shape, 8px)`), whereas Runway floating menus feature generous 16px corner curves (`rounded-2xl`).

### 7.2 Prompt Bar Controls Row
* **File:** [`src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50)
* **Code:**
  ```jsx
  <Button
    variant="blur"
    className={cn(
      "settings-trigger-button h-8 px-2.5 rounded-button flex items-center gap-1.5 transition-all ...",
      drawerOpen ? "bg-white/15 border border-white/20 shadow-none text-white" : "border-transparent text-white"
    )}
  >
  ```
* **Mismatch:** `rounded-button` is manually appended to the `className` prop. This violates the *Zero Call-Site Restyling Law* and resolves to 0px in Tailwind v4. The `<Button />` primitive already internally manages its canonical border radius (`rounded-sm`).

### 7.3 Reference Button (Ingredient Chips)
* **File:** [`src/features/prompt-bar/ui/common/ReferenceButton.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L45)
* **Code:** Uses `rounded-button` (lines 45, 151) and `rounded-card` (lines 216, 220, 230).
* **Mismatch:** All 5 instances use dead legacy classes that render with 0px corner radiuses.

### 7.4 Character & Element Cards
* **Files:** [`CharacterCardKrea.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L77) & [`ElementCardKrea.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L158)
* **Code:** Both use `rounded-card` on container and image wrappers.
* **Mismatch:** Resolves to 0px border radius. Additionally, `CharacterCardKrea.jsx` line 142 declares an arbitrary `shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.5)]`, violating the Zero Box-Shadow Law.

### 7.5 Navigation Rails & Dropdowns
* **Files:** [`LeftNavigationRail.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/LeftNavigationRail.jsx#L95) & [`UserDropdown.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97)
* **Code:** Use `rounded-button` on nav items, user avatars, and skeletons; `rounded-card` on user dropdown panel.
* **Mismatch:** Dead classes resulting in 0px corners.

---

## 8. Design-to-Code Comparison Matrix

| Design Category | `design.md` Specification | Current Implementation | Evidence | Status | Required Action |
|---|---|---|---|---|---|
| **Buttons Radius** | 4px (`rounded-sm`, Runway sharp) | `rounded-sm` inside primitive; but 58 call sites pass `rounded-button` | [`button.jsx:25`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L25), [`PromptBarControlsRow.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50) | **MISMATCH at call sites** | Strip `rounded-button` from all call sites; rely on primitive `rounded-sm` |
| **Card Radius** | 8px (`rounded-lg`, Runway comfortable) | `rounded-lg` inside primitive; but 74 feature call sites pass `rounded-card` | [`card.jsx:26`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx#L26), [`CharacterCardKrea.jsx:77`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L77) | **MISMATCH at call sites** | Replace `rounded-card` with canonical `rounded-lg` across feature code |
| **Dropdown / Menu Radius** | 16px (`rounded-2xl`, Runway generous) | Hardcoded to 8px (`var(--mat-menu-container-shape, 8px) !important;`) | [`globals.css:1309`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1309), [`dropdown-menu.jsx:43`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L43) | **MISMATCH** | Update `--mat-menu-container-shape` to `--radius-2xl` (16px) and use `rounded-2xl` on menus |
| **Media Card Action Pill** | Capsule pill (`rounded-full`) with white/translucent background | `rounded-lg` on `ButtonGroup` with `rounded-button` on `ActionBtn` | [`MediaGridItem.jsx:472`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472), [`ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10) | **MISMATCH** | Change `ButtonGroup` to `rounded-full` and `ActionBtn` to `rounded-full` |
| **Dialog Radius** | 16px (`rounded-2xl`, Runway generous) | `rounded-2xl` inside primitive; 16 call sites pass `rounded-dialog` | [`dialog.jsx:65`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L65), [`CreateElementModal.jsx:40`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L40) | **MISMATCH at call sites** | Replace `rounded-dialog` with `rounded-2xl` on custom dialog wrappers |
| **Zero Box-Shadow Law** | Zero box shadows (`shadow-none`) | Theme defaults to `none`, but 17 locations use arbitrary `shadow-[...]` | [`CharacterCardKrea.jsx:142`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L142), [`DropdownEngine.jsx:148`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx#L148) | **MISMATCH** | Strip arbitrary shadow brackets and replace with `shadow-none border border-white/10` |
| **Spacing Scale** | 8px base scale (4px, 6px, 8px, 12px, 16px, 24px) | Consistently implemented via Tailwind standard numeric scale (`gap-1.5`, `p-2`, `p-4`) | Repository-wide | **MATCH** | Retain standard numeric scale; deprecate unused named `--spacing-*` tokens |
| **Typography Hierarchy** | abcNormal (48px display to 11px micro) | Google Sans Text implemented; Runway `.font-*` classes exist but unused | [`globals.css:168`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L168), [`globals.css:1155`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1155) | **DUPLICATED / UNUSED** | Decide whether to keep Google Sans Text or transition font family |
| **Canvas & Surfaces** | OLED black `#000000`, surfaces `#131314`, `#1e1f20`, `#282a2c` | Implemented via CSS variables & `@theme inline` semantic colors | [`globals.css:270-280`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L270-L280) | **MATCH** | Retain preserved color system |
| **Slider Primitive** | Reusable Radix UI Slider primitive | Raw `<input type="range" />` in multiple feature files | [`DurationSelector.jsx:110`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx#L110), [`FlowPromptBoxSettings.jsx:380`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L380) | **MISSING** | Create `@/shared/ui/slider.jsx` primitive based on `@radix-ui/react-slider` |

---

## 9. Developer & AI Agent Usage Strategy

To prevent future regression and ensure effortless consistency for both humans and AI agents, the following conventions and automated enforcement must be maintained:

### 9.1 The Single Standard Token Rule
Developers and AI agents should **never** invent custom compound names or stack classes.
* For buttons, inputs, badges, and menu items $\rightarrow$ Use **`rounded-sm`** (4px).
* For intermediate chips and secondary tags $\rightarrow$ Use **`rounded-md`** (6px).
* For standard cards, media tiles, and dropdown items $\rightarrow$ Use **`rounded-lg`** (8px).
* For modals, dialogs, and floating menus $\rightarrow$ Use **`rounded-2xl`** (16px).
* For action pills, avatars, and switch tracks $\rightarrow$ Use **`rounded-full`** (9999px).

### 9.2 The "Deep Module" Primitive Workflow
* When building UI, developers should never write raw HTML controls (`<button>`, `<input>`, `<select>`, `<textarea>`, `<input type="range">`).
* When invoking a primitive, specify only `variant="..."` and `size="..."`.
* Use call-site `className` strictly for layout positioning (`w-full`, `max-w-md`, `shrink-0`, `col-span-2`).
* If a new visual state is required, add a named variant inside the primitive (e.g. [`button.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx)).

### 9.3 Enhancing the Ratchet Gate (`ui:check`)
Currently, [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs) validates rules U1 through U5. We recommend adding **Rule U6**:
* **Rule U6 (Dead Compound Classes):** Block any new occurrences of `rounded-button`, `rounded-card`, `rounded-dialog`, `rounded-badge`, or `rounded-input` in JSX.
* This ensures that no agent or developer can introduce a non-compiled Tailwind class.

---

## 10. Identified Problems and Root Causes

| Problem | Symptom in UI | Root Cause |
|---|---|---|
| **1. Dead Radius Classes at Call Sites** | 159 feature elements display with sharp 0px corners instead of Runway curves. | `--radius-button` and `--radius-card` were removed from `@theme inline` during token cleanup, but feature call sites were never updated to canonical tokens. |
| **2. Media Item Action Pill Geometry** | The top-right button group on media cards appears rectangular rather than capsule-shaped. | `ButtonGroup` in [`MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472) uses `rounded-lg` instead of `rounded-full`, and `ActionBtn` uses `rounded-button`. |
| **3. Dropdown Menu Locked to 8px** | Menus lack the generous, smooth 16px curve visible in Runway Studio. | [`globals.css:1309`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1309) contains `.mat-mdc-menu-panel { border-radius: var(--mat-menu-container-shape, 8px) !important; }`. |
| **4. Orphaned Typography & Spacing Tokens** | Bloated `@theme inline` with classes that are never used in real code. | Runway spec tokens (`--spacing-xxs`, `.font-display-hero`) were added wholesale without connecting them to actual component usage. |
| **5. Triplicate `:root` Declarations** | High cognitive load and risk of accidental token overrides across 2,193 lines. | CSS was incrementally appended across multiple redesign phases (Google Flow, VideoFX, and Runway) without consolidation. |
| **6. Missing `<Slider />` Primitive** | Inconsistent slider styling and thumb controls across `DurationSelector` and `FlowPromptBoxSettings`. | No shared primitive was built for range inputs, forcing features to write custom webkit thumb CSS. |

---

## 11. Proposed Target Architecture

The recommended target architecture keeps the system minimal, elegant, and deeply encapsulated:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Target Layer 1: Canonical Design Spec (design.md)                     │
│ Single source of truth. Documents:                                     │
│ - Preserved OLED-Black Palette (#000000, #131314, #1e1f20, #282a2c)   │
│ - Runway 4-Tier Radius (4px, 6px, 8px, 16px, 9999px)                   │
│ - Zero Box-Shadow Law (shadow-none)                                    │
│ - 8px Base Spacing Scale                                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Target Layer 2: Consolidated Token Layer (globals.css)                 │
│ - One consolidated :root block combining surfaces and base radiuses     │
│ - Clean Tailwind v4 @theme inline mapping standard tokens              │
│ - Zero dead compound classes; zero unused named spacing tokens         │
│ - Deprecate 307 lines of conflicting Material 3 !important overrides   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Target Layer 3: Canonical Primitives (@/shared/ui/*)                   │
│ Button · Input · Textarea · Dialog · Card · Switch · Select · Badge    │
│ Tabs · DropdownMenu · ContextMenu · Popover · Tooltip · [NEW: Slider]  │
│ - Deep modules: all styling internal, callers pass only variant & size  │
│ - Menu containers use rounded-2xl; items use rounded-sm                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Target Layer 4: Feature UI (Cinema Studio, Prompt Bar, Gallery)        │
│ - Composes Layer 3 primitives                                          │
│ - 100% migrated away from dead compound classes                        │
│ - Zero arbitrary shadow brackets; zero raw controls                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Prioritized Implementation Roadmap

*(Read-Only: No changes will be executed without explicit user approval)*

### Phase P0 — Critical Correctness (Immediate Impact)
* **Task P0.1: Media Item Action Pill Alignment**
  * **Files:** [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L458-L472) & [`ActionBtn.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10).
  * **Problem:** Action trigger uses `rounded-lg` instead of capsule pill; `ActionBtn` uses dead `rounded-button`.
  * **Change:** Update `ButtonGroup` to `rounded-full bg-white/80 backdrop-blur-md`; update `ActionBtn` to `rounded-full`.
  * **Scope:** Small.
* **Task P0.2: Dropdown & Context Menu Radius Alignment**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L346), [`src/shared/ui/dropdown-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L43-L49), [`src/shared/ui/context-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/context-menu.jsx#L83).
  * **Problem:** Menu panel is locked to 8px by legacy CSS with `!important`.
  * **Change:** Set `--mat-menu-container-shape: var(--radius-2xl, 16px);` and use `rounded-2xl` on menu containers.
  * **Scope:** Small.
* **Task P0.3: Migrate 159 Dead Compound Radius Classes Across Features**
  * **Files:** Feature files in `src/features/prompt-bar/`, `src/widgets/StudioNavbar/`, `src/components/cinema-studio/`, `src/widgets/NewElementDialog/`.
  * **Problem:** `rounded-button`, `rounded-card`, `rounded-dialog`, `rounded-badge` produce 0px border radius.
  * **Change:** Replace with canonical Tailwind classes: `rounded-button` $\rightarrow$ `rounded-sm`; `rounded-card` $\rightarrow$ `rounded-lg`; `rounded-dialog` $\rightarrow$ `rounded-2xl`; `rounded-badge` $\rightarrow$ `rounded-sm`.
  * **Scope:** Medium.

### Phase P1 — Token and Component Consistency
* **Task P1.1: Consolidate CSS `:root` Declarations**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css).
  * **Problem:** Three separate `:root` blocks scattered across 2,193 lines.
  * **Change:** Consolidate lines 283, 1695, and 1826 into a single well-commented `:root` block.
  * **Scope:** Small.
* **Task P1.2: Introduce Canonical `<Slider />` Primitive**
  * **Files:** Create `src/shared/ui/slider.jsx`; adopt in [`DurationSelector.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx) and [`FlowPromptBoxSettings.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx).
  * **Problem:** Features use raw `<input type="range" />` with duplicate inline CSS.
  * **Change:** Build Radix-based `@/shared/ui/slider` adhering to the Zero Box-Shadow Law and design tokens.
  * **Scope:** Medium.

### Phase P2 — Developer Experience & Automated Ratchet
* **Task P2.1: Add Rule U6 to `ui:check`**
  * **Files:** [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs).
  * **Problem:** Ratchet currently allows dead compound classes to pass unnoticed.
  * **Change:** Add regex check banning `rounded-(button|card|dialog|badge|input)` in JSX files.
  * **Scope:** Small.
* **Task P2.2: Prune Unused Utility Classes from `globals.css`**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1155-L1200).
  * **Problem:** Orphaned `.font-display-hero` and `--spacing-xxs` clutter the CSS.
  * **Change:** Remove unused custom classes; document standard Tailwind numeric mappings in `docs/ui-system/tokens.md`.
  * **Scope:** Small.

### Phase P3 — Legacy Cleanup
* **Task P3.1: Deprecate Legacy Material 3 & Google Flow CSS**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css).
  * **Problem:** 307 lines of `.mat-*`, `.flow-*`, and `!important` flags remain in `globals.css`.
  * **Change:** Systematically remove dead Angular Material classes no longer referenced in React components.
  * **Scope:** Medium.
* **Task P3.2: Eliminate Arbitrary Shadow Brackets**
  * **Files:** 17 feature files containing `shadow-[...]`.
  * **Problem:** Violates the Zero Box-Shadow Law.
  * **Change:** Replace with `shadow-none` and 1px subtle hairline border `border-white/10`.
  * **Scope:** Small.

---

## 13. Open Decisions Requiring Human Approval

1. **Dropdown & Context Menu Radius (8px vs 16px):**
   * *Evidence:* The Runway spec calls alert containers and floating sheets `generous` (16px), and live Runway Studio displays smooth 16px rounded menus. Our code currently locks menus to 8px.
   * *Recommendation:* Update dropdown and context menu containers to **`rounded-2xl` (16px)** to match the Studio experience.
2. **Typography Family (Google Sans vs abcNormal):**
   * *Evidence:* Runway's spec specifies `abcNormal` (with Inter/DM Sans fallback). Our project currently runs Google Sans Text.
   * *Recommendation:* Retain **Google Sans Text** for brand continuity unless you explicitly want to switch to Inter / DM Sans.
3. **Consolidation of the 159 Dead Call Sites:**
   * *Evidence:* Feature code still uses `rounded-button`, `rounded-card`, etc., which produce 0px border-radius in Tailwind v4.
   * *Recommendation:* Execute an automated codemod replacing all 159 instances with canonical tokens (`rounded-sm`, `rounded-lg`, `rounded-2xl`).
4. **Adoption of Radix `<Slider />` Primitive:**
   * *Evidence:* Two feature components currently use raw HTML `<input type="range" />`.
   * *Recommendation:* Introduce canonical `@/shared/ui/slider.jsx` to achieve 100% primitive encapsulation.

---

## 14. Evidence and Referenced File Paths

* **Design Source of Truth:**
  * [`c:\Users\jihad\Desktop\open art\design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md#L1-L235)
  * [`c:\Users\jihad\Desktop\open art\my-app\docs\ui-system\design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md#L1-L235)
  * [`c:\Users\jihad\Downloads\runwayml.design (1).md`](file:///c:/Users/jihad/Downloads/runwayml.design%20(1).md#L1-L433)
* **Theme & Global CSS:**
  * [`c:\Users\jihad\Desktop\open art\my-app\src\app\globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L165-L281) (`@theme inline`)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\app\globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L283-L370) (`:root` block 1)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\app\globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1309-L1365) (`.mat-mdc-menu-panel` `!important` rules)
* **Shared UI Primitives:**
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\button.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L1-L178)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\input.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/input.jsx#L1-L150)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\dialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L1-L100)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\card.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx#L1-L60)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\dropdown-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L1-L120)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\shared\ui\select.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx#L1-L160)
* **Feature Call Sites:**
  * [`c:\Users\jihad\Desktop\open art\my-app\src\widgets\StudioLayout\GenerationsStudio\MediaGridItem\MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L450-L495)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\widgets\StudioLayout\GenerationsStudio\MediaGridItem\ActionBtn.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L1-L17)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\features\prompt-bar\platform\parts\PromptBarControlsRow.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L45-L60)
  * [`c:\Users\jihad\Desktop\open art\my-app\src\components\cinema-studio\characters\CharacterCardKrea.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L77-L145)
* **Ratchet Script:**
  * [`c:\Users\jihad\Desktop\open art\my-app\scripts\ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs#L1-L103)
