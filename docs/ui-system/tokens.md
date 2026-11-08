# Google Flow Design Tokens (`tokens.md`)

> **Single Source of Truth** for color, surface, typography, spacing, radius, and component tokens across the application (`my-app`).

---

## 1. Surface Palette (Google Flow Material 3 Dark Ladder)

All backgrounds derive from the Google Flow OLED surface ladder defined in `src/app/globals.css`:

| Token Name | CSS Variable | Hex / RGBA Value | Tailwind Utility | Role & Application |
|---|---|---|---|---|
| **Canvas** | `--surface-container-lowest` | `#000000` | `bg-surface-container-lowest` / `bg-black` | Deepest viewport background / page backdrop |
| **Surface** | `--surface` | `#131314` | `bg-surface` | Persistent navigation bars, sidebars, desktop header |
| **Sunken** | `--surface-container-low` | `#1b1b1b` | `bg-surface-container-low` | Recessed toolbars, inactive panel zones |
| **Container (Card)** | `--surface-container` | `#1e1f20` | `bg-surface-container` | Grid cards, media item tiles, inspector boxes |
| **High Container** | `--surface-container-high` | `#282a2c` | `bg-surface-container-high` | Dropdown panels, popovers, floating controls |
| **Highest Container**| `--surface-container-highest`| `#333537` | `bg-surface-container-highest` | Active selection containers, modal dialogs |
| **Surface Bright** | `--surface-bright` | `#37393b` | `bg-surface-bright` | Active tab background, high-contrast pills |
| **Glass Overlay** | `--surface-overlay` | `rgba(22, 23, 24, 0.90)` | `bg-surface-overlay` | Prompt box floating container (`backdrop-blur-[40px]`) |

---

## 2. Content & Typography Tokens (On-Surface)

| Token Name | CSS Variable | Value | Tailwind Utility | Purpose |
|---|---|---|---|---|
| **On Surface (Base)** | `--on-surface` | `#f5f5f5` / `#e3e3e3` | `text-on-surface` | Primary legible body and title typography |
| **On Surface Variant**| `--on-surface-variant` | `#8e8e93` / `#c4c7c5` | `text-on-surface-variant` | Secondary descriptions, timestamps, subtitles |
| **On Surface Subtle** | `--on-surface-subtle` | `#636366` | `text-on-surface-subtle` | Inactive icons, subtle hints, placeholders |

---

## 3. Line & Outline Tokens

| Token Name | CSS Variable | Value | Tailwind Utility | Purpose |
|---|---|---|---|---|
| **Outline Variant** | `--outline-variant` | `rgba(218, 220, 224, 0.05)` | `border-outline-variant` | Hairline card separation, subtle divider lines |
| **Outline Default** | `--outline` | `rgba(218, 220, 224, 0.14)` | `border-outline` | Standard panel boundaries, dropdown borders |
| **Outline Interactive**| `--outline-interactive`| `rgba(255, 255, 255, 0.25)` | `border-outline-interactive` | Hovered card borders, focus rings |

---

## 4. Brand & Semantic Colors

| Accent Role | CSS Variable | Hex Value | Tailwind Safe Class | Usage |
|---|---|---|---|---|
| **Google Primary** | `--primary` | `#a8c7fa` | `text-primary` / `bg-primary` | Focused input border, selected chips, CTA |
| **Primary Container**| `--primary-container` | `#0842a0` | `bg-primary-container` | Active selected filter pill background |
| **On Primary** | `--on-primary` | `#062e6f` | `text-on-primary` | Label text when placed over solid primary fill |
| **Cinema Neon** | `--brand-neon` | `#EFFE17` | `text-brand-neon` / `bg-brand-neon` | High-impact CTA, generation badges |
| **Error** | `--error` | `#fe6e6e` | `text-error` | Validation errors, delete confirmations |
| **Error Container** | `--error-container` | `#8c1d18` | `bg-error-container` | Error toast banner background |
| **Success** | `--success` | `#80da88` | `text-success` | Generation completed, upload verified |
| **Warning** | `--warning` | `#fcbd00` | `text-warning` | Rate limit alerts, credits threshold |

---

## 5. Border Radius Hierarchy (User Frozen Standard)

| Geometry Tier | Value | CSS Token | Canonical Tailwind Token | Target UI Elements |
|---|---|---|---|---|
| **Sharp** | `4px` | `--radius-sm` | `rounded-sm` | Buttons, Inputs, Badges, Micro Tags, Menu Items |
| **Container (MAX)** | `6px` | `--radius-md` | `rounded-md` | Cards, Textareas, Dropdowns, Context Menus, Modals |
| **Pill / Circle** | `9999px`| `--radius-full` | `rounded-full` | Filter chips, avatar circles, switch thumbs, generate buttons |

---

## 6. Spacing Scale (User 8px Base Scale)

| Token | Pixels | Tailwind Utility | Application |
|---|---|---|---|
| `xxs` | 4px | `p-xxs`, `gap-xxs` | Micro badge margins, icon-text gap |
| `xs` | 6px | `p-xs`, `gap-xs` | Compact list items, button inner gutters |
| `sm` | 8px | `p-sm`, `gap-sm` | Standard element gap, chip padding |
| `md` | 12px | `p-md`, `gap-md` | Form field spacing, panel interior padding |
| `base` | 16px | `p-base`, `gap-base` | Card interior padding, dialog gutter |
| `lg` | 20px | `p-lg`, `gap-lg` | Card exterior padding, studio panel gaps |
| `xl` | 24px | `p-xl`, `gap-xl` | Modal header spacing, section margins |
| `xxl` | 28px | `p-xxl`, `gap-xxl` | Module separations |
| `section` | 32px | `p-section`, `gap-section`| Block breathing room |

---

## 7. Google Flow Component Geometry

| Dimension Role | CSS Variable | Value | Description |
|---|---|---|---|
| **Prompt Box Max Width** | `--prompt-box-max-width` | `37.5rem` (600px) | Maximum reading/typing width |
| **Prompt Box Compact Width** | `--prompt-box-compact-max-width` | `41.25rem` (660px) | Viewport-adaptive width |
| **Prompt Box Min Height** | `--prompt-box-min-height` | `5.625rem` (90px) | Collapsed resting prompt bar |
| **Settings Panel Width** | `--prompt-box-settings-width` | `17.5rem` (280px) | Standard parameters flyout |
| **Settings Panel Wide** | `--prompt-box-settings-width-wide`| `21rem` (336px) | Extended parameters flyout |
| **Desktop Header Height** | `--header-desktop-height` | `5rem` (80px) | Persistent studio header |
