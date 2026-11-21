# SaaS Dark UI — Design System & Tokens (`DESIGN.md`)

This document defines the complete visual language, CSS/Tailwind tokens, typography scale, radius hierarchy, and pure Base UI Components extracted from the reference Dark SaaS interface.

---

## 1. Core Philosophy & Visual Direction

1. **Layered Translucent Dark Surfaces**: Instead of heavy solid borders everywhere, hierarchy is created by layering translucent white fills (`bg-white/5`, `bg-white/10`, `bg-white/15`, `bg-white/20`) with `backdrop-filter: blur(40px)` (`backdrop-blur-2xl`) over a matte charcoal canvas (`#1A1A1A`).
2. **High-Contrast Primary Actions**: Primary calls-to-action and active states use pure white (`#FFFFFF` / `#FAFAFA`) with deep black/zinc text (`#000000` / `#18181B`) so the active element is unmistakable without relying on loud neon colors.
3. **Soft Squircle Geometry**: Tactile controls use `10px` (`rounded-[10px]`) and `9999px` (`rounded-full`), media/upload slots use `16px` (`rounded-2xl`), and main content section cards use generous `28px` (`rounded-[28px]`) corners.
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

## 3. Typography System

- **Font Family**: `--font-geist-sans: "Geist Sans", "Inter", ui-sans-serif, system-ui, sans-serif`
- **OpenType Stylistic Sets**: `font-variant-alternates: styleset(ss01, ss03, ss04, ss06, ss08);`
- **Monospace Font**: `--font-geist-mono: "Geist Mono", ui-monospace, Consolas, monospace`
- **Weights**: `--type-weight-regular: 400` · `--type-weight-medium: 500` · `--type-weight-semibold: 600` · `--type-weight-bold: 700` · `--type-weight-black: 900`
- **Tracking**: `--type-tracking-tight: -0.075rem` · `--type-tracking-slight: -0.025rem` · `--type-tracking-heading: -0.02em` · `--type-tracking-body: -0.01em` · `--type-tracking-none: 0` · `--type-tracking-wide: 0.0125rem`

### 3.1 UI, Media & Body Scale (Fixed Across Viewports)

| Class / Token | Size (`rem` / `px`) | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.ds-text-caption-s` (`--type-size-xxs`) | `0.625rem` (`10px`) | `0.875rem` (`14px`) | `500` | `0` | Micro badges, menu section headers, shortcuts, ratio tags, counters |
| `.ds-text-caption-m` (`--type-size-xs`) | `0.75rem` (`12px`) | `1rem` (`16px`) | `400`–`600` | `0` | Unified compact studio chrome: buttons, sidebar nav & folders, menus & dropdown items, inputs, selects, pill tabs, media titles |
| `.ds-text-control` (`--type-size-control`) | `0.8125rem` (`13px`) | `1.125rem` (`18px`) | `400` | `0` | Prompt bar editor text & placeholder (`PromptEditor.jsx`) |
| `.ds-text-caption-l` (`--type-size-sm`) | `0.875rem` (`14px`) | `1.25rem` (`20px`) | `500` | `0` | Navbar project titles, top nav links, large marketing/auth CTAs (`cta-lg`) |
| `.ds-text-body-s` (`--type-size-md`) | `1rem` (`16px`) | `1.5rem` (`24px`) | `400` | `-0.01em` | Standard editorial body text, dialog descriptions |
| `.ds-text-body-m` (`--type-size-lg`) | `1.125rem` (`18px`) | `1.625rem` (`26px`) | `400` | `-0.01em` | Subtitles, lead copy |
| `.ds-text-body-l` (`--type-size-body-l`) | `1.25rem` (`20px`) | `1.75rem` (`28px`) | `400` | `-0.01em` | Large editorial body |

### 3.2 Icon Size Scale (`--icon-size-*`)

Icons use a single 5-step token scale calibrated to the ultra-compact unified studio typography scale. Base components set `--ds-icon-size` automatically so nested `GoogleIcon` (with no explicit `size` prop) and `<svg>` icons stay visually balanced with their paired text without per-call-site classes. Explicit `<GoogleIcon size="xs|sm|md|lg|xl" />` applies `.ds-icon-*` (`@layer utilities`) to override parent inheritance.

| Token / Utility Class | Size (`rem` / `px`) | Default Optical Size (`opsz`) | Paired Text Role & Usage |
| :--- | :--- | :--- | :--- |
| `--icon-size-xs` (`.ds-icon-xs`) | `0.75rem` (`12px`) | `20` | Micro badges (`10px`), checkboxes, radio dots, `xs` buttons & icon buttons (`24px`) |
| `--icon-size-sm` (`.ds-icon-sm`) | `0.875rem` (`14px`) | `20` | Unified compact chrome: all standard buttons, icon buttons (`28px`), sidebar nav & folders (`30px`, `size-4` box, `wght 300`), menus & dropdown items (`30px`, `wght 300`, `#FFFFFF`, chevron/check `14px`), inputs, selects, pills & tabs (`12px` text) |
| `--icon-size-md` (`.ds-icon-md`) | `1rem` (`16px`) | `20` | Media card overlay icon buttons (`.ds-icon-btn-overlay`, `32px`), `m` controls, `FolderGlyphIcon` (`16px`), standalone `GoogleIcon` fallback |
| `--icon-size-lg` (`.ds-icon-lg`) | `1.125rem` (`18px`) | `20` | Large CTAs (`cta-lg` / `lg`, `40px`, `14px` text), `lg` icon buttons, dialog close |
| `--icon-size-xl` (`.ds-icon-xl`) | `1.25rem` (`20px`) | `20` | Prominent standalone accent icons |

### 3.3 Component-to-Typography & Icon Default Contract (Unified Compact Higgsfield Density)

| Component / Chrome Area | Canonical Class / Token | Font Size / Leading | Weight | Default Icon Size | Control Height / Size |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Buttons** (`primary`, `secondary`, `tonal`, `filter-chip`, `ghost`, `outline`, `link`) | `.ds-btn-*` (`--type-size-xs`) | `12px` / `16px` | `500`–`600` | `14px` (`--icon-size-sm`) | `28px` (`h-7`), `px-2.5` (ghost `px-2`), `gap-1.5` (`6px`), `rounded-lg` (`8px`) |
| **Compact Pill / Segmented Buttons** (`pill`, `segmented`) | `.ds-btn-pill`, `.ds-btn-segmented` | `12px` / `16px` | `500` | `14px` (`--icon-size-sm`) | `26px` (`pill`, `px-2.5`, `rounded-lg`) / `30px` (`segmented`) |
| **Micro Buttons** (`xs`) | `Button size="xs"` (`--type-size-xxs`) | `10px` / `14px` | `500` | `12px` (`--icon-size-xs`) | `24px` (`h-6`) |
| **Large CTA** (`cta-lg`, `lg` — marketing/auth only) | `.ds-btn-cta-lg` (`--type-size-sm`) | `14px` / `20px` | `600` | `18px` (`--icon-size-lg`) | `40px` (`h-10`) |
| **Icon Buttons** (`ghost`, `tonal`, `outline`, `carousel`) | `.ds-icon-btn*` (`size="xs\|sm\|md\|lg"`) | — | — | `12px` / **`14px`** / `18px` | `24px` / **`28px`** (`rounded-lg`) / `40px` |
| **Overlay Icon Button (Media Cards)** | `.ds-icon-btn-overlay` | — | — | `16px` (`--icon-size-md`) | `32px` (`rounded-[10px]`, transparent + `blur(16px → 80px)`) |
| **Inputs & Search** (`.ds-input`, `.ds-input-ghost`, `.ds-input-accent`, `.ds-input-search`) | `--type-size-xs` | `12px` / `16px` | `400` | `14px` (`--icon-size-sm`, `size-3.5` SVG) | `28px` (`h-7`), `rounded-lg` (`8px`) |
| **Prompt Bar Editor** (`PromptEditor.jsx`) | `.ds-text-control` (`--type-size-control`) | `13px` / `18px` | `400` | `14px`–`16px` | auto (`min-h-8`) |
| **Menus & Dropdown Items** (`.ds-menu-item`) | `.ds-text-caption-m` (`--type-size-xs`) | `12px` / `16px` | `400` | `14px` (`--icon-size-sm`, `wght 300`, `size-3.5` SVG, `--icon-primary` `#FFFFFF`; chevron/check `14px`; radio dot `12px`) | `min-h: 30px`, `padding: 5px 8px`, `gap: 8px`, `rounded-lg` (panel `rounded-xl` `12px`, `p-1.5`, `gap-0.5`, `#23262A @ 75%`) |
| **Menu Labels & Shortcuts** (`MENU_LABEL_CLASS`, `MENU_SHORTCUT_CLASS`) | `.ds-text-caption-s` (`--type-size-xxs`) | `10px` / `14px` | `600` / `500` | — | uppercase |
| **Select Triggers & Pill Tabs** (`.ds-select-trigger`, `.ds-tab-pill`) | `--type-size-xs` | `12px` / `16px` | `500` | `14px` (`--icon-size-sm`) | `28px` (select & tab) |
| **Sidebar Nav & Folder Rows** (`.ds-nav-item`, `LeftNavigationRail`, `FileTree`) | `.ds-nav-item` (`--type-size-xs`) | `12px` / `16px` | `500` | `14px` (`--icon-size-sm`, `size-4` box, `wght 300`; `FolderGlyphIcon` `16px`) | `30px`, `padding: 4px 8px`, `gap: 8px`, `rounded-lg` (`8px`), `border-transparent` → hover/active `bg-surface-nav-active` (`#27272A` @ 50%) + `border-border-structural` (`#27272A`) |
| **Sidebar Section Headers & Groups** | `font-sans text-xs font-normal text-muted-foreground` | `12px` / `16px` | `400` | — | `gap-y-4` (`16px`) between sections, `gap-0.5` (`2px`) between nav items & inside `FileTree` |
| **Top Navbar Title & Nav Links** (`NavbarTitle`, `ProjectsNavbar`) | `.ds-text-caption-l` (`--type-size-sm`) | `14px` / `20px` | `500`–`600` | `14px` chrome / `18px` brand | `28px` (`h-7` / `size-7`) action chrome |
| **Prompt Bar Controls** (`PromptBarControlsRow`, `FlowPromptBoxSettings`, `MentionTag`, `ReferenceButton`) | `.ds-text-caption-m` / `.ds-text-caption-s` | `12px` (pills) / `10px` (ratios, labels) | `500` | `14px` segmented / `16px` card trigger | `30px` segmented / `44px` card trigger |
| **Media Cards & Collection Titles** (`StudioMediaGridCard`, `TrashMediaGridCard`, `CollectionMediaGridItem`) | `.ds-text-caption-m` (`--type-size-xs`) | `12px` / `16px` | `500` | `16px` overlay btn / `14px` corner badge | `32px` overlay / `28px` badge |
| **Badges & Status Pills** (`.ds-badge`, `.ds-badge-glass`, `.ds-badge-count`) | `.ds-text-caption-s` (`--type-size-xxs`) | `10px` / `14px` | `600` | `12px` (`--icon-size-xs`) | `18px`–`20px` |
| **Dialog / Panel Titles** (`DialogTitle`) | `.ds-text-h-xxs` (`--type-size-h-xxs`) | `18px` → `20px` | `600` | `18px` close icon (`--icon-size-lg`) | — |
| **Page Titles** (`h1`) | `.ds-text-h-xs` (`--type-size-h-xs`) | `20px` → `24px` | `600` | — | — |

### 3.4 Responsive Heading & Display Scale (`<768px` → `≥768px` → `≥1280px`)

| Class / Token | Mobile → Tablet → Desktop | Line Height (Desktop) | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| `.ds-text-h-xxs` | `18px → 20px → 20px` | `28px` (`1.75rem`) | `600` | `-0.01em` |
| `.ds-text-h-xs` (`h1` page title) | `20px → 22px → 24px` | `30px` (`1.875rem`) | `600` | `-0.01em` |
| `.ds-text-h-sm` | `24px → 26px → 28px` | `36px` (`2.25rem`) | `600` | `-0.02em` |
| `.ds-text-h-md` | `32px → 36px → 40px` | `48px` (`3rem`) | `600` | `-0.02em` |
| `.ds-text-h-lg` | `36px → 42px → 48px` | `56px` (`3.5rem`) | `700` | `-0.02em` |
| `.ds-text-h-xl` | `48px → 56px → 64px` | `72px` (`4.5rem`) | `700` | `-0.02em` |
| `.ds-text-h1` | `56px → 64px → 72px` | `80px` (`5rem`) | `700` | `-0.02em` |
| `.ds-text-display` | `64px → 80px → 98px` | `100px` (`6.25rem`) | `700` | `-0.02em` |

---

## 4. Border Radius & Spacing Scale

| Radius Token | Pixel Value | Components Using This Radius |
| :--- | :--- | :--- |
| `rounded-md` | `6px` (`0.375rem`) | Status badges (`Trial`, `Beta`), inline accordion header buttons |
| `rounded-lg` | `8px` (`0.5rem`) | Standard buttons (`h-7`), compact pill buttons (`h-[26px]`), toolbar icon buttons (`size-7`), inputs (`h-7`), sidebar nav & folder rows (`.ds-nav-item`, `30px`), menu items (`.ds-menu-item`, `30px`), aspect-ratio list row buttons (`h-10 px-3 rounded-lg`) |
| `rounded-[10px]` / `rounded-xl` | `10px` – `12px` | Overlay icon buttons (`size-8` `rounded-[10px]`), Status banner (`rounded-[10px]`), Dropdown / Context / Select menu panels (`rounded-xl` `12px`) |
| `rounded-2xl` | `16px` (`1rem`) | Dashed upload slots (`size-16`, `h-[72px] w-24`), style preview thumbnails, Glass Dropdown containers |
| `rounded-3xl` | `24px` (`1.5rem`) | Live 9:16 preview container (`border-2 border-white/10`), Onboarding popover |
| `rounded-[28px]` | `28px` (`1.75rem`) | Main Frosted Section Cards (`bg-white/5 backdrop-blur-2xl px-8 py-6`) |
| `rounded-full` | `9999px` | Pill Select Trigger (`h-7 w-[200px]`), Pill Tabs (`h-7`), Toggle Switch (`w-11 h-6`), Avatars |

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
    font-family: "Geist Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
    font-variant-alternates: styleset(ss01, ss03, ss04, ss06, ss08);
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
| **01** | **Button — Solid (Normal)** | `Primary White`, `Secondary Dark`, `CTA Large` | Primary: `h-7 (28px) px-2.5 gap-1.5 rounded-lg bg-white text-black text-xs font-semibold` (`14px` icon) • Secondary: `h-7 (28px) px-2.5 gap-1.5 rounded-lg text-xs font-medium` • CTA Large: `h-10 (40px) px-4 text-sm font-semibold` (`18px` icon) |
| **02** | **Button — Tonal (Translucent)** | `Standard Tonal`, `Compact Pill` | `h-7 (28px) px-2.5 gap-1.5 rounded-lg bg-white/10 text-[#FAFAFA] text-xs font-medium hover:bg-white/15` (`14px` icon) (Pill: `h-[26px] px-2.5 gap-1.5 rounded-lg text-xs hover:bg-white/[0.18]`) |
| **03** | **Button — Ghost (Transparent)** | `Ghost Button`, `Subtle Row`, `Text Link` | `h-7 (28px) px-2 gap-1.5 rounded-lg bg-transparent text-white text-xs font-medium hover:bg-white/10` (`14px` icon) (Link: `text-xs text-white/50 hover:text-white`) |
| **04** | **Button — Outline (Bordered)** | `Outline Default`, `Sidebar Trigger` | `h-7 (28px) px-2.5 gap-1.5 rounded-lg border border-[#27272A] bg-transparent text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A]/50` (`14px` icon) |
| **05** | **Icon Button** | `Ghost Toolbar`, `Tonal Square`, `Outline Square`, `Overlay Blur` | `size-7 (28x28px) rounded-lg bg-transparent text-white hover:bg-white/15 disabled:opacity-50` (`14px` icon) (Overlay: `size-8 (32x32px) rounded-[10px] backdrop-blur(16px → 80px)`, `16px` icon) |
| **06** | **Pill Select & Dropdown** | `Pill Trigger`, `Glass Menu Item`, `Checkmark Option` | Trigger: `h-7 (28px) w-[200px] rounded-full bg-white/10 pl-3 pr-2.5 text-xs font-medium hover:bg-white/15` (`14px` icon) • Panel: `rounded-xl (12px) p-1.5 gap-0.5 bg-surface-menu-glass (#23262A @ 75%, blur 40px)` • Menu Item: `min-h-[30px] px-2 py-[5px] gap-2 rounded-lg ds-text-caption-m (12px/16px, weight 400)` with `14px` `--icon-primary` (`#FFFFFF`, `wght 300`, `size-3.5` SVG) leading icons (`14px` submenu chevron/check) |
| **07** | **Pill Tabs (Tablist)** | `Pill Tab Item`, `Segmented Switcher` | `h-7 (28px) rounded-full px-3 text-xs font-medium bg-white/10 text-white hover:bg-white/15 data-[state=active]:bg-white data-[state=active]:text-black` (`14px` icon) |
| **08** | **Section Card & Composer Card** | `Frosted Card`, `Prompt Bar Card`, `Uppercase Accordion Trigger` | Card: `rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6` • Composer Card (`.ds-composer-card / .bg-card\/50`): `rounded-3xl bg-card/50 (#444444 @ 50%) p-2 border-border-weak` • Trigger: `h-6 w-full flex justify-between text-xs font-medium uppercase leading-4 tracking-[0.1px] text-white/50` |
| **09** | **Dashed Upload / Media Slot** | `Square 64x64`, `Aspect 96x72` | `size-16` or `h-[72px] w-24` `rounded-2xl border border-dashed border-white/[0.18] bg-white/5 hover:bg-white/10` (Disabled: `cursor-not-allowed text-white/25`) |
| **10** | **Interactive List / Setting Row** | `Compact Ratio Row`, `Thumbnail Preview Row` | Compact: `h-10 (40px) px-3 rounded-lg bg-transparent text-xs font-medium text-white hover:bg-white/5` • Preview: `group flex items-center justify-between gap-3` with `h-[72px] w-24 rounded-2xl border border-white/10 bg-white/5 group-hover:bg-white/10` |
| **11** | **Switch, Input & Checkbox** | `Pill Switch`, `Ghost / Accent / Default Input`, `Checkbox` | Switch: `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white` + thumb `size-[18px] bg-white data-[checked]:bg-[#09090B]` • Input: Default/Ghost/Accent `h-7 (28px) rounded-lg ds-text-caption-m (12px/16px, weight 400, 14px icon)` |
| **12** | **Badge & Status Banner** | `Status Badge`, `Accent Banner` | Badge: `rounded-md px-1.5 py-0.5 ds-text-caption-s (10px/14px) font-semibold bg-white/10 text-[#FAFAFA]` • Banner: `rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4` |
