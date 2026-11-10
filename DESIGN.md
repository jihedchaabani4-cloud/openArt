# Modern Creative SaaS Design System (`DESIGN.md`)

> **Single Source of Truth** for the visual engineering, design tokens, component architecture, and styling rules of the application.  
> Directly derived from the production creative AI studio specification (`pasted-text.txt` and `pasted-text-2.txt`).

---

## 1. Core Visual Tokens

### 1.1 Surface & Background Ladder
- **Root Canvas (`html`, tertiary)**: `#0f1113` (`rgb(15, 17, 19)`)
- **Studio Canvas (`body`, sidebar, panel)**: `#131416` (`rgb(19, 20, 22)`)
- **Card & Composer Surface (cards, PromptBar)**: `#1c1e20` (`rgb(28, 30, 32)`)
- **High Elevated (modals, popovers)**: `#282a2c` (`rgb(40, 42, 44)`)
- **Micro Layer / Action Chip (`bg-white/5`)**: `rgba(255, 255, 255, 0.05)` (hover: `rgba(255, 255, 255, 0.10)`)
- **Brand Accent Surface (Generate CTA)**: `#d1fe17` (`rgb(209, 254, 23)`)

### 1.2 Foreground & Content Colors
- **Primary Text**: `#f7f7f8` / `#ffffff` (`text-font-primary`)
- **Secondary Text**: `#898a8b` / `#828282` (`text-font-secondary`)
- **Muted Text**: `rgba(255, 255, 255, 0.50)`
- **Inverted Text (on brand lime button)**: `#131517` / `#2F3907`

### 1.3 Border & Separation System
- **Subtle Separator / Card Outlines**: `rgba(255, 255, 255, 0.05)` (1px solid, `border-white/5`)
- **Interactive / Resting Input Borders**: `rgba(255, 255, 255, 0.10)` (`border-white/10`)
- **Brand Focus Ring / Active Outline**: `#d1fe17` (`ring-lime`, `border-lime`)

### 1.4 Corner Radius System
- **Micro / Hairline**: `1px` - `2px` (`rounded-xs`)
- **Subtle**: `6px` (`rounded-sm`)
- **Standard Controls (Buttons, Inputs, Chips)**: `8px` (`rounded-md`, `rounded-lg`)
- **Cards, Popovers, Dropdowns**: `12px` (`rounded-xl`, `rounded-lg`)
- **Sidebars & Modals (`LeftNavigationRail`)**: `16px` (`rounded-2xl`)
- **PromptBar Shell & Large Containers**: `20px` (`rounded-[20px]`, `rounded-2xl`)
- **Pills, Circular CTA Buttons & Avatars**: `9999px` (`rounded-full`)

---

## 2. Component Implementation Mappings

| Component | Background | Border | Radius | Text Color |
|---|---|---|---|---|
| **PromptBar Shell** | `#1c1e20` (`bg-[#1c1e20]`) | `1px solid rgba(255,255,255,0.05)` | `20px` (`rounded-[20px]`) | `#f7f7f8` |
| **Prompt Input Area** | `rgba(255,255,255,0.05)` | `none` | `16px` / `12px` | `#ffffff` |
| **Generate Button** | `#d1fe17` (`bg-lime`) | `none` | `9999px` / `12px` | `#131517` |
| **LeftNavigationRail** | `transparent` | `1px solid rgba(255,255,255,0.05)` | `16px` (`rounded-2xl`) | `#898a8b` (active: `#ffffff`) |
| **Action Chip / Button**| `rgba(255,255,255,0.05)` | `none` | `8px` (`rounded-md`) | `#f7f7f8` |
| **Card / Surface Tile**| `#1c1e20` | `1px solid rgba(255,255,255,0.05)` | `12px` (`rounded-xl`) | `#f7f7f8` |
