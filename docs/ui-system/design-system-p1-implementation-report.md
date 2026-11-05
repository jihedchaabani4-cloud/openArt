# Phase P1 Implementation Report — Shared UI Components Improvements

**Date:** November 5, 2026  
**Status:** Complete — All P1 Tasks Executed & Verified  
**Branch:** `runway-design`  
**Reference:** `design.md` (Canonical Runway Design Specification)

---

## Executive Summary

Phase P1 has successfully improved component encapsulation across shared UI primitives, eliminating call-site styling hacks in feature components without altering existing designs or breaking default behaviors.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase P1 Verification Overview                                                         │
├───────────────────────────────┬────────────────────────────┬───────────────────────────┤
│ Verification Suite            │ Result                     │ Metrics                   │
├───────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Full Vitest Suite             │ PASS (100%)                │ 123/123 files, 792 tests  │
│ UI Ratchet Gate (ui:check)    │ PASS (0 new violations)    │ U1: 471, U2: 1087, U6: 0  │
│ ESLint                        │ PASS (0 errors)            │ 231 pre-existing warnings │
│ Next.js Production Build      │ PASS (0 errors)            │ Turbopack compiled 31/31  │
└───────────────────────────────┴────────────────────────────┴───────────────────────────┘
```

---

## 1. Task P1-1: Add `variant="pill"` to `<ButtonGroup />`

### Problem Solved
Previously, `<ButtonGroup />` in `button-group.jsx` only offered a single hardcoded styling (`bg-[var(--foreground-state-05)] rounded-sm p-1`). Media cards in `MediaGridItem.jsx` were forced to override geometry and styles at the call site:
```jsx
// Before: call site hacked geometry, background, blur, and border
<ButtonGroup className="bg-white/60 backdrop-blur-md rounded-full border-0 border-none">
  ...
</ButtonGroup>
```

### Implementation Details
Updated `src/shared/ui/button-group.jsx` using CVA (`class-variance-authority`):
```jsx
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonGroupVariants = cva(
  "flex items-center max-w-fit gap-0.5 border-0 border-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--foreground-state-05)] rounded-sm p-1",
        pill: "bg-white/60 backdrop-blur-md rounded-full p-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ButtonGroup = React.forwardRef(({ className, variant, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="button-group"
      data-variant={variant || "default"}
      className={cn(buttonGroupVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
})
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup, buttonGroupVariants }
```

### Feature Migration in `MediaGridItem.jsx`
Migrated all 3 call sites in `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`:
- Line 458 (Trash actions trigger): `<ButtonGroup variant="pill">`
- Line 472 (Done item like + more actions): `<ButtonGroup variant="pill">`
- Line 1032 (Hover action pill): `<ButtonGroup variant="pill">`

### Tests
- Added unit tests in `src/shared/ui/__tests__/button-group.test.jsx` covering both `default` (4px `rounded-sm`) and `pill` (capsule `rounded-full`, `bg-white/60`, `backdrop-blur-md`).
- Synchronized assertion in `src/widgets/StudioLayout/__tests__/StudioLayoutAlignment.test.jsx:187` to assert `<ButtonGroup variant="pill">`.

---

## 2. Task P1-2: Add Circular Icon Button Support (`shape="circle"`)

### Problem Solved
Features frequently passed `className="rounded-full"` to override the Button's default 4px geometry (`rounded-sm`), violating component encapsulation:
```jsx
// Before: call site manually overriding radius
<Button size="icon-sm" className="rounded-full text-white/50" />
```

### Architectural API Decision
**Option A (`shape="circle"`) was selected** because:
1. It decouples icon dimensions (`size="icon"`, `size="icon-sm"`, `size="icon-xs"`) from geometry (`shape="circle"`).
2. It avoids combinatorial size explosion (`icon-circle-xs`, `icon-circle-sm`, `icon-circle-lg`).
3. `tailwind-merge` in `cn()` cleanly replaces the base `rounded-sm` with `rounded-full`.
4. It preserves all 45+ existing variants and default Button behavior without regression.

### Implementation Details
Updated `src/shared/ui/button.jsx`:
```jsx
// Inside buttonVariants cva definition:
shape: {
  default: "",
  circle: "rounded-full",
},
defaultVariants: {
  variant: "default",
  size: "default",
  shape: "default",
},

// Inside Button component:
const Button = React.forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "default",
    shape = "default",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-shape={shape !== "default" ? shape : undefined}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props} />
  );
});
```

### Feature Migrations
1. **`PromptBarControlsRow.jsx:83-96`**:
   - Before: `size-8 min-w-8 p-0 rounded-full flex items-center justify-center` in `className`.
   - After: `<Button variant="flow-generate" size="icon-sm" shape="circle" className={cn("shrink-0", ...)}>`
   - Result: Button primitive owns `size-8 p-0` via `size="icon-sm"` and `rounded-full` via `shape="circle"`.
2. **`NewElementDialog.jsx:268, 346`**:
   - Close button: `<Button variant="ghost" size="icon-sm" shape="circle" className="text-white/50 hover:text-white">`
   - Thumbnail remove button: `<Button variant="blur" size="icon-sm" shape="circle" className="absolute top-3 right-3">`
   - Result: Redundant `rounded-full` classes removed from call sites.
3. **`ActionBtn.jsx:5-15`**:
   - Before: `className="... rounded-full border-0 border-none shadow-none"`
   - After: `<Button ref={ref} variant="groupBtn" size="icon" shape="circle" className={cn("h-7 w-7 transition-all text-[#303031] hover:bg-white/90 border-0 border-none shadow-none", className)}>`
   - Result: `<Button shape="circle">` owns the circular geometry.

### Tests
- Added unit tests in `src/shared/ui/__tests__/button.test.jsx` verifying:
  - Default buttons render with sharp 4px (`rounded-sm`).
  - `shape="circle"` renders with capsule `rounded-full` and replaces `rounded-sm`.
  - Independent control of dimensions (`size="icon-xs"`, `size="icon-sm"`, `size="icon"`) and shape (`shape="circle"`).

---

## 3. Task P1-3: Prune Dead `CreateElementModal.jsx`

### Dead-Code Verification Evidence
An exhaustive AST and grep analysis proved `CreateElementModal.jsx` was 100% dead:
1. **Zero Callers**:
   - Neither `src/app/` (routes), `src/widgets/`, nor `src/features/` imported or referenced `<CreateElementModal>`.
   - The application has completely transitioned to `NewElementDialog.jsx` across `/cinema-studio/[projectId]/elements` and `/elements/new`.
2. **Zero Tests**:
   - Not a single test file imported or asserted `CreateElementModal`.
3. **Only Hanging Reference**:
   - The barrel file `src/components/cinema-studio/elements/index.js` re-exported `CreateElementModal`.

### Deletion & Cleanup
- Deleted `my-app/src/components/cinema-studio/elements/CreateElementModal.jsx` (202 lines of legacy HTML and obsolete class hacks removed).
- Removed line 6 re-export from `src/components/cinema-studio/elements/index.js`.
- `ui-baseline.json` was left strictly untouched (rule adherence). Ratchet gate passes with 0 new violations.

---

## 4. Verification Summary

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Quality Gates Results                                                                  │
├───────────────────────────────┬────────────────────────────┬───────────────────────────┤
│ Check                         │ Command                    │ Result                    │
├───────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Vitest Unit & Integration     │ npx vitest run             │ 123 passed (792 tests)    │
│ UI Ratchet Gate               │ npm run ui:check           │ OK (0 new violations)     │
│ ESLint                        │ npm run lint               │ 0 errors (231 warnings)   │
│ Production Turbopack Build    │ npm run build              │ 31/31 routes compiled OK  │
└───────────────────────────────┴────────────────────────────┴───────────────────────────┘
```
