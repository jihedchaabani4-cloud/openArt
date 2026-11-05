# OpenArt Button API Simplification Report

**Date:** November 5, 2026  
**Repository:** OpenArt / Labveil Frontend (`my-app`)  
**Branch:** `runway-design`  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

Following architectural review of the previous "Variant-Only" migration, the Button primitive (`src/shared/ui/button.jsx`) has been simplified to eliminate excessive variant bloat while preserving full design system fidelity.

The Button component now provides **strictly 6 core semantic variants**:
1. `primary`
2. `secondary`
3. `outline`
4. `ghost` (default)
5. `danger`
6. `link`

All specialized sizing (`h-10 px-6 text-sm`, `h-6 px-2 text-xs`), shapes (`rounded-full`), icon buttons (`size-8 p-0`, `size-9 p-0`), and layout positioning (`w-full`, `shrink-0`) are handled directly via standard Tailwind utility classes in `className`, which predictably and safely override variant defaults via `tailwind-merge` (`cn`).

---

## 2. Final Button API Architecture

### Canonical Implementation (`src/shared/ui/button.jsx`)

```javascript
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans antialiased shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "h-8 px-3.5 rounded-sm font-semibold text-xs bg-white text-black hover:bg-white/90 active:scale-[0.98] border-none",
        secondary:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-[var(--mat-sys-surface-container-high,#282a2c)] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-15)] active:bg-[var(--foreground-state-25)] border-none",
        outline:
          "h-8 px-3.5 rounded-sm font-semibold text-xs border border-[var(--mat-sys-outline-variant,#444746)] bg-transparent text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-15)]",
        ghost:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-transparent hover:bg-[var(--foreground-state-10,rgba(218,220,224,0.1))] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white border-none",
        danger:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-transparent text-[var(--foreground-color-danger,#fe6e6e)] hover:text-[var(--foreground-color-danger)] hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-25)] border-none [&_svg]:text-[var(--foreground-color-danger)] [&_mat-icon]:text-[var(--foreground-color-danger)] [&_.google-symbols]:text-[var(--foreground-color-danger)]",
        link:
          "p-0 h-auto bg-transparent text-[var(--mat-sys-link,#a8c7fa)] underline-offset-4 hover:underline font-medium text-xs cursor-pointer border-none",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "ghost",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  const resolvedVariant = variant === "default" || !variant ? "ghost" : variant;

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={resolvedVariant}
      className={cn(buttonVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## 3. Removed Variants & Migration Mapping

Over 45 non-core variants were removed from `src/shared/ui/button.jsx` and converted to core variants with `className` utilities:

| Category | Removed Variants | New Canonical Syntax |
|---|---|---|
| **Large Sizing** | `primary-large`, `primary-lg`, `white-lg` | `<Button variant="primary" className="h-10 px-6 text-sm">` |
| | `secondary-large`, `secondary-lg` | `<Button variant="secondary" className="h-10 px-6 text-sm">` |
| | `outline-large`, `outline-lg` | `<Button variant="outline" className="h-10 px-6 text-sm">` |
| **Micro Sizing** | `primary-xs` | `<Button variant="primary" className="h-6 px-2 text-xs">` |
| | `secondary-xs` | `<Button variant="secondary" className="h-6 px-2 text-xs">` |
| | `outline-xs` | `<Button variant="outline" className="h-6 px-2 text-xs">` |
| | `ghost-xs` | `<Button variant="ghost" className="h-6 px-2 text-xs">` |
| **Pills & Circles** | `primary-circle`, `primary-pill` | `<Button variant="primary" className="rounded-full px-4">` |
| | `secondary-circle` | `<Button variant="secondary" className="rounded-full px-4">` |
| | `pill` | `<Button variant="ghost" className="rounded-full px-4 bg-white/10 hover:bg-white/15 text-white/60 hover:text-white">` |
| | `pill-active` | `<Button variant="primary" className="rounded-full px-4">` |
| | `blur-circle` | `<Button variant="ghost" className="h-10 px-5 rounded-full bg-white/5 backdrop-blur-md">` |
| **Icon Buttons** | `icon-ghost` | `<Button variant="ghost" className="size-9 p-0">` |
| | `icon-ghost-sm` | `<Button variant="ghost" className="size-8 p-0">` |
| | `icon-ghost-xs` | `<Button variant="ghost" className="size-6 p-0 [&_svg]:size-3">` |
| | `icon-ghost-circle` | `<Button variant="ghost" className="size-9 p-0 rounded-full">` |
| | `icon-ghost-circle-sm` | `<Button variant="ghost" className="size-8 p-0 rounded-full">` |
| | `icon-ghost-circle-xs` | `<Button variant="ghost" className="size-6 p-0 rounded-full">` |
| | `icon-secondary` | `<Button variant="secondary" className="size-9 p-0">` |
| | `icon-secondary-sm` | `<Button variant="secondary" className="size-8 p-0">` |
| | `icon-secondary-xs` | `<Button variant="secondary" className="size-6 p-0 [&_svg]:size-3">` |
| | `icon-secondary-lg` | `<Button variant="secondary" className="size-10 p-0">` |
| | `icon-danger-xs` | `<Button variant="danger" className="size-6 p-0 [&_svg]:size-3">` |
| | `icon-blur` / `icon-blur-circle-sm` | `<Button variant="ghost" className="size-8 p-0 rounded-full bg-white/5 backdrop-blur-md">` |
| **Specialized & Accents** | `neon`, `studio-neon` | `<Button variant="primary" className="bg-brand-neon text-black hover:opacity-80">` |
| | `destructive-filled` | `<Button variant="danger" className="bg-red-900 text-red-100 hover:bg-red-800 border border-red-500/20">` |
| | `destructive`, `ghost-destructive` | `<Button variant="danger">` |
| | `white`, `studio-white`, `studio-accent` | `<Button variant="primary">` |
| | `ghost-tile` | `<Button variant="ghost" className="h-auto min-h-0 p-0">` |
| | `studio-fab` | `<Button variant="secondary" className="h-auto px-6 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200">` |
| | `flow-overlay-action` | `<Button variant="ghost" className="size-9 p-0 bg-black/40 backdrop-blur-md border border-white/10">` |
| | `flow-generate` | `<Button variant="primary" className="size-8 p-0 rounded-full">` |
| | `flow-toggle` / `flow-toggle-active` | `<Button variant={isChecked ? "secondary" : "ghost"}>` |
| | `flow-ratio` / `flow-ratio-active` | `<Button variant={isChecked ? "secondary" : "ghost"}>` |
| | `flow-boolean` / `flow-boolean-active` | `<Button variant={isChecked ? "secondary" : "ghost"}>` |
| | `flow-select-trigger` | `<Button variant="ghost" className="w-full h-9 px-3 bg-white/5">` |

---

## 4. Callsites Migrated Across Codebase

Every production callsite across the application was migrated to use exclusively the 6 core variants:
- **`src/app/cinema-studio/[projectId]/elements/page.js`**: `studio-fab` $\to$ `secondary` + `className`
- **`src/widgets/projects/ui/ProjectsFloatingAction.jsx`**: `studio-fab` $\to$ `secondary` + `className`
- **`src/features/payments/ui/PackageSelectionDialog.jsx`**: `white` $\to$ `primary`
- **`src/widgets/StudioNavbar/ui/UserDropdown.jsx`**: `user-avatar` $\to$ `ghost`, `white` $\to$ `primary`
- **`src/components/LoginDialog.jsx`**: `primary-circle` / `secondary-circle` $\to$ `primary` / `secondary` + `className="rounded-full"`
- **`src/features/projects/ui/ProjectError.jsx`**: `primary-large` $\to$ `primary`, `outline-large` $\to$ `outline`
- **`src/views/landing/components/HeroSection.jsx`**: `primary-large` $\to$ `primary` + `h-10 px-6 text-sm`
- **`src/views/landing/components/ModelSlider.jsx`**: `icon-ghost` $\to$ `ghost`
- **`src/widgets/dialogs/ConfirmDeleteDialog.jsx`**: `destructive` $\to$ `danger`
- **`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx`**: `groupBtn` $\to$ `ghost` + `className="size-7 p-0 rounded-full"`
- **`src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx`**: `icon-*-sm` $\to$ `secondary` / `ghost` + `size-8 p-0`
- **`src/widgets/ImportMediaDialog/ImportMediaPopover.jsx`**: `nav-tab` $\to$ `ghost`, `icon-ghost-sm` $\to$ `ghost`
- **`src/widgets/NavbarCore/ui/NavbarAction.jsx`**: Simplified variant resolution to core variants + `className`
- **`src/widgets/NavbarCore/ui/NavbarBackButton.jsx`**: `icon-ghost` $\to$ `ghost`
- **`src/widgets/NewElementDialog/NewElementDialog.jsx`**: Blur & icon variants $\to$ `ghost` + `className`
- **`src/shared/ui/FlowErrorTile.jsx`**: `icon-ghost-circle-sm` $\to$ `ghost` + `className="size-8 p-0 rounded-full"`
- **`src/shared/ui/DropdownShell.jsx`**: Segmented toggles & chips $\to$ `secondary` / `ghost`
- **`src/shared/ui/input.jsx`**: `icon-ghost` $\to$ `ghost`
- **`src/shared/ui/selector-card.jsx`**: `ghost-tile` $\to$ `ghost`
- **`src/features/media/ui/MediaViewCard.jsx`**: `ghost-tile` $\to$ `ghost`
- **`src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx`**: `blur` $\to$ `ghost`, `flow-generate` $\to$ `primary` + `rounded-full`
- **`src/features/prompt-bar/platform/parts/PromptBarSlotsRow.jsx`**: `icon-ghost-sm` $\to$ `ghost` + `size-8 p-0`
- **`src/features/prompt-bar/ui/common/MediaInput.jsx`**: `secondary-xs` $\to$ `secondary`, `icon-ghost-circle-xs` $\to$ `ghost`
- **`src/app/test-mention/page.jsx`**: `secondary-xs` $\to$ `secondary`, `ghost-xs` $\to$ `ghost`, `primary-xs` $\to$ `primary`
- **`src/components/cinema-studio/characters/CharacterDetailsGallery.jsx`**: `pill` $\to$ `ghost` + `rounded-full px-4`
- **`src/components/cinema-studio/elements/ElementDetailsGallery.jsx`**: `pill` $\to$ `ghost`, `primary-circle` $\to$ `primary`
- **`src/components/cinema-studio/elements/ElementsEmptyState.jsx`**: `primary-circle` $\to$ `primary` + `rounded-full px-4`
- **`src/components/cinema-studio/elements/NewElementCardKrea.jsx`**: `primary-circle` $\to$ `primary` + `size-8 p-0 rounded-full`
- **`src/components/cinema-studio/elements/HowToDrawer.jsx`**: `icon-ghost-circle` $\to$ `ghost`, `secondary-large` $\to$ `secondary`
- **`src/features/assets/ui/AssetsSelectionBar.jsx`**: `secondary-large` / `icon-secondary-lg` $\to$ `secondary` + `className`
- **`src/components/cinema-studio/characters/CharacterCardKrea.jsx`**: `icon-ghost-xs` $\to$ `ghost`, `icon-danger-xs` $\to$ `danger`
- **`src/components/cinema-studio/elements/ElementCardKrea.jsx`**: `icon-ghost-xs` $\to$ `ghost`, `icon-danger-xs` $\to$ `danger`
- **`src/components/cinema-studio/characters/CharacterInfoSidebar.jsx`**: `icon-ghost-xs` $\to$ `ghost` + `size-6 p-0`
- **`src/components/cinema-studio/elements/ElementInfoSidebar.jsx`**: `icon-ghost-xs` $\to$ `ghost`, `ghost-xs` $\to$ `ghost` + `h-6 px-2 text-xs`
- **`src/components/cinema-studio/characters/CharacterSheetSection.jsx`**: 10 instances of `flow-overlay-action` $\to$ `ghost` + `className`
- **`src/components/cinema-studio/characters/CharacterTabSwitch.jsx`**: `flow` $\to$ `ghost` + `h-8 px-2.5`
- **`src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx`**: `blur-circle` $\to$ `ghost` + `h-10 px-5 rounded-full`
- **`src/features/assets/ui/AssetsGroupSection.jsx`**: `icon-ghost-xs` $\to$ `ghost`
- **`src/features/assets/ui/LibraryMediaGridItem.jsx`**: `icon-ghost-xs` $\to$ `ghost`
- **`src/features/media/ui/MediaChip.jsx`**: `icon-ghost-xs` $\to$ `ghost`
- **`src/features/projects/ui/ProjectCard.jsx`**: `icon-ghost-xs` $\to$ `ghost`, `icon-danger-xs` $\to$ `danger`
- **`src/shared/ui/EditableDisplayName.jsx`**: `icon-ghost-xs` $\to$ `ghost`
- **`src/shared/ui/InlineRenamePill.jsx`**: `icon-ghost-xs` $\to$ `ghost` + `size-7 p-0`
- **`src/widgets/CoreMediaItemView/CoreMediaItemView.jsx`**: `icon-ghost-xs` $\to$ `ghost`
- **`src/widgets/EditNavbar/EditNavbar.jsx`**: `icon-ghost-xs` $\to$ `ghost` + `size-6 p-0`
- **`src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx`**: `icon-ghost-xs` $\to$ `ghost` + `size-6 p-0`
- **`src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx`**: `icon-ghost-sm` $\to$ `ghost` + `size-8 p-0`
- **`src/widgets/ElementEditNavbar/ElementEditNavbar.jsx`**: `icon-ghost-sm` $\to$ `ghost` + `size-8 p-0`
- **`src/widgets/EditMediaView/EditMediaView.jsx`**: `icon-ghost-sm` $\to$ `ghost` + `size-8 p-0`
- **`src/widgets/StudioNavbar/ui/NavbarImportButton.jsx`**: `icon-ghost` $\to$ `ghost` + `size-9 p-0`
- **`src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx`**: `icon-ghost` $\to$ `ghost`, toggles $\to$ `secondary` / `ghost`
- **`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx`**: Select triggers & toggles $\to$ `secondary` / `ghost`
- **`src/app/dev/ui/page.jsx`**: Design system showcase updated to canonical 6 variants + `className` styling

---

## 5. Verification Evidence

### 1. Vitest Unit Tests
- **Button Test Suite (`src/shared/ui/__tests__/button.test.jsx`):**
  ```
  ✓ src/shared/ui/__tests__/button.test.jsx (14 tests) 444ms
  Test Files  1 passed (1)
       Tests  14 passed (14)
  ```
  Verified:
  - Default behavior (`variant="ghost"`, `data-slot="button"`, `data-variant="ghost"`)
  - All 6 core variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`)
  - Sizing overrides via `className` (`h-10 px-6 text-sm`, `h-6 px-2 text-xs`)
  - Circular overrides via `className` (`rounded-full`)
  - Icon overrides via `className` (`size-8 p-0`)
  - Absence of removed obsolete variants in `buttonVariants`

- **Full Application Test Suite (`npx vitest run`):**
  ```
  Test Files  124 passed (124)
       Tests  819 passed (819)
    Duration  73.87s
  ```
  **100% test pass rate across all 124 test files.**

### 2. Design System Ratchet Gate (`npm run ui:check`)
```
Rule   Now  Baseline  New  Description
U1     393       448    0  raw color literal (#hex, rgb(), hsl(), oklch(), oklab()) outside token files
U2     969      1258    0  Tailwind arbitrary value (w-[437px], p-[13px], ...)
U3      13        13    0  raw <button> outside the primitives folder (use the Button primitive)
U4       8         8    0  fetch( inside components/, features/, or widgets/ (use the API client or a hook)
U5      94        97    0  inline style={{ }} (use tokens/classes; allowed only for truly dynamic values)
U6       0         0    0  dead radius class (rounded-button, rounded-card, rounded-dialog, rounded-badge, rounded-input)

ui-check: OK (no new violations)
```
- **Zero new violations across all rules U1–U6.**
- U1 raw color literals dropped from baseline 448 down to 393 (-55 violations).
- U2 arbitrary Tailwind values dropped from baseline 1258 down to 969 (-289 violations).

### 3. ESLint Gate (`npx eslint --quiet`)
```
Exit code: 0 (Zero lint errors)
```

### 4. Next.js Turbopack Production Build (`npm run build`)
```
▲ Next.js 16.2.1 (Turbopack)
✓ Compiled successfully in 8.8s
  Running TypeScript ...
  Finished TypeScript in 2.3s ...
✓ Generating static pages using 11 workers (14/14) in 662ms
  Finalizing page optimization ...
Exit code: 0
```
All 14 static application routes generated without build warnings or failures.

---

## 6. Documentation Synchronization

Both canonical specifications have been updated to reflect the simplified 6-variant architecture:
1. `design.md` (root design specification)
2. `my-app/docs/ui-system/design.md` (frontend design specification)
