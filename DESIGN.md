# SaaS Dark UI — Design System & Tokens (`DESIGN.md`)

This document defines the complete visual language, CSS/Tailwind tokens, typography scale, radius hierarchy, and pure Base UI Components extracted from the reference Dark SaaS interface.

---

## 1. Core Philosophy & Visual Direction

1. **Layered Translucent Dark Surfaces**: Instead of heavy solid borders everywhere, hierarchy is created by layering translucent white fills (`bg-white/5`, `bg-white/10`, `bg-white/15`, `bg-white/20`) with `backdrop-filter: blur(40px)` (`backdrop-blur-2xl`) over a matte charcoal canvas (`#1A1A1A`).
2. **High-Contrast Primary Actions**: Primary calls-to-action and active states use pure white (`#FFFFFF` / `#FAFAFA`) with deep black/zinc text (`#000000` / `#18181B`) so the active element is unmistakable without relying on loud neon colors.
3. **Strict 4-Token Corner Geometry (`src/styles/tokens/radius.css`)**: All rectangular surfaces use strictly `rounded-none` (`0px`), `rounded-sharp` (`4px` — badges, checkboxes, micro tags), `rounded-subtle` (`6px` — buttons, icon buttons, inputs, tabs, menus, rows), and `rounded-comfortable` (`8px` — cards, dialogs, popovers, upload slots, banners). `rounded-full` is reserved exclusively for true circles (avatars, switches, slider thumbs, radio dots, color swatches, status dots, circular spinners).
4. **Dual Focus Strategy**:
   - **Workspace / Editor Surfaces**: Buttons inside main content panels use `focus-visible:ring-2 focus-visible:ring-white/70` (`rgba(255, 255, 255, 0.7)`).
   - **Toolbar / Chrome Controls**: Compact icon buttons use `focus-visible:ring-0` to avoid visual clutter during rapid mouse clicking.

---

## 2. Color & Surface Tokens

### 2.1 Base Surfaces & Backgrounds

| Token Name | CSS / Tailwind Class | Exact Value (RGB / Hex) | Usage |
| :--- | :--- | :--- | :--- |
| **Root Body Background** | `bg-[#0E1015]` | `rgb(14, 16, 21)` / `#0E1015` | Underlying document body background |
| **Deep Canvas / Preview** | `bg-[#09090B]` / `bg-black` | `rgb(9, 9, 11)` / `#09090B` | Deep contrast stage, video/canvas preview frame |
| **App & Sidebar Surface** | `bg-omni-bg` (`bg-[#1A1A1A]`) | `rgb(26, 26, 26)` / `#1A1A1A` | Main workspace background, sticky header, and left sidebar |
| **Secondary / Accent Surface** | `bg-secondary` / `bg-accent` | `rgb(39, 39, 42)` / `#27272A` | Secondary buttons, active sidebar triggers, hover fills |
| **Section Card (Frosted)** | `bg-white/5 backdrop-blur-2xl` | `rgba(255, 255, 255, 0.05)` + `blur(40px)` | Collapsible settings/content cards (`rounded-[28px]`) |
| **Tonal Control Surface** | `bg-white/10` | `rgba(255, 255, 255, 0.10)` | Tonal buttons, pill select triggers, inactive pill tabs, badges |
| **Tonal Hover Surface** | `hover:bg-white/15` / `white/[0.18]` | `rgba(255, 255, 255, 0.15)` – `0.18` | Hover state for tonal buttons, pill triggers, and upload slots |
| **Floating Glass Menu** | `surface-glass` (`#44444480`) | `rgba(68, 68, 68, 0.50)` + `blur(40px)` | Floating dropdown menus and context menus |
| **Select Listbox Surface** | `bg-[#242426]/95` | `rgba(36, 36, 38, 0.96)` + `blur(40px)` | Floating select picker listbox menu |

### 2.2 Text & Icon Colors

| Token Name | CSS / Tailwind Class | Exact Value (RGB / Hex) | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Text** | `text-white` / `text-[#FAFAFA]` | `#FFFFFF` / `rgb(250, 250, 250)` | Headings, button labels, active navigation |
| **Primary Inverse Text** | `text-black` / `text-[#18181B]` | `#000000` / `rgb(24, 24, 27)` | Text inside white Primary Buttons & active Pill Tabs |
| **Body Muted (70%)** | `text-white/70` | `rgba(255, 255, 255, 0.70)` | Secondary descriptions, selected option summaries |
| **Muted Foreground** | `text-muted-foreground` | `rgb(161, 161, 170)` / `#A1A1AA` | Sidebar group labels, shortcuts (`SRT`, `⌘K`) |
| **Subtitle / Section (50%)** | `text-white/50` | `rgba(255, 255, 255, 0.50)` | Page subtitles, uppercase section headers, helper text, icons |
| **Disabled Text / Icon (25%)** | `text-white/25` | `rgba(255, 255, 255, 0.25)` | Disabled slot labels, locked icons (`--text-disabled`) |

### 2.3 Borders, Dividers & Accents

| Token Name | CSS / Tailwind Class | Exact Value (RGB / Hex) | Usage |
| :--- | :--- | :--- | :--- |
| **Structural Border** | `border-border` / `border-input` | `rgb(39, 39, 42)` / `#27272A` | Sidebar right divider, outline buttons, inputs |
| **Subtle Glass Border** | `border-white/10` | `rgba(255, 255, 255, 0.10)` | Preview cards, dropdown separators, floating launcher |
| **Dashed Slot Border** | `border-dashed border-white/[0.18]` | `rgba(255, 255, 255, 0.18)` | Upload / add media slots (`size-16` and `h-[72px] w-24`) |
| **Focus Ring (Workspace)** | `focus-visible:ring-white/70` | `rgba(255, 255, 255, 0.70)` (`2px`) | Keyboard focus ring on interactive workspace buttons |
| **Accent Yellow (Pro/Warn)** | `text-accent-yellow` | `rgb(255, 193, 65)` / `#FFC241` | Upgrade banners (`from-accent-yellow/10`), Pro crown icon |
| **Error / Notification Dot** | `bg-error` | `rgb(229, 72, 77)` / `#E5484D` | `size-2 rounded-full` notification indicator |

---

## 3. Typography System (2-Tier Token Architecture)

- **Primary Sans Font Family**: `--font-sans: var(--font-inter), "Inter", var(--font-geist-sans), "Geist Sans", ui-sans-serif, system-ui, sans-serif` (`Inter` variable 100–900 loaded on `<html>` & `<body>` via `next/font/google`, supporting exact `450` weight for `micro-tag`; `Geist Sans` fallback)
- **Monospace Font**: `--font-mono: var(--font-geist-mono), "Geist Mono", ui-monospace, Consolas, monospace`
- **Tier 1 Source of Truth**: `src/styles/tokens/typography.css` (exact 10 canonical type tokens + `.ds-type-*` utility classes)
- **Tier 2 Source of Truth**: `src/styles/tokens/text-roles.css` (semantic component text roles + `.ds-label*`)
- **Strict Enforcement**: ONLY `typography.css` and `text-roles.css` define text sizing across the entire SaaS — including ALL sidebars (Edit Sidebar, Left Sidebar, Assets/Character/Element sidebars). Zero legacy aliases (`--type-size-*`, `--type-leading-*`, `.ds-text-caption-*`, `.ds-text-body-*`, `.ds-text-h-*`, `.ds-text-display`, `.ds-text-control`, `.text-h4..body-xs`), zero custom `clamp(...)` font sizes, and zero special sidebar typography rules are permitted.

### 3.1 Tier 1 — Exact 10-Token Typography Scale (`src/styles/tokens/typography.css`)

| # | Token Name | Utility Class | Size (`rem` / `px`) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `display-hero` | `.ds-type-display-hero` | `3rem` (`48px`) | `400` | `1` | `-1.2px` |
| **02** | `section-heading` | `.ds-type-section-heading` | `2.5rem` (`40px`) | `400` | `1.05` | `-1px` |
| **03** | `sub-heading` | `.ds-type-sub-heading` | `2.25rem` (`36px`) | `400` | `1` | `-0.9px` |
| **04** | `card-title` | `.ds-type-card-title` | `1.5rem` (`24px`) | `400` | `1` | `0` |
| **05** | `feature-title` | `.ds-type-feature-title` | `1.25rem` (`20px`) | `400` | `1` | `0` |
| **06** | `body` | `.ds-type-body` | `1rem` (`16px`) | `400` | `1.4` | `-0.16px` |
| **07** | `button` | `.ds-type-button` | `0.875rem` (`14px`) | `600` | `1.25` | `0` |
| **08** | `caption-label` | `.ds-type-caption-label` | `0.875rem` (`14px`) | `500` | `1.3` | `0.35px` |
| **09** | `small` | `.ds-type-small` | `0.8125rem` (`13px`) | `400` | `1.3` | `-0.20px` |
| **10** | `micro-tag` | `.ds-type-micro-tag` | `0.6875rem` (`11px`) | `450` | `1.3` | `0` |

Variable pattern: `--type-<name>-size`, `--type-<name>-weight`, `--type-<name>-leading`, `--type-<name>-tracking`.

### 3.2 Tier 2 — Semantic Component Text Roles (`src/styles/tokens/text-roles.css`)

| Semantic Role / Class | Tier 1 Token | Color / Style | Usage |
| :--- | :--- | :--- | :--- |
| `<Label>` / `.ds-label` | `small` (`13px · 400 · 1.3 · -0.20px`) | `--role-label-color: var(--text-muted-fg)` (`#A1A1AA`), sentence case | Form, control, slider, and section labels (`variant="default"`) |
| `<Label variant="caption">` / `.ds-label-caption` | `caption-label` (`14px · 500 · 1.3 · 0.35px`) | `var(--text-muted-fg)` (`#A1A1AA`) | Emphasized caption labels |
| `<Label variant="primary">` / `.ds-label-primary` | `small` (`13px · 400 · 1.3 · -0.20px`) | `var(--text-primary)` (`#FFFFFF`) | High-emphasis inline labels |
| `.ds-text-button` / `.ds-btn-*` | `button` (`14px · 600 · 1.25 · 0`) | Variant contract | Primary, secondary, tonal, outline, ghost, segmented, CTA buttons |
| `.ds-text-button-sm` | `small` (`13px · 500 · 1.3 · -0.20px`) | Variant contract | Compact secondary buttons |
| `.ds-text-nav` / `.ds-text-tab` / `.ds-nav-item` | `caption-label` (`14px · 500 · 1.3 · 0.35px`) | `var(--text-primary)` / `var(--text-secondary)` | Sidebar nav rows, inspector tabs, tool launcher rows |
| `.ds-text-input` / `.ds-text-menu` / `.ds-input*` / `.ds-menu-item` | `small` (`13px · 400 · 1.3 · -0.20px`) | `var(--text-primary)` | Inputs, textareas, dropdown menu items, stepped slider labels/values |
| `.ds-text-badge` / `.ds-badge*` | `micro-tag` (`11px · 450 · 1.3 · 0`) | Variant contract | Status badges, counters, compact 3-column preset chips |
| `.ds-text-body` | `body` (`16px · 400 · 1.4 · -0.16px`) | `var(--text-body)` / `var(--text-primary)` | Standard editorial and dialog body copy |

### 3.3 Icon Size & Weight Token System (`src/styles/tokens/icons.css`)

Single source of truth for icon dimensions, optical scaling (`--icon-optical-scale: 1.12`), and weights/SVG strokes. Base components set `--ds-icon-size` automatically so nested icons stay visually balanced with paired text. For explicit sizing or weight, use `<HugeIcon size="2xs|xs|sm|md|lg|xl|2xl|3xl" weight="light|regular|medium|bold" />` (never raw `text-*` or `font-bold` classes on `<HugeIcon>`).

| Token / Utility Class | Size (`rem` / `px`) | Usage |
| :--- | :--- | :--- |
| `--icon-size-2xs` (`.ds-icon-2xs`) | `0.625rem` (`10px`) | Tiny badges, video play indicator |
| `--icon-size-xs` (`.ds-icon-xs`) | `0.75rem` (`12px`) | Badges, checkboxes, radio dots, chevrons, `xs` controls |
| `--icon-size-sm` (`.ds-icon-sm`) | `0.875rem` (`14px`) | Standard compact buttons, inputs, menus, tabs, dropdown chevrons |
| `--icon-size-md` (`.ds-icon-md`) | `1rem` (`16px`) | Default standalone icons, sidebar nav, toolbar & overlay icon buttons |
| `--icon-size-lg` (`.ds-icon-lg`) | `1.25rem` (`20px`) | Large CTAs, edit sidebar tool row icons, dialog close |
| `--icon-size-xl` (`.ds-icon-xl`) | `1.5rem` (`24px`) | Feature card icons, dropzone/upload icons, section accents |
| `--icon-size-2xl` (`.ds-icon-2xl`) | `2rem` (`32px`) | Empty-state & dialog hero icons |
| `--icon-size-3xl` (`.ds-icon-3xl`) | `2.5rem` (`40px`) | Large empty-state / landing hero icons |

| Weight Prop / Utility Class | `--icon-weight-*` | `--icon-stroke-*` (SVG) | Usage |
| :--- | :--- | :--- | :--- |
| `light` (`.ds-icon-weight-light`) | `300` | `1.25` | Subtle decorative or lightweight chrome icons |
| `regular` (`.ds-icon-weight-regular`) | `400` | `1.5` | Default icon weight (`.huge-icon` fallback) |
| `medium` (`.ds-icon-weight-medium`) | `500` | `1.75` | Emphasized controls & active nav icons |
| `bold` (`.ds-icon-weight-bold`) | `700` | `2.25` | Checkmarks, close/confirm indicators, high-contrast glyphs |

### 3.4 Edit Inspector Sidebar Layout Geometry Contract (Scoped)

The Asset Edit Page right inspector rail and its docked tool panels (`EditToolsSidebar`, `AnglesPanel`, `RelightPanel`, `RemoveBackgroundPanel`) use `--edit-sidebar-width` (`280px`) and `.ds-edit-sidebar-*` strictly for **layout geometry only** (width, height, padding, gap, hover surface). They define **zero** typography rules — all sidebar text uses the exact same canonical Tier 1 `.ds-type-*`, Tier 2 `.ds-text-*`, `<Button>`, and `<Label>` tokens as the rest of the SaaS.

| Token / Class | Geometry Only (No Font Rules) | Paired Canonical Typography |
| :--- | :--- | :--- |
| `--edit-sidebar-width` | `280px` | Docked desktop (`≥640px`) inspector rail width (`256px` inner width with `p-3`) |
| `.ds-edit-sidebar-rail` | `width: 100%` (`280px` at `≥640px`) | Container only (`@layer components` so `w-full` overrides when docked) |
| `.ds-edit-sidebar-header` | `flex`, `items-center`, `gap: 4px`, `padding: 12px 16px` | Top header action row |
| `.ds-edit-sidebar-action-btn` | `height: 32px`, `px: 12px`, `gap: 4px` | Inherits `<Button>` (`.ds-btn-*` → `button` `14px · 600 · 1.25`) |
| `.ds-edit-sidebar-tabs` | `flex`, `items-center`, `height: 48px`, `gap: 4px`, `px: 8px` | Inspector tab bar container (`Edits` / `Info`) |
| `.ds-edit-sidebar-tab` | `height: 28px`, `padding: 4px 8px`, `radius: --radius-subtle` | Paired with `.ds-text-tab` (`caption-label` `14px · 500 · 1.3 · 0.35px`) |
| `.ds-edit-sidebar-tool-row` | `height: 40px`, `padding: 8px`, `gap: 4px`, `radius: --radius-subtle`, hover `--surface-tonal` | Inner label uses `.ds-type-caption-label` (`14px · 500 · 1.3 · 0.35px`) |

---

## 4. Strict 4-Token Border Radius System (`src/styles/tokens/radius.css`)

Defined via Tailwind v4 `@theme` in `src/styles/tokens/radius.css` so both CSS variables (`var(--radius-*)`) and native Tailwind classes (`rounded-none`, `rounded-sharp`, `rounded-subtle`, `rounded-comfortable`, plus directional variants like `rounded-t-comfortable`) share a single source of truth. Legacy Tailwind radius classes (`rounded-xs..3xl`, bare `rounded`) and arbitrary `rounded-[*]` values are forbidden.

| Token / Class | Pixel Value | Components Using This Radius |
| :--- | :--- | :--- |
| `--radius-none` (`rounded-none`) | `0px` | Docked panels, full-bleed canvases, flush edge-to-edge containers |
| `--radius-sharp` (`rounded-sharp`) | `4px` | Status badges (`.ds-badge*`), checkboxes (`.ds-checkbox`), `kbd`, micro tags/chips, tiny expand toggles |
| `--radius-subtle` (`rounded-subtle`) | `6px` | All buttons (`.ds-btn-*` including pill, segmented, dropdown-card, nav), icon buttons (`.ds-icon-btn*` including overlay), inputs (`.ds-input*`), textareas, select triggers (`.ds-select-trigger`), pill/composer tabs (`.ds-tab-pill`, `.ds-composer-tab`), menu items (`.ds-menu-item`), list rows (`.ds-list-row`), stepped sliders, button groups |
| `--radius-comfortable` (`rounded-comfortable`) | `8px` | Dialogs, popovers, hover cards, tooltips, dropdown/context/select menu panels, cards (`.ds-section-card`, `.ds-composer-card`, `.ds-media-card`, `.ds-thumb-card`), dashed upload slots (`.ds-upload-slot`), banners (`.ds-banner-accent`) |
| `rounded-full` *(true circles only)* | `9999px` | Avatars, toggle switches & thumbs, default slider tracks & circular thumbs, radio dots, color swatches, status dots, circular counter badges (`.ds-badge-count`), circular spinners, scrollbar thumbs |

---

## 5. Starter CSS Variables & Tailwind Configuration

Paste this into your global CSS file (`globals.css`) to initialize the exact theme:

```css
@layer base {
  :root,
  html.dark {
    color-scheme: dark;
    --background: 240 10% 3.9%;          /* #09090B */
    --foreground: 0 0% 98%;             /* #FAFAFA */
    --omni-bg: #1A1A1A;                 /* rgb(26, 26, 26) */
    --body-bg: #0E1015;                 /* rgb(14, 16, 21) */
    --primary: 0 0% 98%;                /* #FAFAFA / #FFFFFF */
    --primary-foreground: 240 5.9% 10%; /* #18181B / #000000 */
    --secondary: 240 3.7% 15.9%;        /* #27272A */
    --secondary-foreground: 0 0% 98%;   /* #FAFAFA */
    --muted: 240 3.7% 15.9%;            /* #27272A */
    --muted-foreground: 240 5% 64.9%;   /* #A1A1AA */
    --accent: 255 255 255;              /* rgb(255, 255, 255) */
    --accent-blue: 0 178 248;           /* rgb(0, 178, 248) */
    --accent-foreground: 0 0 0;         /* rgb(0, 0, 0) */
    --accent-green: 78, 92.3%, 59%;     /* hsl(78, 92.3%, 59%) */
    --accent-orange: 255 87 10;         /* rgb(255, 87, 10) */
    --bg-background: 26 26 26;          /* rgb(26, 26, 26) */
    --border-primary: 141 141 141;      /* rgb(141, 141, 141) */
    --border-subtle: 49 49 49;          /* rgb(49, 49, 49) */
    --card: 68 68 68;                   /* rgb(68, 68, 68) */
    --card-foreground: 255 255 255;     /* rgb(255, 255, 255) */
    --card-hover: 67 67 67;             /* rgb(67, 67, 67) */
    --destructive: 229 72 77;           /* rgb(229, 72, 77) */
    --destructive-foreground: 255 255 255; /* rgb(255, 255, 255) */
    --fill-disabled: 38 38 38;          /* rgb(38, 38, 38) */
    --fill-hover: 67 67 67;             /* rgb(67, 67, 67) */
    --fill-primary: 255 255 255;        /* rgb(255, 255, 255) */
    --fill-secondary: 49 49 49;         /* rgb(49, 49, 49) */
    --fill-tertiary: 44 44 44;          /* rgb(44, 44, 44) */
    --foreground: 255 255 255;          /* rgb(255, 255, 255) */
    --input: 141 141 141;               /* rgb(141, 141, 141) */
    --muted: 49 49 49;                  /* rgb(49, 49, 49) */
    --muted-foreground: 141 141 141;    /* rgb(141, 141, 141) */
    --opus-bg-black: 13 13 13;          /* rgb(13, 13, 13) */
    --opus-bg-menu: 0 0% 26.7%;         /* hsl(0, 0%, 26.7%) */
    --opus-bg-overlay-subtle: 47 47 47; /* rgb(47, 47, 47) */
    --popover: 68 68 68;                /* rgb(68, 68, 68) */
    --popover-foreground: 255 255 255;  /* rgb(255, 255, 255) */
    --primary: 255 255 255;             /* rgb(255, 255, 255) */
    --primary-foreground: 0 0 0;        /* rgb(0, 0, 0) */
    --secondary: 141 141 141;           /* rgb(141, 141, 141) */
    --secondary-foreground: 255 255 255; /* rgb(255, 255, 255) */
    --tertiary: 118 118 118;            /* rgb(118, 118, 118) */
    --accent-yellow: #FFC241;           /* rgb(255, 193, 65) */
    --error: #E5484D;                   /* rgb(229, 72, 77) */
    --button-tonal: rgba(255, 255, 255, 0.10);
    --button-tonal-hover: rgba(255, 255, 255, 0.15);
    --surface-card: rgba(255, 255, 255, 0.05);
    --prompt-bar-bg: rgba(68, 68, 68, 0.50); /* Prompt bar card background (#444444 / 50%) */
    --border-subtle: rgba(255, 255, 255, 0.10);
    --border-dashed: rgba(255, 255, 255, 0.18);
    --text-secondary: rgba(255, 255, 255, 0.50);
    --text-disabled: rgba(255, 255, 255, 0.25);
  }

  body {
    background-color: var(--omni-bg);
    color: #FFFFFF;
    font-family: var(--font-sans); /* var(--font-inter), "Inter", var(--font-geist-sans), "Geist Sans", ui-sans-serif, system-ui, sans-serif */
    -webkit-font-smoothing: antialiased;
  }
}

.surface-glass {
  background-color: rgba(68, 68, 68, 0.50);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
```

---

## 6. Core Base UI Components Specification (12 Primitives)

| # | Base Component | Variants | Core Classes & State Contract |
| :--- | :--- | :--- | :--- |
| **01** | **Button — Solid (Normal)** | `Primary White`, `Secondary Dark`, `CTA Large` | Primary (`.ds-btn-primary`): `h-8 (32px) px-2.5 gap-1.5 rounded-subtle bg-white text-black` + Tier 1 `button` (`.ds-type-button`, `14px · 600 · 1.25`) + `--icon-size-sm` (`14px`) • Secondary (`.ds-btn-secondary`): `h-8 (32px) px-2.5 gap-1.5 rounded-subtle` + `button` + `--icon-size-sm` (`14px`) • CTA Large (`.ds-btn-cta-lg`): `h-10 (40px) px-4 rounded-subtle` + `button` + `--icon-size-lg` (`20px`) • Size modifiers: `xs` (`.ds-type-micro-tag`, `--icon-size-xs`), `sm` (`.ds-type-small`, `--icon-size-sm`), `lg` (`.ds-type-button`, `--icon-size-lg`) |
| **02** | **Button — Tonal (Translucent)** | `Standard Tonal`, `Compact Pill` | Tonal (`.ds-btn-tonal`): `h-8 (32px) px-2.5 gap-1.5 rounded-subtle bg-white/10 text-[#FAFAFA] hover:bg-white/15` + `button` (`14px · 600 · 1.25`) + `--icon-size-sm` (`14px`) • Pill (`.ds-btn-pill`): `h-[30px] px-2.5 gap-1.5 rounded-subtle hover:bg-white/[0.18]` + `button` + `--icon-size-sm` (`14px`) |
| **03** | **Button — Ghost (Transparent)** | `Ghost Button`, `Subtle Row`, `Text Link` | Ghost (`.ds-btn-ghost`): `h-8 (32px) px-2 gap-1.5 rounded-subtle bg-transparent text-white hover:bg-white/15` + `button` (`14px · 600 · 1.25`) + `--icon-size-sm` (`14px`) • Link (`.ds-btn-link`): `text-white/50 hover:text-white` + `button` + `--icon-size-sm` (`14px`) |
| **04** | **Button — Outline (Bordered)** | `Outline Default`, `Sidebar Trigger` | Outline (`.ds-btn-outline`): `h-8 (32px) px-2.5 gap-1.5 rounded-subtle border border-[#27272A] bg-transparent text-[#FAFAFA] hover:bg-white/15` + `button` (`14px · 600 · 1.25`) + `--icon-size-sm` (`14px`) |
| **05** | **Icon Button** | `Ghost Toolbar`, `Tonal Square`, `Outline Square`, `Overlay Blur` | Standard (`.ds-icon-btn*`): `size-8 (32x32px) rounded-subtle bg-transparent text-white hover:bg-white/15 disabled:opacity-50` + `--icon-size-sm` (`14px`; `xs` `24px`/`12px`, `lg` `40px`/`20px`) • Overlay (`.ds-icon-btn-overlay`): `size-8 (32x32px) rounded-subtle backdrop-blur(16px → 80px)` + `--icon-size-md` (`16px`) |
| **06** | **Pill Select & Dropdown** | `Pill Trigger`, `Glass Menu Item`, `Checkmark Option` | Trigger (`.ds-select-trigger`): `h-7 (28px) w-[200px] rounded-subtle bg-white/10 pl-3 pr-2.5 hover:bg-white/15` + `small` (`13px · 1.3 · -0.20px`) + `--icon-size-sm` (`14px`) • Panel: `rounded-comfortable p-1.5 gap-0.5 bg-surface-menu-glass (#23262A @ 75%, blur 40px)` • Label (`MENU_LABEL_CLASS`): `.ds-label` (`small`, `#A1A1AA`, sentence case) • Menu Item (`.ds-menu-item`): `min-h-[30px] px-2 py-[5px] gap-2 rounded-subtle` + `.ds-type-small` (`13px · 400 · 1.3 · -0.20px`) + `--icon-size-sm` (`14px`, `--icon-primary`; `MenuCheckIcon` `weight="bold"` / `--icon-weight-bold`; `MenuRadioDotIcon` `--icon-size-xs` `12px`; shortcut & subtitle `.ds-type-micro-tag`) |
| **07** | **Pill Tabs (Tablist)** | `Pill Tab Item`, `Segmented Switcher` | Pill Tab (`.ds-tab-pill`): `h-7 (28px) rounded-subtle px-3 bg-white/10 text-white hover:bg-white/15 data-[state=active]:bg-white data-[state=active]:text-black` + `caption-label` (`.ds-text-tab`, `14px · 500 · 1.3 · 0.35px`) + `--icon-size-sm` (`14px`) |
| **08** | **Section Card & Composer Card** | `Frosted Card`, `Prompt Bar Card`, `Uppercase Accordion Trigger` | Card (`.ds-section-card`): `rounded-comfortable bg-white/5 backdrop-blur-2xl px-8 py-6` • Composer Card (`.ds-composer-card`): `rounded-comfortable bg-surface-menu-glass p-2` • Accordion Trigger (`.ds-accordion-trigger`): `h-6 w-full flex justify-between uppercase text-white/50` + `small` (`13px · 1.3 · -0.20px`) + `<HugeIcon size="md" />` (`16px`) |
| **09** | **Dashed Upload / Media Slot** | `Square 64x64`, `Aspect 96x72` | `.ds-upload-slot`: `size-16` or `h-[72px] w-24` `rounded-comfortable border border-dashed border-white/[0.18] bg-white/5 hover:bg-white/10` (Disabled: `cursor-not-allowed text-white/25`) |
| **10** | **Interactive List / Setting Row** | `Compact Ratio Row`, `Thumbnail Preview Row` | Compact (`.ds-list-row`): `h-10 (40px) px-3 rounded-subtle bg-transparent text-white hover:bg-white/5` + `small` (`13px · 1.3 · -0.20px`) • Preview: `group flex items-center justify-between gap-3` with `h-[72px] w-24 rounded-comfortable border border-white/10 bg-white/5 group-hover:bg-white/10` |
| **11** | **Switch, Input, Checkbox & Label** | `Pill Switch`, `Ghost / Accent / Default Input`, `Checkbox`, `Label (default / caption / primary)` | Switch (`.ds-switch`): `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white` + thumb `size-[18px] rounded-full bg-white data-[checked]:bg-[#09090B]` • Input (`.ds-input*`): `h-7 (28px) rounded-subtle` + `.ds-type-small` (`13px · 400 · 1.3 · -0.20px`) + `--icon-size-sm` (`14px`) • Checkbox (`.ds-checkbox`): `size-4`/`size-5` `rounded-sharp` + `<HugeIcon size="xs|sm" weight="bold" />` • Label (`@/components/base/label`, `.ds-label`): `default` uses `small` (`13px · 400 · 1.3 · -0.20px`, `#A1A1AA`), `caption` adds `.ds-label-caption` (`14px · 500 · 1.3 · 0.35px`), `primary` adds `.ds-label-primary` (`#FFFFFF`), sentence case (`as="label"\|"span"\|"div"`, `disabled`) |
| **12** | **Badge & Status Banner** | `Status Badge`, `Accent Banner` | Badge (`.ds-badge`, `.ds-badge-glass`): `rounded-sharp px-1.5 py-0.5 bg-white/10 text-[#FAFAFA]` + `micro-tag` (`.ds-text-badge`, `11px · 450 · 1.3`) + `--icon-size-xs` (`12px`) • Counter (`.ds-badge-count`): `size-3.5 rounded-full` • Banner (`.ds-banner-accent`): `rounded-comfortable bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4` |
