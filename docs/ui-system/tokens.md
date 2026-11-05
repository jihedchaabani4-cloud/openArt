# Centralized Design Tokens (`tokens.md`)

> **Single Source of Truth** for color, surface, typography, spacing, radius, and elevation tokens across the frontend application (`my-app`).

---

## 1. Surface Palette (Dark Mode First)

All application backgrounds derive from an OLED-black surface ladder defined in `src/app/globals.css`:

| Token Name | CSS Variable | Hex / Value | Tailwind Utility | Intended Usage |
|---|---|---|---|---|
| **Canvas** | `--surface-canvas` | `#000000` | `bg-black` / `bg-surface-canvas` | Deepest viewport background / page backdrop |
| **Panel** | `--surface-panel` | `#131314` | `bg-surface-panel` | Persistent navigation bars, sidebars, rails |
| **Card** | `--surface-card` | `#1e1f20` | `bg-card` / `bg-surface-card` | Grid cards, media item tiles, inspector boxes |
| **Elevated** | `--surface-elevated` | `#282a2c` | `bg-surface-elevated` | Secondary buttons, dropdown panels, popovers |
| **Highest** | `--surface-highest` | `#333537` | `bg-surface-highest` | Active selection containers, hover elevation |
| **Glass** | `--surface-overlay` | `rgba(22, 23, 24, 0.72)` | `backdrop-blur-md` | Modals, prompt bar floating settings |

---

## 2. Interactive Alpha State Layers

Consistent white opacity layers used for interactive states (hover, focus, pressed):

| Layer Token | Value | Tailwind Class Equivalent | Purpose |
|---|---|---|---|
| `--foreground-state-05` | `rgba(218, 220, 224, 0.05)` | `bg-white/5` | Resting surface fill / hairline border |
| `--foreground-state-08` | `rgba(218, 220, 224, 0.08)` | `hover:bg-white/8` | Subtle menu item hover |
| `--foreground-state-10` | `rgba(218, 220, 224, 0.10)` | `hover:bg-white/10` | Standard button/input hover fill |
| `--foreground-state-15` | `rgba(218, 220, 224, 0.15)` | `active:bg-white/15` | Secondary button surface |
| `--foreground-state-25` | `rgba(218, 220, 224, 0.25)` | `bg-white/25` | Selected toggle pill / active tab |

---

## 3. Brand & Semantic Colors

| Accent Role | Token | Color Value | Tailwind Safe Class | Usage |
|---|---|---|---|---|
| **Cinema Neon** | `--color-brand-neon` | `#EFFE17` | `bg-lime-400` / `text-lime-400` | Cinema Studio hero CTA, active Studio tabs |
| **Google Blue** | `--color-accent-blue` | `#a8c7fa` | `text-primary` | Focused input border, selected chips |
| **Danger / Error** | `--color-danger` | `#fe6e6e` | `text-danger` / `bg-red-950/70` | Delete buttons, error badges, form validation |
| **Success** | `--color-success` | `#80da88` | `text-emerald-300` / `bg-emerald-950/70` | Success badges, upload checkmarks |
| **Warning** | `--color-warning` | `#fcbd00` | `text-amber-300` / `bg-amber-950/70` | Quota alerts, rate limit notices |

---

## 4. Typography Scale

Fonts loaded locally via variable `@font-face`:
- Primary Sans: **Google Sans Text** / **Google Sans** (`font-sans`)
- Monospace: **Geist Mono** (`font-mono`)
- Symbols: **Google Symbols** / Material Symbols (`.google-symbols`)

| Typography Role | Size / Line Height | Tailwind Class | Usage |
|---|---|---|---|
| **Micro / Subtitle** | `10px / 14px` | `text-xs` | Badge labels, timeline labels |
| **Caption / Meta** | `12px / 16px` | `text-xs` | Button text, input descriptions, chips |
| **Body Standard** | `14px / 20px` | `text-sm` | Dialog text, form input value, dropdown item |
| **Body Large** | `16px / 24px` | `text-base` | Card titles, modal body |
| **Header Section** | `20px / 28px` | `text-xl` | Sidebar section headers, dialog titles |
| **Display Hero** | `24px+ / 32px` | `text-2xl` | Landing hero, studio header titles |

---

## 5. Border Radius Hierarchy

Enforced strictly across all components (Zero Arbitrary Brackets):

| Geometry Tier | Value | CSS Token | Canonical Tailwind Token | Allowed Components |
|---|---|---|---|---|
| **Badge** | `4px` | `--radius-badge` | `rounded-badge` | Badges, micro tags, tooltips |
| **Button / Input**| `6px` | `--radius-button` | `rounded-button` | Buttons, Inputs, Switches, Select Triggers |
| **Card / Panel** | `8px` | `--radius-card` | `rounded-card` | Cards, Dropdowns, Popovers, Panels |
| **Dialog / Modal**| `12px`| `--radius-dialog` | `rounded-dialog` | Modal Dialogs, Confirmation Sheets |
| **Pill / Circle** | `9999px`| `--radius-pill` | `rounded-full` / `rounded-pill` | Filter chips, avatar circles, switch thumbs |

---

## 6. Spacing Scale (4px Base Grid)

```
gap-1   (4px)   ──► Micro text, badge icon gap
gap-1.5 (6px)   ──► Standard button content (icon + label)
gap-2   (8px)   ──► Breadcrumbs, tag lists, item groups
gap-3   (12px)  ──► Form field stacks
gap-4   (16px)  ──► Card internal padding, sidebar item gap
gap-6   (24px)  ──► Modal footer action row, grid gap
gap-8   (32px)  ──► Major section separation
```
