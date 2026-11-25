# Design System Domain Glossary (`GLOSSARY.md`)

## Table A — Canonical `DESIGN.md` Tokens & 12 Base UI Primitives

### Canonical Surfaces & Colors
| Canonical Token / Class | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `bg-[#0E1015]` / `--body-bg` | `#0E1015` (`rgb(14, 16, 21)`) | Root Body Background |
| `bg-[#09090B]` / `bg-black` | `#09090B` (`rgb(9, 9, 11)`) | Deep Canvas & Media Preview Stage |
| `bg-omni-bg` (`bg-[#1A1A1A]`) | `#1A1A1A` (`rgb(26, 26, 26)`) | App Workspace, Left Sidebar & Header Surface |
| `bg-secondary` / `bg-accent` | `#27272A` (`rgb(39, 39, 42)`) | Secondary buttons, active sidebar items, outline borders |
| `bg-white/5 backdrop-blur-2xl` | `rgba(255, 255, 255, 0.05)` | Frosted Section Cards (`rounded-[28px] px-8 py-6`) |
| `bg-white/10` | `rgba(255, 255, 255, 0.10)` | Tonal controls, pill select triggers, inactive pill tabs |
| `hover:bg-white/15` / `hover:bg-white/[0.18]` | `rgba(255, 255, 255, 0.15)` – `0.18` | Hover state for tonal buttons & compact pills |
| `.surface-glass` | `rgba(68, 68, 68, 0.50)` + `blur(40px)` | Floating dropdown and context menus |
| `bg-[#242426]/95` | `rgba(36, 36, 38, 0.96)` + `blur(40px)` | Select listbox menu surface |
| `text-white` / `text-[#FAFAFA]` | `#FFFFFF` / `#FAFAFA` | Primary typography |
| `text-black` / `text-[#18181B]` | `#000000` / `#18181B` | Primary inverse typography (inside white CTAs & active tabs) |
| `text-white/70` | `rgba(255, 255, 255, 0.70)` | Body muted text |
| `text-muted-foreground` | `#A1A1AA` | Muted shortcuts and secondary labels |
| `text-white/50` | `rgba(255, 255, 255, 0.50)` | Section headers, subtitles, helper text |
| `text-white/25` | `rgba(255, 255, 255, 0.25)` | Disabled text / icons |
| `border-border` / `border-input` | `#27272A` | Structural borders & input borders |
| `border-white/10` | `rgba(255, 255, 255, 0.10)` | Subtle glass borders & preview frames |
| `border-dashed border-white/[0.18]` | `rgba(255, 255, 255, 0.18)` | Dashed media & upload slots |
| `focus-visible:ring-white/70` | `rgba(255, 255, 255, 0.70)` | Dual focus strategy (Workspace/Editor controls) |
| `text-accent-yellow` | `#FFC241` / `#FFC141` | Pro upgrade banners, warning badges |
| `bg-error` | `#E5484D` | Error / notification indicator dot |

### The 12 Base UI Primitives (Single Source of Truth: `./DESIGN.md`)
1. **01. Button (Solid Normal)**: `Primary White` (`h-9.5 px-4 rounded-[10px] bg-white text-black text-base font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70`) & `Secondary Dark` (`bg-[#27272A] text-[#FAFAFA]`).
2. **02. Button (Tonal Translucent)**: `Standard Tonal` (`h-9.5 px-3 rounded-[10px] bg-white/10 text-[#FAFAFA] text-base hover:bg-white/15`) & `Compact Pill` (`h-8 rounded-full bg-white/10 pl-3 pr-2 text-sm hover:bg-white/[0.18]`).
3. **03. Button (Ghost Transparent)**: `Ghost Button` (`h-9 px-4 rounded-[10px] bg-transparent text-white hover:bg-white/10`), `Subtle Row`, `Text Link` (`text-sm text-white/50 hover:text-white`).
4. **04. Button (Outline Bordered)**: `h-[34px] p-2 rounded-[10px] border border-[#27272A] bg-transparent text-sm font-medium text-[#FAFAFA] hover:bg-[#27272A]/50`.
5. **05. IconButton**: `size-9.5 (38x38px) rounded-[10px] p-2.5 bg-transparent text-white hover:bg-white/10 focus-visible:ring-0`.
6. **06. PillSelect & Dropdown**: Trigger `h-9.5 w-[200px] rounded-full bg-white/10 pl-5 pr-4 text-base hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70` + Dropdown `.surface-glass` / `bg-[#242426]/95` with items `h-[36px] px-2.5 rounded-xl hover:bg-white/20`.
7. **07. PillTabs**: `h-8 rounded-full px-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow`.
8. **08. SectionCard & Accordion**: Card `rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6` + Accordion trigger `h-6 w-full flex justify-between text-sm font-medium uppercase leading-[18px] tracking-[0.1px] text-white/50`.
9. **09. DashedUploadSlot**: `size-16` or `h-[72px] w-24 rounded-2xl border border-dashed border-white/[0.18] bg-white/5 hover:bg-white/10`.
10. **10. InteractiveListRow**: Compact ratio row `h-12 px-3 rounded-lg bg-transparent hover:bg-white/5` & Thumbnail preview row `h-[72px] w-24 rounded-2xl border border-white/10 bg-white/5`.
11. **11. Switch, Input, Checkbox & Label**: Switch `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white` (thumb `size-[18px] bg-white data-[checked]:bg-[#09090B]`); Input `h-7 rounded-lg` (`small` `13px · 400 · 1.3 · -0.20px`); Label (`@/components/base/label`, `.ds-label` / `.ds-label-caption` / `.ds-label-primary`, `as="label"|"span"|"div"`, `variant="default"|"caption"|"primary"`, `disabled`, sentence case).
12. **12. Badge & StatusBanner**: Badge `rounded-md px-1.5 py-0.5` (`micro-tag` `11px · 450 · 1.3`) `bg-white/10 text-[#FAFAFA]`; StatusBanner `rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4`.

### Canonical 10-Token Typography Scale (`src/styles/tokens/typography.css`) & Text Roles (`text-roles.css`)
Primary sans-serif typeface: **`Inter`** (`--font-sans: var(--font-inter), "Inter", var(--font-geist-sans), "Geist Sans", ui-sans-serif, system-ui, sans-serif`, variable 100–900 loaded on `<html>` & `<body>`; monospace: `Geist Mono` via `--font-mono`).
ONLY `typography.css` (10 tokens: `--type-<name>-{size,weight,leading,tracking}` + `.ds-type-<name>`) and `text-roles.css` (semantic roles: `.ds-label*`, `.ds-text-button*`, `.ds-text-nav`, `.ds-text-tab`, `.ds-text-input`, `.ds-text-menu`, `.ds-text-badge`, `.ds-text-body`) define text sizing across the entire SaaS — including ALL sidebars. Legacy aliases (`--type-size-*`, `--type-leading-*`, `.ds-text-caption-*`, `.ds-text-body-*`, `.ds-text-h-*`, `.ds-text-display`, `.ds-text-control`, `.text-h4..body-xs`), custom `clamp(...)` font sizes, and special sidebar typography rules are eliminated.

| Tier 1 Token (`--type-*` / `.ds-type-*`) | Size | Weight | Line Height | Tracking | Semantic Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-hero` | `48px` (`3rem`) | `400` | `1` | `-1.2px` | Hero display headlines |
| `section-heading` | `40px` (`2.5rem`) | `400` | `1.05` | `-1px` | Major section headings |
| `sub-heading` | `36px` (`2.25rem`) | `400` | `1` | `-0.9px` | Secondary section headings |
| `card-title` | `24px` (`1.5rem`) | `400` | `1` | `0` | Page, folder & card titles |
| `feature-title` | `20px` (`1.25rem`) | `400` | `1` | `0` | Feature & dialog titles |
| `body` | `16px` (`1rem`) | `400` | `1.4` | `-0.16px` | `.ds-text-body`, `.ds-composer-tab` |
| `button` | `14px` (`0.875rem`) | `600` | `1.25` | `0` | `.ds-text-button`, `.ds-btn-*` |
| `caption-label` | `14px` (`0.875rem`) | `500` | `1.3` | `0.35px` | `.ds-label-caption`, `.ds-text-nav`, `.ds-text-tab`, `.ds-nav-item`, `.ds-tab-pill` |
| `small` | `13px` (`0.8125rem`) | `400` | `1.3` | `-0.20px` | `<Label>` (`.ds-label`), `.ds-text-input`, `.ds-text-menu`, `.ds-input*`, `.ds-menu-item`, `.ds-select-trigger`, `.ds-list-row`, `.ds-slider-stepped-label/value` |
| `micro-tag` | `11px` (`0.6875rem`) | `450` | `1.3` | `0` | `.ds-text-badge`, `.ds-badge*`, compact 3-col preset chips |

### Edit Inspector Sidebar Layout-Only Geometry Classes (`src/app/globals.css`)
Layout geometry ONLY (zero font rules — all typography uses canonical `<Button>`, `.ds-text-tab`, `.ds-type-caption-label`, `.ds-type-small`, and `<Label>`).

| Canonical Token / Class | Geometry Only | Semantic Role |
| :--- | :--- | :--- |
| `--edit-sidebar-width` | `280px` | Desktop (`≥640px`) Edit Inspector Sidebar rail width |
| `.ds-edit-sidebar-rail` | `w-full`, `sm: 280px` | Right inspector rail container (`@layer components`) |
| `.ds-edit-sidebar-header` | `flex`, `gap: 4px`, `padding: 12px 16px` | Top header row container |
| `.ds-edit-sidebar-action-btn` | `height: 32px`, `px: 12px`, `gap: 4px` | Header action button geometry (`Button` inherits `button` type) |
| `.ds-edit-sidebar-tabs` | `flex`, `height: 48px`, `gap: 4px`, `px: 8px` | Tab strip container (`Edits` / `Info`) |
| `.ds-edit-sidebar-tab` | `height: 28px`, `padding: 4px 8px`, `radius: --radius-subtle` | Tab button geometry (composed with `.ds-text-tab`) |
| `.ds-edit-sidebar-tool-row` | `height: 40px`, `padding: 8px`, `gap: 4px`, `radius: --radius-subtle`, hover `--surface-tonal` | Tool launcher row geometry (label uses `.ds-type-caption-label`) |

### Strict 4-Token Border-Radius System (`src/styles/tokens/radius.css`)
Defined via Tailwind v4 `@theme` — single source of truth for all CSS `var(--radius-*)` variables and native `rounded-*` classes (zero legacy `rounded-xs..3xl` or arbitrary `rounded-[*]`).

| Token / Utility | Value | Semantic Role |
| :--- | :--- | :--- |
| `--radius-none` / `rounded-none` | `0px` | Full-bleed canvases, docked panels, flush edges |
| `--radius-sharp` / `rounded-sharp` | `4px` | Badges (`.ds-badge*`), checkboxes, `kbd`, micro tags/chips |
| `--radius-subtle` / `rounded-subtle` | `6px` | All buttons, icon buttons, inputs, textareas, select triggers, tabs, menu items, list rows, stepped sliders |
| `--radius-comfortable` / `rounded-comfortable` | `8px` | Dialogs, popovers, hover cards, tooltips, dropdown/menu panels, cards, upload slots, banners |
| `rounded-full` *(true circles only)* | `9999px` | Avatars, toggle switches & thumbs, circular slider thumbs, radio dots, color swatches, status dots, spinners |

### Canonical Icon Size & Weight Tokens (`src/styles/tokens/icons.css`)
Single source of truth for `<HugeIcon size="2xs|xs|sm|md|lg|xl|2xl|3xl" weight="light|regular|medium|bold" />` and `.ds-icon-*` / `.ds-icon-weight-*` utilities (`--icon-optical-scale: 1.12`).

| Token / Utility | Value | Semantic Role |
| :--- | :--- | :--- |
| `--icon-size-2xs` / `.ds-icon-2xs` | `0.625rem` (`10px`) | Tiny badges, video play indicator |
| `--icon-size-xs` / `.ds-icon-xs` | `0.75rem` (`12px`) | Badges, checkboxes, radio dots, chevrons, `xs` controls |
| `--icon-size-sm` / `.ds-icon-sm` | `0.875rem` (`14px`) | Compact buttons, inputs, menus, tabs, dropdown chevrons |
| `--icon-size-md` / `.ds-icon-md` | `1rem` (`16px`) | Default standalone icons, sidebar nav, toolbar & overlay icon buttons |
| `--icon-size-lg` / `.ds-icon-lg` | `1.25rem` (`20px`) | Large CTAs, edit sidebar tool row icons, dialog close |
| `--icon-size-xl` / `.ds-icon-xl` | `1.5rem` (`24px`) | Feature cards, dropzone/upload icons, section accents |
| `--icon-size-2xl` / `.ds-icon-2xl` | `2rem` (`32px`) | Empty-state & dialog hero icons |
| `--icon-size-3xl` / `.ds-icon-3xl` | `2.5rem` (`40px`) | Large empty-state / landing hero icons |
| `--icon-weight-{light,regular,medium,bold}` | `300` / `400` / `500` / `700` (`--icon-stroke-*`: `1.25` / `1.5` / `1.75` / `2.25`) | `.ds-icon-weight-*` (`weight` prop on `<HugeIcon>`) |

---

## Table B — Banned Legacy Tokens, Classes & Files (Must Reach 0 Occurrences)

### Banned Files to Delete
- `src/app/google-flow-tokens.css`
- `src/app/saas-tokens.css`

### Banned CSS Variables & Prefixes
- `--qc-*` (e.g., `--qc-background-primary`, `--qc-brand-primary`, etc.)
- `--hf-*` (e.g., `--hf-color-text-primary`, `--hf-color-lime-*`, etc.)
- `--mat-*` (legacy Material Design tokens: `--mat-sys-*`, `--mat-menu-*`, etc.)
- `--color-lime` / `--color-brand-neon`
- `--surface-container*` / `--on-surface*` / `--outline*` (old Material 3 tokens)

### Banned Classes & Selectors
- `.q-*` (legacy Quick / QC classes)
- `.hf-*` (legacy HuggingFace / HF classes)
- `.mat-*` / `mat-icon`
- Generic Tailwind grays/slates: `bg-slate-*`, `bg-gray-*`, `text-slate-*`, `text-gray-*`, `border-slate-*`, `border-gray-*`

### Banned Hex Colors
- `#d1fe17` (legacy lime accent)
- `#EFFE17` (legacy brand neon)
- Old canvas backgrounds: `#0f1113`, `#131416`, `#1c1e20`, `#282a2c`
- Any ad-hoc hex color outside the authorized set:
  `{#0E1015, #09090B, #1A1A1A, #27272A, #242426, #FFFFFF, #FAFAFA, #18181B, #000000, #A1A1AA, #D4D4D8, #FFC241, #FFC141, #E5484D, #44444480}`
