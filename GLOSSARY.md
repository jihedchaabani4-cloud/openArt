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
11. **11. Switch, Input & Checkbox**: Switch `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white` (thumb `size-[18px] bg-white data-[checked]:bg-[#09090B]`); Input `h-9.5 px-3.5 rounded-[10px] bg-white/5 border border-[#27272A] focus:border-white/50`.
12. **12. Badge & StatusBanner**: Badge `rounded-md px-1.5 py-0.5 text-xs font-semibold bg-white/10 text-[#FAFAFA]`; StatusBanner `rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4`.

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
