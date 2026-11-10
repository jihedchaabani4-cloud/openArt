# Modern SaaS Studio Design System (`design.md`)

> **The Single Source of Truth** for UI architecture, visual engineering, component primitives, and styling standards across the codebase (`my-app`).  
> **Core Visual Philosophy:** Dark-first, studio-grade creative workspace with high aesthetic fidelity. Base viewport canvas (`#0f1113`), main studio panels (`#131416`), elevated card surfaces (`#1c1e20`), micro-action layers (`rgba(255, 255, 255, 0.05)`), subtle 5% white borders (`rgba(255, 255, 255, 0.05)`), high-visibility lime accent (`#d1fe17`), and modern geometric corner radiuses (`8px` buttons, `12px` cards, `16px` sidebars, `20px` prompt bar).

---

## 1. Core Architectural Laws

1. **Token Encapsulation Law:** Never hardcode arbitrary hex colors or rogue pixel radiuses in call-site JSX. All visual variables derive 100% from CSS variables in `src/app/globals.css` and their mapped Tailwind classes.
2. **Surface Ladder Law:** UI hierarchy is strictly organized through surface tiers:
   - Level 0 (Root Base): `#0f1113`
   - Level 1 (Studio Workspace): `#131416`
   - Level 2 (Elevated Cards / Composer): `#1c1e20`
   - Level 3 (Micro Action Chips & Inputs): `rgba(255, 255, 255, 0.05)`
   - Level 4 (Brand CTA): `#d1fe17` (Lime)
3. **5% Border Law:** All subtle cards, sidebar separators, and modal outlines use `rgba(255, 255, 255, 0.05)` (represented as `border-white/5` or `border-outline-variant`).
4. **Modern Radius Hierarchy Law:**
   - Buttons and Inputs: `rounded-lg` (`8px`) or `rounded-md` (`6px`)
   - Cards and Popovers: `rounded-xl` (`12px`)
   - Sidebar and Panels: `rounded-2xl` (`16px`)
   - PromptBar Outer Container: `rounded-[20px]` (`20px`)
   - Pills and Circular Actions: `rounded-full` (`9999px`)
5. **Primitive Ownership:** All HTML controls (`button`, `input`, `textarea`, `dropdown`, `card`, `dialog`, `surface`) are owned by canonical primitives in `src/shared/ui/`. Features and pages never reconstruct controls from raw HTML.

---

## 2. Token Architecture Overview

```
[ Root Viewport Canvas: #0f1113 ]
           │
           ▼
[ Studio Canvas Shell: #131416 ]
   ├── LeftNavigationRail (rounded-2xl, bg-transparent/panel, border-white/5)
   └── Main Viewport
           │
           ▼
[ Elevated Surface Card: #1c1e20 ]
   ├── PromptBarShell (rounded-[20px], bg-[#1c1e20], border-white/5)
   └── Generation Cards & Panels (rounded-xl, bg-[#1c1e20], border-white/5)
           │
           ▼
[ Interactive Micro-Elements: rgba(255, 255, 255, 0.05) ]
   ├── Action Chips & Selector Pills (rounded-lg, hover:bg-white/10)
   ├── Input Fields & Textareas (rounded-xl, bg-white/5 or bg-[#1c1e20])
   └── Brand Action Button: #d1fe17 (Lime) with dark inverted text #131517
```

---

## 3. Surface & Elevation Palette

| Token Name | Hex / RGBA Value | Tailwind Class | Semantic Role |
|---|---|---|---|
| **Root Canvas** | `#0f1113` | `bg-[#0f1113]`, `bg-surface-tertiary` | Viewport backdrop (`html`, body base) |
| **Studio Canvas** | `#131416` | `bg-[#131416]`, `bg-surface-panel` | Workspace background, sidebars |
| **Surface Card** | `#1c1e20` | `bg-[#1c1e20]`, `bg-surface-card` | Cards, PromptBar, dialogs |
| **Highest Surface** | `#282a2c` | `bg-[#282a2c]`, `bg-surface-highest`| Floating modals, popovers |
| **Chip / Input Layer** | `rgba(255, 255, 255, 0.05)` | `bg-white/5`, `bg-neutral-primary-reverted-5` | In-card input fills, action chips |
| **Brand Surface** | `#d1fe17` | `bg-lime`, `bg-surface-brand`, `bg-primary` | Generate CTA, active indicator |

---

## 4. Typography Standards

- **Primary Typeface:** `Inter, ui-sans-serif, system-ui, sans-serif`
- **Display Accent:** `"Space Grotesk", ui-sans-serif, system-ui, sans-serif`
- **Text Primary:** `#f7f7f8` / `#ffffff` (`text-font-primary`, `text-white`)
- **Text Secondary:** `#898a8b` / `#828282` (`text-font-secondary`, `text-white/70`)
- **Text Inverted:** `#131517` / `#2F3907` (Text on Lime buttons)

---

## 5. Border & Radius Standards

- **Borders:**
  - Subtle (Card, Sidebar, Separators): `rgba(255, 255, 255, 0.05)` (`border-white/5`)
  - Interactive (Inputs, Hover): `rgba(255, 255, 255, 0.10)` (`border-white/10`)
  - Focus Ring: `#d1fe17` (`ring-lime`, `border-lime`)
- **Radiuses:**
  - `rounded-sm`: `6px`
  - `rounded-md`: `8px`
  - `rounded-lg`: `12px`
  - `rounded-xl`: `16px`
  - `rounded-2xl`: `20px`
  - `rounded-3xl`: `24px`
  - `rounded-full`: `9999px`
