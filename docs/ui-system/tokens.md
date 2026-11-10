# Supercomputer & Higgsfield SaaS Design Tokens (`tokens.md`)

> **Single Source of Truth** for color, surface, typography, spacing, radius, border, and elevation tokens across the application (`my-app`), extracted from the production SaaS interface specification.

---

## 1. Surface & Canvas Ladder Hierarchy

All backgrounds derive from the high-performance dark canvas hierarchy:

| Token Name | CSS Variable | Hex / RGBA Value | Tailwind Class | Semantic Application |
|---|---|---|---|---|
| **Canvas Root** | `--surface-canvas` / `--surface-tertiary` | `#0f1113` (`rgb(15, 17, 19)`) | `bg-[#0f1113]`, `bg-surface-tertiary` | Deepest root viewport (`html`, global base) |
| **Studio Canvas** | `--surface-panel` / `--surface` | `#131416` (`rgb(19, 20, 22)`) | `bg-[#131416]`, `bg-surface-panel`, `bg-qc-background-primary` | Main studio workspace, sidebars, navigation shell |
| **Surface Card** | `--surface-card` / `--surface-elevated` | `#1c1e20` (`rgb(28, 30, 32)`) | `bg-[#1c1e20]`, `bg-surface-primary`, `bg-surface-card` | PromptBar composer, floating cards, inspector panels |
| **High Surface** | `--surface-highest` | `#282a2c` (`rgb(40, 42, 44)`) | `bg-[#282a2c]`, `bg-surface-highest` | Floating dialogs, popovers, active modal frames |
| **Micro Element / Chip** | `--neutral-primary-reverted-5` | `rgba(255, 255, 255, 0.05)` | `bg-white/5`, `bg-neutral-primary-reverted-5` | Action chips, input containers, subtle button fills |
| **Micro Hover** | `--neutral-primary-reverted-10` | `rgba(255, 255, 255, 0.10)` | `hover:bg-white/10`, `hover:bg-neutral-primary-reverted-10` | Hover states for chips and secondary actions |
| **Brand Surface** | `--color-lime` / `--surface-brand` | `#d1fe17` (`rgb(209, 254, 23)`) | `bg-lime`, `bg-surface-brand`, `bg-primary` | Primary CTA, Generate buttons, active status pins |

---

## 2. Typography & Text Hierarchy

Primary typography is powered by **Inter** with **Space Grotesk** used for display headings and metrics:

| Role | CSS Variable / Class | Computed Value | Tailwind Utility | Visual Application |
|---|---|---|---|---|
| **Text Primary** | `--color-q-text-primary` | `#f7f7f8` / `#ffffff` | `text-font-primary`, `text-qc-text-primary`, `text-white` | Primary readable titles, inputs, headers |
| **Text Secondary**| `--color-q-text-secondary`| `#898a8b` / `#828282` | `text-font-secondary`, `text-qc-text-secondary` | Secondary labels, descriptions, timestamps |
| **Text Subtle** | `--color-text-subtle` | `rgba(255, 255, 255, 0.50)` | `text-white/50`, `text-icon-secondary` | Inactive placeholders, hints, shortcuts |
| **Text Inverted** | `--color-text-inverted` | `#131517` / `#2F3907` | `text-[#131517]`, `text-[#2F3907]` | Text on brand lime surface (`bg-lime`, `bg-surface-brand`) |

### Font Size & Line Height Ladder

| Scale | Size | Line Height | Tailwind Class | Application |
|---|---|---|---|---|
| **xxs** | `10px` (`0.625rem`) | `14px` - `15px` | `text-xxs`, `text-xxs-medium` | Micro badges, status pills, shortcuts |
| **xs** | `12px` (`0.75rem`) | `16px` - `18px` | `text-xs`, `text-xs-semi` | Metadata, chips, tag descriptions |
| **sm** | `14px` (`0.875rem`) | `20px` | `text-sm`, `text-sm-medium` | Default body, buttons, inputs |
| **base** | `16px` (`1rem`) | `24px` | `text-base` | Section headlines, modal headers |
| **title**| `40px` (`2.5rem`) | `48px` | `text-4xl`, `text-title` | Display titles, hero copy |

---

## 3. Border & Outline Hierarchy

| Token Role | CSS Variable | Value | Tailwind Class | Purpose |
|---|---|---|---|---|
| **Subtle Separator** | `--border-subtle` / `--border` | `rgba(255, 255, 255, 0.05)` | `border-white/5`, `border-qc-border-subtle`, `border-separator-card` | Card separation, sidebar frame, panel dividers |
| **Default Interactive**| `--border-default` / `--outline`| `rgba(255, 255, 255, 0.10)` | `border-white/10`, `border-default` | Active borders, input resting borders |
| **Subtle Grey Border** | `--border-subtle-grey` | `rgba(197, 197, 197, 0.24)` | `border-[rgba(197,197,197,0.24)]` | Selected card frames, elevated outlines |
| **Focus / Active Ring** | `--ring` / `--border-active` | `#d1fe17` (Lime) | `ring-lime`, `border-lime`, `focus-within:border-lime` | Focused inputs, selected items, active CTA border |

---

## 4. Corner Radius Hierarchy

The modern SaaS radius scale ensures generous rounded corners on containers, refined corners on interactive controls, and pill shapes on micro badges:

| Radius Tier | Value | CSS Token | Tailwind Class | Target UI Elements |
|---|---|---|---|---|
| **Hairline / XS** | `1px` - `2px` | `--radius-xxxs`, `--radius-xs` | `rounded-xxxs`, `rounded-xs` | Media element internal frames |
| **Subtle / SM** | `6px` | `--radius-sm` | `rounded-sm`, `rounded-md` | Compact dropdown items, sub-menus |
| **Standard / MD** | `8px` | `--radius-md` | `rounded-lg`, `rounded-md` | Buttons, inputs, action chips, context menus |
| **Card / LG** | `12px` | `--radius-lg` | `rounded-xl` | Cards, inner panel blocks, popovers, generate button |
| **Sidebar / XL** | `16px` | `--radius-xl` | `rounded-2xl` | Navigation sidebar (`LeftNavigationRail`), modal dialogs |
| **Container / 2XL** | `20px` | `--radius-2xl` | `rounded-[20px]`, `rounded-2xl` | Outer PromptBar composer card shell |
| **Display / 3XL** | `24px` | `--radius-3xl` | `rounded-3xl` | Extra-large container frames |
| **Pill / Circle** | `9999px` | `--radius-full` | `rounded-full` | Circular action buttons, status pills, user avatars |

---

## 5. Shadow & Depth Inset Tokens

Depth is built primarily through surface contrast and subtle inset highlights rather than heavy exterior drop shadows:

| Shadow Role | CSS / Tailwind Utility | Visual Effect | Application |
|---|---|---|---|
| **Brand Button Inset** | `shadow-[inset_0_-3px_0_0_#829b19] drop-shadow-[0_32px_12px_rgba(0,0,0,0.15)]` | Subtle 3D tactile push effect | Primary Generate Lime Button |
| **Chip / Action Inset** | `shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]` | Micro elevation | Surface selector chips, workspace switcher |
| **Card Highlight Inset** | `shadow-[inset_0_1.73px_3.46px_0_rgba(255,255,255,0.12)]` | Top specular light reflection | Elevated modal headers and card frames |
| **Zero Shadow Standard**| `shadow-none` | Crisp flat contrast | Clean panels, secondary action buttons |

---

## 6. Spacing & Sizing Scale

| Token | Dimension | Tailwind Class | Application |
|---|---|---|---|
| **1** | `4px` | `gap-1`, `p-1` | Micro icon-to-label gaps, tight chips |
| **1.5** | `6px` | `gap-1.5`, `p-1.5` | Menu item padding, compact rows |
| **2** | `8px` | `gap-2`, `p-2` | Standard control gaps, button icon spacing |
| **2.5** | `10px` | `gap-2.5`, `p-2.5` | PromptBar inner content padding |
| **3** | `12px` | `gap-3`, `p-3` | Panel interior margins |
| **4** | `16px` | `gap-4`, `p-4` | Card interior padding, dialog gutters |
| **6** | `24px` | `gap-6`, `p-6` | Section headers, workspace gaps |
