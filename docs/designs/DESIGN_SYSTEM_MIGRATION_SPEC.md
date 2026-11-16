# SaaS Dark UI — Migration Specification (`DESIGN_SYSTEM_MIGRATION_SPEC.md`)

## 1. Overview & Strategy
This specification details the 100% scorched-earth replacement of the legacy design system with the **SaaS Dark UI** defined in [`./DESIGN.md`](file:///C:/Users/jihad/Desktop/open%20art/my-app/DESIGN.md).

## 2. Files to Delete Outright
1. `src/app/google-flow-tokens.css` (legacy token re-exporter / bridge)
2. `src/app/saas-tokens.css` (159KB legacy tokens with `--qc-*`, `--hf-*`, `.q-*`, `#d1fe17`)

## 3. Foundation Replacement: `src/app/globals.css`
- Purge all imports of `google-flow-tokens.css` and `saas-tokens.css`.
- Purge all `--qc-*`, `--hf-*`, `--mat-*`, `#d1fe17`, lime colors, and legacy surface ladders.
- Retain only:
  - `@import "tailwindcss";`
  - `@import "tw-animate-css";`
  - Font face declarations for Geist / Inter and Google Symbols (if needed for icons)
  - Section 5 CSS variables (`--background`, `--foreground`, `--omni-bg`, `--body-bg`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--accent-yellow`, `--error`, `--button-tonal`, `--surface-card`, `--border-subtle`, `--border-dashed`, etc.)
  - `.surface-glass` class.

## 4. The 12 Base UI Primitives Contract (`src/components/ui/` & mapped in `src/shared/ui/`)
All 12 primitives must be implemented strictly following Section 6 of `DESIGN.md`:
1. **`Button`**:
   - `variant="primary"`: `h-9.5 px-4 rounded-[10px] bg-white text-black text-base font-medium shadow hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70`
   - `variant="secondary"`: `h-9.5 px-4 rounded-[10px] bg-[#27272A] text-[#FAFAFA] text-base font-medium hover:bg-[#27272A]/80`
   - `variant="tonal"`: `h-9.5 px-3 rounded-[10px] bg-white/10 text-[#FAFAFA] text-base font-medium hover:bg-white/15`
   - `variant="pill"`: `h-8 rounded-full bg-white/10 pl-3 pr-2 text-sm text-white hover:bg-white/[0.18]`
   - `variant="ghost"`: `h-9 px-4 rounded-[10px] bg-transparent text-white text-sm font-medium hover:bg-white/10`
   - `variant="link"`: `text-sm text-white/50 hover:text-white`
   - `variant="outline"`: `h-[34px] p-2 rounded-[10px] border border-[#27272A] bg-transparent text-sm font-medium text-[#FAFAFA] hover:bg-[#27272A]/50`
2. **`IconButton`**:
   - `size-9.5 rounded-[10px] p-2.5 bg-transparent text-white hover:bg-white/10 focus-visible:ring-0`
3. **`PillSelect` & `Dropdown`**:
   - Trigger: `h-9.5 w-[200px] rounded-full bg-white/10 pl-5 pr-4 text-base font-medium hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70`
   - Menu: `.surface-glass` / `bg-[#242426]/95 backdrop-blur-2xl rounded-2xl p-1.5`
   - Item: `h-[36px] px-2.5 rounded-xl hover:bg-white/20 text-white text-sm`
4. **`PillTabs`**:
   - Container: `flex items-center gap-1 p-1`
   - Trigger: `h-8 rounded-full px-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow`
5. **`SectionCard` & `Accordion`**:
   - Card: `rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6`
   - Trigger: `h-6 w-full flex justify-between text-sm font-medium uppercase leading-[18px] tracking-[0.1px] text-white/50`
6. **`DashedUploadSlot`**:
   - `size-16` or `h-[72px] w-24 rounded-2xl border border-dashed border-white/[0.18] bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-white/50 hover:text-white`
7. **`InteractiveListRow`**:
   - Compact: `h-12 px-3 rounded-lg bg-transparent text-sm font-medium text-white hover:bg-white/5 flex items-center justify-between`
   - Thumbnail Preview: `h-[72px] w-24 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10`
8. **`Switch`**:
   - Track: `w-11 h-6 rounded-full bg-white/15 data-[checked]:bg-white transition-colors`
   - Thumb: `size-[18px] rounded-full bg-white data-[checked]:bg-[#09090B] transition-transform`
9. **`Input`**:
   - `h-9.5 px-3.5 rounded-[10px] bg-white/5 border border-[#27272A] text-white placeholder:text-white/50 focus:border-white/50 outline-none`
10. **`Checkbox`**:
    - `size-4 rounded-md border border-[#27272A] bg-white/5 data-[checked]:bg-white data-[checked]:text-black`
11. **`Badge`**:
    - `rounded-md px-1.5 py-0.5 text-xs font-semibold bg-white/10 text-[#FAFAFA]`
12. **`StatusBanner`**:
    - `rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4 py-2 border border-[#FFC241]/20 text-[#FAFAFA]`

## 5. Caller Migration Strategy
Existing callers in `src/widgets`, `src/views`, `src/features` importing from `@/shared/ui/*` will receive the refreshed primitives directly and cleanly via `src/shared/ui/` (and mirrored in `src/components/ui/`), ensuring zero broken paths while eradicating all legacy props, legacy classes, and hardcoded colors.

## 6. Ticket Waves DAG
- **Wave 1: Purge & Foundation**
  - Delete `src/app/google-flow-tokens.css` and `src/app/saas-tokens.css`.
  - Rewrite `src/app/globals.css` with Section 5 tokens.
  - Implement TDD verification script `scripts/verify-zero-legacy-ui.sh`.
- **Wave 2: 12 Pure Base Primitives**
  - Rebuild the 12 primitives in `src/components/ui/` and update `src/shared/ui/`.
- **Wave 3: Feature, Layout & Page Callers Migration**
  - Grep and replace all remaining banned tokens, legacy colors (`#d1fe17`, etc.), and generic grays across `src/features`, `src/widgets`, `src/views`.
- **Wave 4: Verification & Zero-Residue Gate**
  - Run `scripts/verify-zero-legacy-ui.sh` (must exit 0).
  - Run `npm test` and `npm run build`.
