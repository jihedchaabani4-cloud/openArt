# DESIGN SYSTEM LAW (SINGLE SOURCE OF TRUTH: `./DESIGN.md`)

## 1. Zero Legacy Tolerance (Scorched-Earth Policy)
- `DESIGN.md` is the ONLY permitted visual language, token set, and component specification in this repository.
- **Deletion beats addition** (`/ponytail full`): Never create backwards-compatible wrappers, legacy prop aliases, fallback CSS variables, or bridge classes.
- **Strictly Forbidden Legacy Artifacts**:
  - Any legacy custom prefixes or variables (`--qc-*`, `--hf-*`, `.q-*`, `.hf-*`, `#d1fe17` lime accents, or old theme objects).
  - Any legacy stylesheet files (`legacy.css`, `old-theme.css`, component-scoped `.module.css` that duplicate `DESIGN.md` tokens).
  - Arbitrary Tailwind grays/slates not in `DESIGN.md` (`bg-slate-*`, `bg-gray-*`, `bg-neutral-*`, `border-gray-*`).

## 2. Mandatory Token & Surface Contract (`DESIGN.md`)
- **Surfaces**:
  - Root Body: `bg-[#0E1015]` (`--body-bg`)
  - Deep Canvas / Preview: `bg-[#09090B]` / `bg-black`
  - App & Sidebar Surface: `bg-omni-bg` (`#1A1A1A`)
  - Secondary / Accent Surface: `bg-secondary` / `bg-accent` (`#27272A`)
  - Frosted Section Card: `bg-white/5 backdrop-blur-2xl rounded-[28px] px-8 py-6`
  - Tonal Control Surface: `bg-white/10` (Hover: `hover:bg-white/15` or `hover:bg-white/[0.18]`)
  - Floating Glass Menu: `.surface-glass` (`rgba(68, 68, 68, 0.50)` + `backdrop-blur-2xl`)
  - Select Listbox: `bg-[#242426]/95 backdrop-blur-2xl`
- **Text & Icons**:
  - Primary Text: `text-white` / `text-[#FAFAFA]`
  - Primary Inverse Text (inside white Primary CTAs & active Pill Tabs): `text-black` / `text-[#18181B]`
  - Body Muted (70%): `text-white/70`
  - Muted Foreground: `text-muted-foreground` (`#A1A1AA`)
  - Subtitle / Uppercase Section Header (50%): `text-white/50`
  - Disabled (25%): `text-white/25`
- **Borders & Focus**:
  - Structural Border: `border-border` / `border-input` (`#27272A`)
  - Subtle Glass Border: `border-white/10`
  - Dashed Upload Slot Border: `border-dashed border-white/[0.18]`
  - Dual Focus Strategy: Workspace/Editor buttons MUST use `focus-visible:ring-2 focus-visible:ring-white/70`; compact Toolbar/Chrome icon buttons MUST use `focus-visible:ring-0`.
- **12 Allowed Base UI Primitives Only**:
  01. `Button` (Solid Normal: Primary White / Secondary Dark)
  02. `Button` (Tonal Translucent: Standard Tonal `h-9.5 rounded-[10px]` / Compact Pill `h-8 rounded-full`)
  03. `Button` (Ghost Transparent / Subtle Row / Text Link)
  04. `Button` (Outline Bordered `h-[34px] rounded-[10px] border-[#27272A]`)
  05. `IconButton` (`size-9.5 rounded-[10px] p-2.5`)
  06. `PillSelect` & `Dropdown` (`h-9.5 w-[200px] rounded-full bg-white/10` + `.surface-glass` / `bg-[#242426]/95`)
  07. `PillTabs` (`h-8 rounded-full px-3 bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black`)
  08. `SectionCard` & `Accordion` (`rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6`)
  09. `DashedUploadSlot` (`size-16` or `h-[72px] w-24 rounded-2xl border-dashed border-white/[0.18] bg-white/5`)
  10. `InteractiveListRow` (Compact Ratio Row `h-12 px-3 rounded-lg` / Thumbnail Preview Row)
  11. `Switch`, `Input`, `Checkbox` (Switch `w-11 h-6 rounded-full`; Input `h-9.5 px-3.5 rounded-[10px] bg-white/5 border-[#27272A]`)
  12. `Badge` & `StatusBanner` (`rounded-md px-1.5 py-0.5 text-xs font-semibold bg-white/10` / `#FFC241` accent banner)
