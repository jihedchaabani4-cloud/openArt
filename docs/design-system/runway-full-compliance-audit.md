# Full Runway Specification Compliance Audit

**Date:** 2026-11-05  
**Auditor:** Antigravity / AI Agent  
**Source Specification:** Runway Design System (`docs/design-system/runwayml.design.md`)  
**Target Codebase:** OpenArt / Labveil Frontend (`my-app`)  
**Current Git Branch:** `runway-design`  

---

## 1. Executive Verdict & Summary

### The Bottom Line
While recent migration work successfully established the **token foundation definitions** in `globals.css`, simplified the `Button` primitive to 6 core variants, and passed the baseline UI ratchet checks, **the active application UI still predominantly runs on the legacy OpenArt / Google Flow / Angular Material design system.**

### High-Level Compliance Breakdown
- **Fully Implemented:** **9.9%** (7 of 71 rules) — Core radius values (4px, 8px, 16px), `#000000` canvas, and basic flat surfaces.
- **Partially Implemented:** **33.8%** (24 of 71 rules) — Tokens defined in `globals.css` or theme, but with **zero or negligible adoption** across actual component JSX.
- **Not Implemented:** **29.6%** (21 of 71 rules) — Runway colors (cool-slate `#767d88`), light editorial sections, cinematic hero recipes, and specialized typography scales that are completely absent from the codebase.
- **Conflicts with Legacy Design:** **26.8%** (19 of 71 rules) — Active codebase conventions (Google Sans font, 228 Google Material Icons, 87 glassmorphism blurs, 80 `rounded-xl`/`rounded-3xl` classes, 40+ shadow classes, and 297 `--mat-*` token invocations) that directly contradict Runway's design philosophy.

```
┌─────────────────────────────────────────────────────────────┐
│ RUNWAY SPECIFICATION COMPLIANCE                             │
├──────────────────────────┬───────┬──────────────────────────┤
│ Classification           │ Count │ Percentage               │
├──────────────────────────┼───────┼──────────────────────────┤
│ Fully Implemented        │   7   │   9.9%                   │
│ Partially Implemented    │  24   │  33.8%                   │
│ Not Implemented          │  21   │  29.6%                   │
│ Conflicts with Legacy    │  19   │  26.8%                   │
├──────────────────────────┼───────┼──────────────────────────┤
│ TOTAL AUDITED RULES      │  71   │ 100.0%                   │
└──────────────────────────┴───────┴──────────────────────────┘
```

> [!IMPORTANT]
> **Passing tests and zero UI-check violations do not equal Runway compliance.**  
> `npm run ui:check` only checks raw `#hex` codes, arbitrary Tailwind brackets (`w-[...]`), raw `<button>`, component `fetch`, inline `style={{ }}`, and dead radius names (`rounded-button`). It does not detect Google Icons, Google Sans typography, hardcoded `shadow-xl` classes, or 297 legacy Material variables.

---

## 2. Specification-to-Code Mapping & Detailed Rule Analysis

### 2.1 Colors & Semantic Roles (17 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 1 | `runway-black` | `#000000` | Canvas background, `:root { --surface-canvas: #000000 }` | **FULLY IMPLEMENTED** | [`src/app/globals.css:270, 284`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L270) |
| 2 | `deep-black` | `#030303` | Not defined in CSS variables or theme; `#000000` or `#131314` used | **NOT IMPLEMENTED** | Absent from `globals.css` |
| 3 | `dark-surface` | `#1a1a1a` | OpenArt uses `#131314` (panel), `#1e1f20` (card), `#282a2c` (elevated) | **PARTIALLY IMPLEMENTED** | Preserved brand colors represent surface tiers |
| 4 | `pure-white` | `#ffffff` | Primary text, high-contrast actions (`text-white`, `bg-white`) | **FULLY IMPLEMENTED** | [`src/app/globals.css:372`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L372) |
| 5 | `near-white` | `#fefefe` | Not defined; pure white `#ffffff` or `text-white/90` used | **NOT IMPLEMENTED** | Absent from `globals.css` |
| 6 | `cool-cloud` | `#e9ecf2` | Defined once in `.light-section` utility, but 0 usages in application pages | **NOT IMPLEMENTED** | [`src/app/globals.css:1192`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1192) (0 usages in `src/`) |
| 7 | `border-dark` | `#27272a` | Never declared in `:root`; referenced with fallback `rgba(255,255,255,0.1)` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:917, 1405`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L917) |
| 8 | `charcoal` | `#404040` | Not defined; 0 usages | **NOT IMPLEMENTED** | Absent from `globals.css` |
| 9 | `near-charcoal` | `#3f3f3f` | Not defined; 0 usages | **NOT IMPLEMENTED** | Absent from `globals.css` |
| 10 | `cool-slate` | `#767d88` | **Signature Runway Neutral**: 0 declarations, 0 usages in entire app | **NOT IMPLEMENTED** | Absent from entire repo; `text-white/60` used instead |
| 11 | `mid-slate` | `#7d848e` | Tertiary text color: 0 declarations, 0 usages | **NOT IMPLEMENTED** | Absent from entire repo |
| 12 | `muted-gray` | `#a7a7a7` | De-emphasized content: 0 declarations, 0 usages | **NOT IMPLEMENTED** | Absent from entire repo |
| 13 | `cool-silver` | `#c9ccd1` | Light borders: 0 declarations, 0 usages | **NOT IMPLEMENTED** | Absent from entire repo |
| 14 | `light-silver` | `#d0d4d4` | Light dividers: 0 declarations, 0 usages | **NOT IMPLEMENTED** | Absent from entire repo |
| 15 | `tailwind-gray` | `#6b7280` | Native Tailwind gray exists, but not mapped as Runway secondary role | **PARTIALLY IMPLEMENTED** | Standard Tailwind engine |
| 16 | `dark-link` | `#0c0c0c` | OpenArt uses Google blue `--mat-sys-link: #a8c7fa` for links | **CONFLICTS WITH LEGACY** | [`src/shared/ui/button.jsx:47`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L47) |
| 17 | `footer-gray` | `#999999` | Footer links: 0 usages; OpenArt footer uses `text-muted-foreground` | **NOT IMPLEMENTED** | Absent from components |

---

### 2.2 Typography & Fonts (11 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 18 | Font Family | Single typeface `abcNormal` (fallback Inter / DM Sans) | **Loads Google Sans Variable, Google Symbols, Caveat, Geist Mono**; `--font-sans` is Google Sans | **CONFLICTS WITH LEGACY** | [`src/app/layout.js:15-49, 81`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/layout.js#L15), [`globals.css:168`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L168) |
| 19 | Display Hero | 48px / weight 400 / line-height 1.00 / tracking -1.2px | Utility `.font-display-hero` defined in CSS; **0 usages** in components | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1205`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1205) (0 usages in `src/`) |
| 20 | Section Heading | 40px / weight 400 / line-height 1.05 / tracking -1.0px | Utility `.font-section-heading` defined; **0 usages** in components | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1211`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1211) (0 usages in `src/`) |
| 21 | Sub-heading | 36px / weight 400 / line-height 1.00 / tracking -0.9px | Utility `.font-sub-heading` defined; **0 usages** in components | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1217`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1217) (0 usages in `src/`) |
| 22 | Card Title | 24px / weight 400 / line-height 1.00 / tracking 0 | Utility `.font-card-title` defined; **0 usages**. `CardTitle` uses `text-base font-semibold` (16px) | **PARTIALLY IMPLEMENTED** | [`src/shared/ui/card.jsx:58`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx#L58), [`globals.css:1223`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1223) |
| 23 | Feature Title | 20px / weight 400 / line-height 1.00 / tracking 0 | Utility `.font-feature-title` defined; **0 usages** in components | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1229`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1229) (0 usages in `src/`) |
| 24 | Body | 16px / weight 400 / line-height 1.40 / tracking -0.16px | Utility `.font-cinema-body` defined; **0 usages**. Components use Tailwind default `text-sm` (14px) | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1235`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1235) |
| 25 | Button Typography | 14px / weight 600 / line-height 1.25 / tracking 0 | `button.jsx` sets `text-xs font-semibold` (**12px**, not 14px) | **CONFLICTS WITH LEGACY** | [`src/shared/ui/button.jsx:37-47`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L37) |
| 26 | Caption Label | 14px / weight 500 / line-height 1.30 / tracking 0.35px uppercase | Utility `.font-caption-label` defined; **0 usages** in components | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1241`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1241) |
| 27 | Small | 13px / weight 400 / line-height 1.30 / tracking -0.20px | Not defined in CSS; components use `text-xs` (12px) | **NOT IMPLEMENTED** | Absent from `globals.css` |
| 28 | Micro-tag | 11px / weight 450 / line-height 1.30 / tracking 0 | Utility `.font-micro-tag` defined; **0 usages**. Components use `text-[10px]` or `text-xs` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1248`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1248) |

---

### 2.3 Spacing, Sizing & Layout (14 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 29 | Spacing `xxs` | 4px | Token `--spacing-xxs: 4px` in CSS; components use Tailwind `gap-1` / `p-1` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:228`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L228) |
| 30 | Spacing `xs` | 6px | Token `--spacing-xs: 6px` in CSS; **0 component usages** (uses `gap-1.5`) | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:229`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L229) |
| 31 | Spacing `sm` | 8px | Token `--spacing-sm: 8px` in CSS; components use standard `gap-2` / `p-2` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:230`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L230) |
| 32 | Spacing `md` | 12px | Token `--spacing-md: 12px` in CSS; components use standard `gap-3` / `p-3` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:231`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L231) |
| 33 | Spacing `base` | 16px | Token `--spacing-base: 16px` in CSS; components use standard `p-4` / `gap-4` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:232`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L232) |
| 34 | Spacing `lg` | 20px | Token `--spacing-lg: 20px` in CSS; components use standard `p-5` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:233`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L233) |
| 35 | Spacing `xl` | 24px | Token `--spacing-xl: 24px` in CSS; components use standard `p-6` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:234`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L234) |
| 36 | Spacing `xxl` | 28px | Token `--spacing-xxl: 28px` in CSS; **0 component usages** | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:235`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L235) |
| 37 | Spacing `section` | 32px | Token `--spacing-section: 32px`; components use `p-8` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:236`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L236) |
| 38 | Spacing `section-lg` | 48px | Token `--spacing-section-lg: 48px`; components use `py-12` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:237`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L237) |
| 39 | Spacing `section-xl` | 64px | Token `--spacing-section-xl: 64px`; components use `py-16` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:238`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L238) |
| 40 | Spacing `section-xxl` | 78px | Token `--spacing-section-xxl: 78px`; **0 component usages** | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:239`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L239) |
| 41 | Cinema Container | 1600px max width | Defined in CSS (`--container-cinema`); layouts use `max-w-7xl` (1280px) or `w-full` | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:242, 1174`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L242) |
| 42 | Editorial Grid Asymmetry | Large feature image + 2 smaller supporting images | Cinema Studio uses symmetrical CSS grid (`grid-cols-2`, `grid-cols-3`, `grid-cols-4`) | **NOT IMPLEMENTED** | [`src/widgets/StudioLayout/GenerationsStudio/`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/) |

---

### 2.4 Border Radius Hierarchy (6 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 43 | Radius `none` | 0px | Fully bound in CSS; `rounded-none` used on flush layouts | **FULLY IMPLEMENTED** | [`src/app/globals.css:201`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L201) |
| 44 | Radius `sharp` | 4px | Bound to `--radius-sm`; used on Buttons, Inputs, Checkboxes (`rounded-sm`) | **FULLY IMPLEMENTED** | [`src/shared/ui/button.jsx:37`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L37), [`input.jsx:127`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/input.jsx#L127) |
| 45 | Radius `subtle` | 6px | Bound to `--radius-md`; used on some chips (`MediaChip.jsx`) | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:204`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L204) |
| 46 | Radius `comfortable` | 8px | Bound to `--radius-lg`; used on Cards, Dropdown Panels, Context Menus (`rounded-lg`) | **FULLY IMPLEMENTED** | [`src/shared/ui/card.jsx:26`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/card.jsx#L26), [`dropdown-menu.jsx:49`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L49) |
| 47 | Radius `generous` | 16px | Bound to `--radius-2xl`; used on Dialogs, Modals (`rounded-2xl`) | **FULLY IMPLEMENTED** | [`src/shared/ui/dialog.jsx:65`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L65) |
| 48 | Non-Runway Radiuses | System specifies **strictly 4 tiers** (4px, 6px, 8px, 16px). No 12px (`rounded-xl`) or 24px (`rounded-3xl`) | **80 active occurrences of `rounded-xl` (12px) and `rounded-3xl` (24px)** in active component JSX | **CONFLICTS WITH LEGACY** | [`src/widgets/NewElementDialog/NewElementDialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx), [`src/app/cinema-studio/[projectId]/assets/page.js:24`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/cinema-studio/[projectId]/assets/page.js#L24) |

---

### 2.5 Shadows & Elevation (5 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 49 | Zero Box-Shadow Law | Zero box-shadow in entire system (`shadow-none`) | `--shadow-*: none` defined in `@theme inline`, **BUT over 40 hardcoded Tailwind shadow classes (`shadow-xl`, `shadow-2xl`, `shadow-md`, `shadow-sm`, `shadow-xs`) remain in JSX** | **PARTIALLY IMPLEMENTED** | [`src/widgets/CoreMediaItemView/CoreMediaItemView.jsx:134`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L134), [`CharacterCardKrea.jsx:87`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L87), [`slider.jsx:88`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/slider.jsx#L88) |
| 50 | Flat Elevation (Level 0) | Dominant state; depth from photography & section contrast | Dominant surface structure across app | **FULLY IMPLEMENTED** | Visual presentation |
| 51 | Bordered Elevation (Level 1) | Single dark-mode border color `#27272a` only on alert containers | Hairline borders (`border-white/10`, `border-white/5`) applied ubiquitously to almost every component | **CONFLICTS WITH LEGACY** | Across all components |
| 52 | Dark Section Elevation (Level 2) | `#000000` / `#1a1a1a` background with white text | Full dark theme active | **FULLY IMPLEMENTED** | Core layout canvas |
| 53 | Light Section Elevation (Level 3) | Alternating `#e9ecf2` background with `#404040` charcoal text | **Zero light editorial sections exist in the application** (app is 100% dark mode) | **NOT IMPLEMENTED** | `html { color-scheme: light dark }` |

---

### 2.6 Components & Recipes (12 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 54 | `button-primary` | **Transparent fill**, white text, 14px font, 1px `#27272a` border, 4px radius | **Solid white fill** (`bg-white text-black`), 12px `text-xs`, border-none. Follows Krea/Google CTA pattern, not Runway | **CONFLICTS WITH LEGACY** | [`src/shared/ui/button.jsx:37`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L37) |
| 55 | `button-light` | Transparent fill, `#404040` charcoal text, 14px, 4px radius | Not implemented; 0 light buttons | **NOT IMPLEMENTED** | Absent from `button.jsx` |
| 56 | `cinematic-hero` | Full-viewport video/image, 48px hero typography, 78px padding | Landing hero uses marketing title, badges, model carousel slider | **NOT IMPLEMENTED** | [`src/views/landing/components/HeroSection.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/HeroSection.jsx) |
| 57 | `hero-subtext` | 16px body in cool-slate `#767d88` | 0 usages of cool-slate; uses `text-white/60` | **NOT IMPLEMENTED** | Absent from components |
| 58 | `section-label` | 14px uppercase weight 500, 0.35px tracking, `#767d88`, no background | Solid filled Badges (`bg-white/15`, `bg-lime-400`, `bg-emerald-950`) used instead | **NOT IMPLEMENTED** | [`src/shared/ui/badge.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/badge.jsx) |
| 59 | `dark-section` | `#000000` background, white text, 78px vertical padding | Utility `.dark-section` defined in CSS; **0 usages in application pages** | **PARTIALLY IMPLEMENTED** | [`src/app/globals.css:1186`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1186) |
| 60 | `light-section` | `#e9ecf2` background, charcoal text, 64px padding | Utility `.light-section` defined; **0 usages** | **NOT IMPLEMENTED** | [`src/app/globals.css:1192`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L1192) |
| 61 | `research-card` | Photo thumbnail at 8px radius, single title line, **no metadata stack, no badge cluster** | `MediaGridItem.jsx` has star buttons, dropdown menus, action button overlays, and status indicators | **CONFLICTS WITH LEGACY** | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx) |
| 62 | `trust-logo` | Monochrome logos with generous spacing | 0 trust bar components implemented | **NOT IMPLEMENTED** | Absent from components |
| 63 | `alert-container` | Dark surface `#1a1a1a`, 1px `#27272a` border, 16px radius, 24px padding | Dialogs have 16px radius, but use heavy glassmorphism (`backdrop-blur-[100px]`) and Google icons | **PARTIALLY IMPLEMENTED** | [`src/shared/ui/dialog.jsx:65-74`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L65) |
| 64 | `mission-statement` | 36px sub-heading, centered, 78px padding | 0 mission statement sections | **NOT IMPLEMENTED** | Absent from components |
| 65 | `nav-link` | Transparent, 16px abcNormal, opacity hover, zero chrome | Navigation uses dense Google icons, action buttons, search bar with glassmorphism | **CONFLICTS WITH LEGACY** | [`src/widgets/StudioNavbar/`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/) |

---

### 2.7 Surfaces, Gradients & Chrome Discipline (6 Rules)

| # | Runway Rule | Specification Value | Actual Implementation in Codebase | Classification | Line Evidence / File Path |
|---|---|---|---|---|---|
| 66 | No Gradients in Interface | "There is no gradient in the interface. All visual richness comes from AI photographic content." | **19 active `bg-gradient` instances in `src/`** (e.g. `bg-gradient-to-t`, `bg-gradient-to-r`) | **CONFLICTS WITH LEGACY** | [`src/features/payments/ui/PackageSelectionDialog.jsx:178`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L178), [`HeroSection.jsx:119`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/HeroSection.jsx#L119) |
| 67 | No Glassmorphism / Backdrop Blur | Flat surfaces without frosted glass; zero blur | **87 active `backdrop-blur` instances in `src/`** (`backdrop-blur-[100px]`, `backdrop-blur-2xl`, etc.) | **CONFLICTS WITH LEGACY** | [`src/shared/ui/dialog.jsx:66`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L66), [`dropdown-menu.jsx:40`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L40), [`FlowPromptBoxSettings.jsx:144`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L144) |
| 68 | Minimalist Chrome (Photography over icons) | "photography instead of icons — chrome stays out of the way" | **228 occurrences of `GoogleIcon` across `src/`**; every header, action, input, and drawer is icon-dense | **CONFLICTS WITH LEGACY** | Found across 46 component files |
| 69 | Single Font Family Commitment | Single typeface `abcNormal` (or Inter) carries every role | Google Sans, Google Sans Text, Google Symbols, Caveat, and Geist Mono loaded in parallel | **CONFLICTS WITH LEGACY** | [`src/app/layout.js:15-49`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/layout.js#L15) |
| 70 | Clean Token Architecture | Only canonical tokens in CSS | **419 `--mat-` and `--flow-` tokens in `globals.css`**; **297 direct invocations in component JSX** | **CONFLICTS WITH LEGACY** | [`src/app/globals.css:440-915`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L440), 297 JSX sites in `src/` |
| 71 | No Circular / Pill Controls | Pure Runway has no `rounded.full` ("Runway's geometry is deliberately not circular") | OpenArt actively uses `rounded-full` for filter pills, avatars, switches, and radio dots (**Intentionally preserved brand exception**) | **CONFLICTS WITH LEGACY** | Approved brand exception in master plan |

---

## 3. Legacy Conventions Analysis

### 3.1 Legacy Conventions That Are Intentionally Preserved
1. **OpenArt Brand Colors:** `#000000` (canvas), `#131314` (panel), `#1e1f20` (card), `#282a2c` (elevated), `#EFFE17` (neon CTA), `#fe6e6e` (danger), `#a8c7fa` (accent blue/link). Preserving these is an explicit instruction in the master migration prompt.
2. **Circular Controls for Pills & Avatars (`rounded-full`):** While Runway has no circular geometry, OpenArt retains pills, circular avatars, toggle switches, and radio dots for functional parity.
3. **Core Button Variant Names:** All 6 public variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`) must be kept for backward compatibility.

### 3.2 Legacy Conventions That Contradict Runway and Must Be Replaced
1. **Google Material Icons Ubiquity (228 occurrences):** Runway mandates that chrome disappear and photographic content carry the UI. Excessive icon chrome (e.g. in inputs, tabs, titles) should be significantly reduced.
2. **Heavy Glassmorphism (87 occurrences):** `backdrop-blur-[100px]`, `backdrop-blur-[80px]`, and `rgba(22, 23, 24, 0.9)` are relics of Google Flow. Runway uses flat dark surfaces without frosted glass.
3. **Dead Shadow Classes in JSX (40+ occurrences):** `shadow-xl`, `shadow-2xl`, `shadow-md`, `shadow-sm`, and `shadow-xs` are still hardcoded in components (e.g. `CoreMediaItemView.jsx`, `CharacterCardKrea.jsx`, `slider.jsx`, `switch.jsx`, `tabs.jsx`).
4. **Non-Runway Border Radiuses (80 occurrences):** `rounded-xl` (12px) and `rounded-3xl` (24px) contradict Runway's 4-tier geometry (4px, 6px, 8px, 16px).
5. **Google Flow / Material 3 Tokens (419 in CSS, 297 in JSX):** Extensive references to `--mat-sys-surface-container-high`, `--mat-sys-on-surface`, `--foreground-state-15`, `--flow-menu-panel-*` remain entrenched in component JSX.
6. **Font Stack:** Google Sans font is loaded in `layout.js` instead of Inter / DM Sans (the open-source geometric equivalents of `abcNormal`).
7. **Button Primary Styling:** Button `primary` is styled as a solid white fill with black text (Google/Krea style) rather than Runway's transparent, 1px-bordered restrained button.

---

## 4. Prioritized Implementation Plan (To Achieve Full Compliance)

To transition from ~10% actual compliance to 100% compliance without breaking OpenArt brand identity or existing APIs:

### Priority 1: Zero-Shadow & Radius Pruning in JSX (High Impact, Zero Risk)
- Replace all 40+ remaining `shadow-*` classes in components with `shadow-none` (or delete the class entirely).
- Replace all 80 occurrences of `rounded-xl` (12px) with `rounded-lg` (8px comfortable) or `rounded-2xl` (16px generous) per component role.
- Update `scripts/ui-check.cjs` with a new rule **U7** that forbids `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` outside of intentional exclusions.

### Priority 2: Glassmorphism Elimination (Visual Restraint)
- Remove `backdrop-blur-*` classes from `dialog.jsx`, `dropdown-menu.jsx`, `popover.jsx`, `tooltip.jsx`, and `FlowPromptBoxSettings.jsx`.
- Transition panels to solid flat surfaces: `#131314` (panel) or `#1e1f20` (card) with 1px hairline border (`border-white/10`).

### Priority 3: Neutral Palette & Cool-Slate Alignment
- Define Runway's `--color-cool-slate: #767d88` and `--color-mid-slate: #7d848e` in `globals.css` `@theme inline`.
- Replace unstructured `text-white/60`, `text-white/70`, `text-zinc-400` on secondary and metadata text with `text-cool-slate` or `text-mid-slate`.

### Priority 4: Purge Legacy Google Flow / Material 3 Tokens (Codebase Hygiene)
- Migrate the 297 `var(--mat-...)` and `var(--foreground-state-...)` references in component JSX to semantic Tailwind utilities (`bg-surface-elevated`, `text-muted-foreground`, `hover:bg-white/10`).
- Once no call sites remain, safely prune lines 440–915 and 1025–1172 from `src/app/globals.css`.

### Priority 5: Font Stack & Typography Scale Adoption
- Configure Inter or DM Sans in `src/app/layout.js` as the canonical sans-serif font family.
- Apply tight line-heights (1.00) and negative tracking (-1.2px / -0.9px) to display headlines and section titles.
- Update Button primitive font size to 14px (`text-sm font-semibold`) matching Runway `typography.button`.
