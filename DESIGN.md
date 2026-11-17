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

- **Font Family**: `--font-geist-sans: "Geist Sans", ui-sans-serif, system-ui, sans-serif`
- **OpenType Stylistic Sets**: `font-variant-alternates: styleset(ss01, ss03, ss04, ss06, ss08);`
- **Monospace Font**: `--font-geist-mono: "Geist Mono", ui-monospace, Consolas, monospace`

| Role | Classes | Font Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (`h1`)** | `text-2xl font-semibold leading-[1.2] tracking-tight` | `24px` | `600` | `28.8px` (`1.2`) | `-0.6px` |
| **Button / Trigger Large** | `text-base font-medium` | `16px` | `500` | `24px` | `0px` (or `-0.36px` on onboarding pills) |
| **Section Accordion Header** | `text-sm font-medium uppercase leading-[18px] tracking-[0.1px] text-white/50` | `14px` | `500` | `18px` | `+0.1px` |
| **Field / Group Label (`h3`)** | `text-sm font-medium leading-label-sm` | `14px` | `500` | `17px` | `0px` |
| **Standard Control / Nav** | `text-sm font-medium` | `14px` | `500` | `20px` | `0px` |
| **Body Description** | `text-sm font-normal leading-body-sm text-white/50` | `14px` | `400` | `22px` | `0px` |
| **Badge / Pill Tag** | `text-xs font-semibold` | `12px` | `600` | `16px` | `0px` |
| **Helper / Slot Caption** | `text-xs leading-body-xs text-white/50` | `12px` | `400` | `19px` | `0px` |

---

## 4. Border Radius & Spacing Scale

| Radius Token | Pixel Value | Components Using This Radius |
| :--- | :--- | :--- |
| `rounded-md` | `6px` (`0.375rem`) | Status badges (`Trial`, `Beta`), inline accordion header buttons |
| `rounded-lg` | `8px` (`0.5rem`) | Aspect-ratio list row buttons (`h-12 px-3 rounded-lg`) |
| `rounded-[10px]` / `rounded-xl` | `10px` – `12px` | Primary/Tonal header buttons (`h-9.5`), Icon buttons (`size-9.5`), Status banner, Sidebar nav items, Dropdown menu items |
| `rounded-2xl` | `16px` (`1rem`) | Dashed upload slots (`size-16`, `h-[72px] w-24`), style preview thumbnails, Glass Dropdown containers |
| `rounded-3xl` | `24px` (`1.5rem`) | Live 9:16 preview container (`border-2 border-white/10`), Onboarding popover |
| `rounded-[28px]` | `28px` (`1.75rem`) | Main Frosted Section Cards (`bg-white/5 backdrop-blur-2xl px-8 py-6`) |
| `rounded-full` | `9999px` | Pill Select Trigger (`h-9.5 w-[200px]`), Pill Tabs (`h-8`), Compact Pill Buttons (`h-8`), Toggle Switch (`w-11 h-6`), Avatars |

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
| **01** | **Button — Solid (Normal)** | `Primary White`, `Secondary Dark` | `h-9.5 (38px) px-4 rounded-[10px] bg-white text-black text-base font-medium shadow hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50 disabled:pointer-events-none` |
| **02** | **Button — Tonal (Translucent)** | `Standard Tonal`, `Compact Pill` | `h-9.5 px-3 rounded-[10px] bg-white/10 text-[#FAFAFA] text-base font-medium shadow-sm hover:bg-white/15` (Pill: `h-8 rounded-full bg-white/10 pl-3 pr-2 text-sm hover:bg-white/[0.18]`) |
| **03** | **Button — Ghost (Transparent)** | `Ghost Button`, `Subtle Row`, `Text Link` | `h-9 px-4 rounded-[10px] bg-transparent text-white text-sm font-medium hover:bg-white/10` (Link: `text-sm text-white/50 hover:text-white`) |
| **04** | **Button — Outline (Bordered)** | `Outline Default`, `Sidebar Trigger` | `h-[34px] p-2 rounded-[10px] border border-[#27272A] bg-transparent text-sm font-medium text-[#FAFAFA] shadow-sm hover:bg-[#27272A]/50` |
| **05** | **Icon Button** | `Ghost Toolbar`, `Tonal Square`, `Outline Square` | `size-9.5 (38x38px) rounded-[10px] p-2.5 bg-transparent text-white hover:bg-white/10 disabled:opacity-50` |
| **06** | **Pill Select & Dropdown** | `Pill Trigger`, `Glass Menu Item`, `Checkmark Option` | Trigger: `h-9.5 w-[200px] rounded-full bg-white/10 pl-5 pr-4 text-base font-medium hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70` • Menu Item: `h-[36px] px-2.5 rounded-xl hover:bg-white/20` |
| **07** | **Pill Tabs (Tablist)** | `Pill Tab Item`, `Segmented Switcher` | `h-8 rounded-full px-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow` |
| **08** | **Section Card & Composer Card** | `Frosted Card`, `Prompt Bar Card`, `Uppercase Accordion Trigger` | Card: `rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6` • Composer Card (`.ds-composer-card / .bg-card\/50`): `rounded-3xl bg-card/50 (#444444 @ 50%) p-[3px] border-0 shadow-none` • Trigger: `h-6 w-full flex justify-between text-sm font-medium uppercase leading-[18px] tracking-[0.1px] text-white/50` |
| **09** | **Dashed Upload / Media Slot** | `Square 64x64`, `Aspect 96x72` | `size-16` or `h-[72px] w-24` `rounded-2xl border border-dashed border-white/[0.18] bg-white/5 hover:bg-white/10` (Disabled: `cursor-not-allowed text-white/25`) |
| **10** | **Interactive List / Setting Row** | `Compact Ratio Row`, `Thumbnail Preview Row` | Compact: `h-12 px-3 rounded-lg bg-transparent text-sm font-medium text-white hover:bg-white/5` • Preview: `group flex items-center justify-between gap-3` with `h-[72px] w-24 rounded-2xl border border-white/10 bg-white/5 group-hover:bg-white/10` |
| **11** | **Switch, Input & Checkbox** | `Pill Switch`, `Ghost / Accent / Default Input`, `Checkbox` | Switch: `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white` + thumb `size-[18px] bg-white data-[checked]:bg-[#09090B]` • Input (2 canonical variants): Ghost (`.ds-input-ghost`, transparent in all states for prompt bar / composer well) & Accent (`.ds-input-accent`, `h-9 px-2.5 rounded-lg bg-accent/50 hover:bg-accent/70 focus-within:bg-accent/70 border-none` for navbar search) |
| **12** | **Badge & Status Banner** | `Status Badge`, `Accent Banner` | Badge: `rounded-md px-1.5 py-0.5 text-xs font-semibold bg-white/10 text-[#FAFAFA]` • Banner: `rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4` |
