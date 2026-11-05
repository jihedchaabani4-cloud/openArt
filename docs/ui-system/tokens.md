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

## 5. Border Radius Hierarchy (Runway Standard 4-Tier Scale)

Enforced strictly across all components (Single Standard Token, Zero Redundant Classes):

| Geometry Tier | Value | CSS Token | Canonical Tailwind Token | Target UI Elements |
|---|---|---|---|---|
| **Sharp** | `4px` | `--radius-sm` | `rounded-sm` | Buttons, Inputs, Badges, Micro Tags, Tooltips, Menu Items |
| **Subtle** | `6px` | `--radius-md` | `rounded-md` | Subtle links, intermediate chips |
| **Comfortable** | `8px` | `--radius-lg` | `rounded-lg` | Cards, Dropdowns, Context Menus, Popovers, Panels |
| **Generous** | `16px`| `--radius-2xl` | `rounded-2xl` | Modal Dialogs, Workflow Creation Sheets |
| **Pill / Circle** | `9999px`| `--radius-full` | `rounded-full` | Filter chips, avatar circles, switch thumbs |

> **Global Cascade Rule:** Changing `--radius-sm` or `--radius-lg` in `:root` automatically updates all components on the entire site simultaneously. Never write custom compound classes (`rounded-card`, `rounded-button`).

---

## 6. Elevation & Shadows (Runway Zero Box-Shadow Law)

The entire design system enforces **zero box-shadow** (`shadow-none`).
Depth is achieved via:
- High-contrast photographic compositions and full-bleed video.
- 1px hairline border containment (`border-white/10`).
- Alternation of dark surface layers (`#000000`, `#131314`, `#1e1f20`, `#282a2c`).

---

## 7. Spacing Scale (Runway 8px Base Grid + Micro Steps)

| Spacing Token | Value | Tailwind Class Equivalent | Runway Intended Usage |
|---|---|---|---|
| `xxs` | **4px** | `gap-1`, `p-1`, `space-x-1` | Micro labels, icon-label offsets |
| `xs` | **6px** | `gap-1.5`, `py-1.5`, `px-2` | Button content gaps, badge internal padding |
| `sm` | **8px** | `gap-2`, `p-2` | Base unit: card interior gaps, item groups |
| `md` | **12px** | `gap-3`, `p-3` | Form field stacks, toolbar groupings |
| `base` | **16px** | `gap-4`, `p-4` | Standard card internal padding, navigation tap targets |
| `lg` | **20px** | `gap-5`, `p-5` | Component group separations, medium cards |
| `xl` | **24px** | `gap-6`, `p-6` | Alert container padding, modal footer action rows |
| `xxl` | **28px** | `gap-7`, `p-7` | Large card interiors |
| `section` | **32px** | `py-8` | Compact section separators |
| `section-lg` | **48px** | `py-12` | Major section vertical padding |
| `section-xl` | **64px** | `py-16` | Light editorial section padding (`light-section`) |
| `section-xxl` | **78px** | `py-[78px]` | Cinematic hero and mission statement bands (`dark-section`) |

---

## 8. Container Max Widths (Runway Cinema Hierarchy)

| Container Tier | Max Width | Utility Class | Purpose |
|---|---|---|---|
| **Cinema Wide** | **1600px** | `.container-cinema` / `max-w-[1600px]` | Maximum viewport width for full-bleed studio layout |
| **Editorial Content** | **1280px** | `.container-editorial` / `max-w-[1280px]` | Centered desktop content container |
| **Compact Container** | **980px** | `.container-compact` / `max-w-[980px]` | Focused inspector panels, media info strips, form cards |
| **Modal / Dialog** | **960px / 480px** | `max-w-4xl` / `max-w-md` | Standard confirmation & workflow creation dialogs |
