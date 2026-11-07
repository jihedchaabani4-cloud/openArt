# Runway-to-OpenArt Design System Mapping

**Document Version:** 1.0.0  
**Date:** 2026-11-05  
**Source Specification:** Runway Design System (`docs/design-system/runwayml.design.md`)  
**Target Application:** OpenArt / Labveil Frontend (`my-app`)  

---

## 1. Executive Precedence & Principles

1. **Visual Authority:** Runway Design is the authority for spacing, dimensions, border radiuses, typography hierarchy, border weights, surface depth, and interaction states.
2. **Brand Identity Exception:** OpenArt brand colors are 100% preserved. Runway's monochrome / cool-slate palette does **not** replace OpenArt's functional surfaces, neon accents (`#EFFE17`), status tokens (`#fe6e6e`, `#80da88`, `#fcbd00`), or links (`#a8c7fa`).
3. **Variant API Backward Compatibility:** All 6 current public Button variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`) remain intact with their exact names and prop contracts.
4. **Zero Box-Shadow Law:** Runway mandates zero box-shadows across all surfaces (`shadow-none`). Depth is achieved purely through 1px hairline borders (`border-white/10`), surface background contrast, and full-bleed imagery.

---

## 2. Token & Foundation Mapping

| Design Concern | Runway Specification | Current OpenArt Implementation | Target Token / Utility | Migration Action | Affected Files | Risk & Validation Method |
|---|---|---|---|---|---|---|
| **Border Radius: None** | `0px` (`none`) | `rounded-none` / `0px` | `--radius-none: 0px` (`rounded-none`) | Preserved | `globals.css` | Zero risk. Validated via `ui:check`. |
| **Border Radius: Sharp** | `4px` (`sharp`) | `rounded-sm` / `rounded-sharp` (`4px`) | `--radius-sharp: 4px` (`rounded-sm`, `rounded-sharp`) | Mapped to Buttons, Inputs, Badges, Tooltips, Checkboxes | `src/shared/ui/button.jsx`, `input.jsx`, `badge.jsx`, `checkbox.jsx` | Low risk. Checked via `primitives.test.jsx`. |
| **Border Radius: Subtle** | `6px` (`subtle`) | `rounded-md` / `rounded-subtle` (`6px`) | `--radius-subtle: 6px` (`rounded-md`, `rounded-subtle`) | Mapped to Secondary tags, intermediate chips | `src/features/media/ui/MediaChip.jsx` | Low risk. Checked via component tests. |
| **Border Radius: Comfortable** | `8px` (`comfortable`) | `rounded-lg` / `rounded-comfortable` (`8px`) | `--radius-comfortable: 8px` (`rounded-lg`, `rounded-comfortable`) | Mapped to Cards, Dropdowns, Context Menus, Popovers, Panels | `src/shared/ui/card.jsx`, `dropdown-menu.jsx`, `popover.jsx` | Low risk. Validated via visual check in `/dev/ui`. |
| **Border Radius: Generous** | `16px` (`generous`) | `rounded-2xl` / `rounded-generous` (`16px`) | `--radius-generous: 16px` (`rounded-2xl`, `rounded-generous`) | Mapped to Dialogs, Modals, Full Overlays, Alert containers | `src/shared/ui/dialog.jsx`, `ConfirmDeleteDialog.jsx` | Low risk. Checked via modal unit tests. |
| **Border Radius: Full** | N/A in pure Runway, but required for OpenArt pills & circular controls | `rounded-full` (`9999px`) | `--radius-full: 9999px` (`rounded-full`) | Preserved for pills, avatars, switch thumbs, radio dots | `src/shared/ui/avatar.jsx`, `switch.jsx`, `radio-group.jsx` | Zero risk. Prevents regression in existing circular controls. |
| **Elevation / Box Shadows** | Zero box shadows (`none`). Depth via section contrast & photography | Legacy classes had `shadow-sm`, `shadow-md`, `shadow-xs` | `--shadow-*: none` + `shadow-none` | Replaced across all shared components and feature cards | `globals.css`, `card.jsx`, `button.jsx`, `dialog.jsx` | Zero new shadow violations. Checked via `ui:check` and theme tests. |
| **Spacing Scale** | 8px base scale: 4px (xxs), 6px (xs), 8px (sm), 12px (md), 16px (base), 20px (lg), 24px (xl), 28px (xxl), 32px (section), 48px (section-lg), 64px (section-xl), 78px (section-xxl) | Tailwind standard scale (4px steps) | `--spacing-xxs` through `--spacing-section-xxl` in `@theme inline` | Replaced / Standardized | `globals.css`, layout wrappers | Low risk. Checked via layout unit tests. |
| **Cinema Max-Width** | 1600px max content width on full-bleed sections | `max-w-7xl` (1280px) or `max-w-screen-2xl` | `--container-cinema: 1600px` (`max-w-[1600px]` / `max-w-cinema`) | Replaced for full-bleed studio views | `src/widgets/StudioLayout/` | Low risk. Checked via responsive layout tests. |
| **Typography: Font Family** | `abcNormal` (geometric sans-serif) | `Google Sans Text`, `Google Sans`, `Inter` | `var(--font-sans)` with fallback chain | Preserved OpenArt Google Sans font assets while adopting Runway sizing & line-heights | `globals.css`, `layout.js` | Zero risk. Prevents external font loading breakage. |
| **Typography: Headlines & Line Heights** | Display line-height 1.00 with -0.9px to -1.2px tracking | Default Tailwind line-heights (1.25 - 1.5) | Tight display titles (`leading-none tracking-tight`) | Mapped to hero headings, section markers | `src/views/landing/`, feature headings | Low risk. Visual inspection in `/dev/ui`. |
| **Brand Colors** | Monochrome (#000000, #ffffff, #767d88 cool-slate) | OpenArt dark palette (`#000000` canvas, `#131314` panel, `#1e1f20` card, `#282a2c` elevated, `#EFFE17` neon, `#a8c7fa` blue, `#fe6e6e` danger) | Preserved OpenArt tokens (`--surface-canvas`, `--surface-panel`, `--surface-card`, `--color-brand-neon`) | 100% PRESERVED. Runway roles mapped to OpenArt equivalents. | `globals.css`, token definitions | Zero risk to brand identity. Strict gate adherence. |

---

## 3. Shared Component Mapping Table

| Component | Runway Spec / Role | Existing OpenArt API & Variants | Target Migration Styling | API Status |
|---|---|---|---|---|
| **`Button`** | 14px font, weight 600, 4px radius (`sharp`), 1px border on transparent (`button-primary`) or subtle fill | `primary`, `secondary`, `outline`, `ghost`, `danger`, `link` | Retain all 6 variants; ensure default radius is `rounded-sm` (4px), height 32px (`h-8`), zero shadow (`shadow-none`) | **PRESERVED 100%** (no variant removed, no generic size/shape added) |
| **`Input`** | Form inputs (restrained 4px radius, subtle hairline border) | Default, search, error states | `rounded-sm` (4px), hairline `border-white/10`, `shadow-none`, height `h-10` | PRESERVED |
| **`Textarea`** | Form input multi-line (restrained 8px radius, subtle border) | Default textarea | `rounded-lg` (8px), hairline `border-white/8`, `shadow-none` | PRESERVED |
| **`Card`** | `research-card` / `image-card` with 8px radius (`comfortable`), zero shadow | Default `Card`, `CardHeader`, `CardContent`, etc. | `rounded-lg` (8px), `border-white/5`, `shadow-none` | PRESERVED |
| **`Dialog`** | `alert-container` / modal with 16px radius (`generous`), 1px hairline border | Default `Dialog`, `DialogContent`, `DialogHeader`, etc. | `rounded-2xl` (16px), `border-white/10`, `shadow-none`, backdrop blur | PRESERVED |
| **`DropdownMenu`** | Surface panel with 8px radius (`comfortable`), zero shadow | Default `DropdownMenuContent`, `DropdownMenuItem` | `rounded-lg` (8px), `border-white/10`, `shadow-none`, items with 4px radius | PRESERVED |
| **`Badge`** | 11px uppercase tag / micro-label (`micro-tag`) | `default`, `secondary`, `outline`, `neon`, `destructive` | `rounded-sm` (4px), 11px uppercase tracking, `shadow-none` | PRESERVED |
| **`Checkbox`** | 16x16px control with 4px radius (`sharp`) | Default checkbox, neon variant | `rounded-sm` (4px), hairline border, `shadow-none` | PRESERVED |
| **`Switch`** | Full rounded pill control | Default switch, neon variant | `rounded-full` (9999px), flat track, zero shadow | PRESERVED |
| **`Slider`** | Full rounded track and thumb | Radix Slider primitive | `rounded-full` track & thumb, zero shadow | PRESERVED |
| **`Tabs`** | Sub-navigation trigger list | Default `TabsList`, `TabsTrigger` | `rounded-lg` container, `rounded-sm` active tab trigger, zero shadow | PRESERVED |

---

## 4. Feature Slices Breakdown (Phase 4 Plan)

1. **Slice 1: Shell & Navigation (`src/widgets/StudioNavbar/`, `LeftNavigationRail.jsx`)**
   - Hairline borders (`border-white/10`), zero shadows, 4px radius on action buttons, 8px radius on menus.
2. **Slice 2: Cinema Studio Core (`src/app/cinema-studio/`, `src/widgets/StudioLayout/`)**
   - Full-bleed layouts, 1600px cinema container width, 8px radius on media items, zero shadows.
3. **Slice 3: Prompt Bar Platform (`src/features/prompt-bar/`)**
   - Restrained controls row, 4px radius on select pills & buttons, zero shadows, clean hairline dividers.
4. **Slice 4: Elements & Characters (`src/components/cinema-studio/elements/`, `characters/`)**
   - 8px radius on cards (`ElementCardKrea`, `CharacterCardKrea`), 16px radius on modal dialogs, zero shadows.
5. **Slice 5: Assets & Library (`src/features/assets/ui/`, `src/features/media/ui/`)**
   - 8px comfortable radius on library grid items, zero shadows.
6. **Slice 6: Payments & Settings (`src/features/payments/ui/`, settings pages)**
   - 8px radius on pricing cards, 16px radius on package selection dialog.
