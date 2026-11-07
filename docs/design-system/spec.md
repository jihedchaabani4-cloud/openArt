# Spec: Runway Design System Full Migration for OpenArt

**Status:** ready-for-agent  
**Date:** 2026-11-05  
**Target Repository:** `my-app` (Frontend)  
**Branch:** `runway-design`  

---

## Problem Statement

OpenArt / Labveil's frontend interface accumulated visual inconsistencies over time, including scattered Tailwind arbitrary values, non-standard drop shadows, inconsistent border radiuses across dialogs and cards, and an over-bloated Button component API with dozens of specialized variants and duplicate size props.

Users and developers need a coherent, cinematic, photography-first design system that lets AI-generated content dominate the screen with zero visual noise, consistent 8px-based spacing, sharp geometric corners (4px buttons/inputs, 8px cards/menus, 16px dialogs), and zero box-shadows, while strictly preserving OpenArt's distinctive website brand colors and maintaining backwards compatibility for all public component variant APIs.

---

## Solution

Migrate the entire OpenArt frontend (`my-app`) to the Runway Design System specification:
1. **Foundation & Tokens:** Implement Runway's 8px base spacing scale (4px to 78px), radius tiers (`sharp` 4px, `subtle` 6px, `comfortable` 8px, `generous` 16px, `full` 9999px), and 1600px cinema container width in CSS variables and Tailwind v4 `@theme inline` within `globals.css`.
2. **Brand Color Exception:** Map Runway's monochrome and cool-slate roles directly to OpenArt's existing dark palette (`#000000` canvas, `#131314` panel, `#1e1f20` card, `#282a2c` elevated, `#EFFE17` neon CTA, `#a8c7fa` accent blue, `#fe6e6e` danger, `#80da88` success, `#fcbd00` warning). Do not import Runway's color palette.
3. **Zero Box-Shadow Law:** Eliminate all drop shadows (`shadow-none`) across all surfaces, cards, buttons, and dialogs. Depth is achieved purely through 1px hairline borders (`border-white/10`), surface background contrast, and full-bleed imagery.
4. **Shared UI Primitives:** Standardize `Button` (6 core semantic variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `link`), `Input`, `Textarea`, `Card`, `Dialog`, `DropdownMenu`, `Tabs`, `Checkbox`, `RadioGroup`, `Slider`, `Switch`, `Badge`, `Avatar`, `Tooltip`, `Popover`.
5. **Feature & Widget Alignment:** Migrate call sites across the Studio shell, Cinema Studio, Prompt Bar, Elements, Characters, Assets, and Payments in vertical slices.
6. **Enforcement & Ratchet:** Uphold `scripts/ui-check.cjs` with 0 new violations for U1–U6 and verify against the comprehensive `vitest` test suite.

---

## User Stories

1. As a creative artist using Cinema Studio, I want full-bleed layouts with zero drop shadows, so that AI-generated imagery and video dominate the viewport without distracting chrome.
2. As a creator viewing media cards, I want 8px comfortable rounded corners with 1px hairline borders, so that card thumbnails have a disciplined cinematic presentation.
3. As a developer implementing actions, I want the Button primitive to support the 6 core semantic variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`), so that I can reliably choose the correct action hierarchy without API confusion.
4. As a user clicking action buttons, I want 4px sharp geometric corners, high contrast, and smooth active press feedback, so that controls feel precise and responsive.
5. As an editor configuring element references, I want modal dialogs to feature 16px generous rounded corners with subtle backdrop blur and no drop shadows, so that overlay tasks feel immersive.
6. As a creator working on a large display, I want the studio workspace to scale up to 1600px cinema max-width, so that complex generation workflows utilize wide screens effectively.
7. As a subscriber selecting credit packages, I want clean dark cards with OpenArt neon CTA buttons, so that the billing experience is aesthetically cohesive with the rest of the app.
8. As a user typing in search bars or prompt boxes, I want 4px sharp inputs with subtle borders and clear focus rings, so that text editing feels modern and effortless.
9. As a user right-clicking studio items, I want dropdown and context menus with 8px comfortable radius and 4px sharp items, so that contextual navigation feels unified.
10. As a filmmaker organizing character sheets, I want 8px card grids and full-bleed media previews, so that multi-view element references look like professional film contact sheets.
11. As a user adjusting generation sliders, I want full-rounded tracks and thumbs without drop shadows, so that numeric adjustments are smooth and visually clean.
12. As a user toggling settings with switches, I want full-rounded flat pill switches, so that toggle states are immediately obvious.
13. As a developer maintaining the codebase, I want an interactive showcase at `/dev/ui`, so that I can inspect all design tokens, variants, and component states in one place.
14. As a developer committing frontend code, I want `npm run ui:check` to prevent new raw color literals, arbitrary values, and raw buttons, so that design system encapsulation never regresses.

---

## Implementation Decisions

### 1. Token Architecture (3-Layer Hierarchy)
- **Layer 1 (Primitive Tokens):** `none` (0px), `sharp` (4px), `subtle` (6px), `comfortable` (8px), `generous` (16px), `full` (9999px).
- **Layer 2 (Component Mappings):**
  - Buttons, Inputs, Badges, Checkboxes, Tooltips $\rightarrow$ `sharp` (4px)
  - Secondary tags, intermediate chips $\rightarrow$ `subtle` (6px)
  - Cards, Menus, Popovers, Panels $\rightarrow$ `comfortable` (8px)
  - Dialogs, Modals, Large Sheets $\rightarrow$ `generous` (16px)
  - Pills, Avatars, Radio dots, Slider thumbs $\rightarrow$ `full` (9999px)
- **Layer 3 (Implementation Mappings):** Declared in `:root` and `@theme inline` in `globals.css` with standard Tailwind utility classes (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-2xl`, `rounded-full`).

### 2. Spacing Scale
- 8px base scale with precise micro steps: `xxs` (4px), `xs` (6px), `sm` (8px), `md` (12px), `base` (16px), `lg` (20px), `xl` (24px), `xxl` (28px), `section` (32px), `section-lg` (48px), `section-xl` (64px), `section-xxl` (78px).

### 3. OpenArt Brand Color Preservation
- Preserve existing OpenArt dark brand identity:
  - Canvas surface: `#000000`
  - Panel surface: `#131314`
  - Card surface: `#1e1f20`
  - Elevated surface: `#282a2c`
  - Highest surface: `#333537`
  - Neon CTA: `#EFFE17`
  - Accent link/blue: `#a8c7fa`
  - Danger: `#fe6e6e`
  - Success: `#80da88`
  - Warning: `#fcbd00`

### 4. Button Primitive Contract
- Six core semantic variants only:
  - `primary`: White background, black text, font-semibold (`bg-white text-black hover:bg-white/90`)
  - `secondary`: Surface container high (`bg-[var(--mat-sys-surface-container-high,#282a2c)] text-[var(--mat-sys-on-surface,#e3e3e3)]`)
  - `outline`: Bordered surface action (`border border-[var(--mat-sys-outline-variant,#444746)] bg-transparent`)
  - `ghost`: Transparent background, subtle hover (`bg-transparent hover:bg-white/10`)
  - `danger`: Destructive action (`bg-transparent text-[var(--foreground-color-danger,#fe6e6e)]`)
  - `link`: Inline text link (`text-[var(--mat-sys-link,#a8c7fa)] underline-offset-4 hover:underline`)
- Sizing and shapes are handled predictably via standard Tailwind classes in `className` (`h-10 px-6 text-sm`, `size-8 p-0`, `rounded-full`) merged with `tailwind-merge` (`cn`).
- No generic `size` or `shape` props on Button.

### 5. Encapsulation Law
- Shared primitives own all visual styling (backgrounds, borders, internal paddings, corner radius).
- Call-site `className` is strictly reserved for positioning and layout within parent layouts (`w-full`, `max-w-fit`, `shrink-0`, `flex`, `grid`).
- Prohibited in `className`: Ad-hoc overriding of component background colors, borders, internal padding, or corner radiuses when those styles belong to the shared primitive.

---

## Testing Decisions

- **Test Framework:** `vitest` with `@testing-library/react` and `jsdom`.
- **Seams Tested:**
  - Component Contract Seams: asserting rendered DOM elements, `data-slot`, `data-variant`, `role`, ARIA attributes, and canonical classes without mocking internal styles.
  - Primitives Suite: [`src/shared/ui/__tests__/primitives.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/__tests__/primitives.test.jsx) (Checkbox, RadioGroup, Tooltip, Popover, Tabs, Card, Badge, Skeleton, Slider, Switch, Dialog, Input, Select).
  - Button Suite: [`src/shared/ui/__tests__/button.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/__tests__/button.test.jsx) (validates all 6 core variants, ref forwarding, disabled states, and absence of generic size/shape props).
  - ButtonGroup Suite: [`src/shared/ui/__tests__/button-group.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/__tests__/button-group.test.jsx).
  - Layout & Navigation Suite: [`src/widgets/StudioLayout/__tests__/StudioLayoutAlignment.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/__tests__/StudioLayoutAlignment.test.jsx) and [`src/widgets/StudioNavbar/__tests__/TrashNavbarAndLayout.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/__tests__/TrashNavbarAndLayout.test.jsx).
  - UI Ratchet Enforcement: [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs) tested via [`src/shared/__tests__/uiCheckRules.test.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/__tests__/uiCheckRules.test.js) ensuring 0 new violations.

---

## Out of Scope

- Redesigning product workflows, generation pipelines, or user authorization flows.
- Modifying backend schemas, APIs, controllers, or database migrations in `apiOpenArt`.
- Changing third-party model provider integrations (e.g. Fal, Runway, Krea, LTX).
- Replacing OpenArt's brand colors with Runway's monochrome palette.
- Introducing a secondary component library or replacing Tailwind CSS v4.

---

## Further Notes

- Interactive showcase is viewable at route `/dev/ui` in development mode.
- Tracking issues are published locally at `.scratch/runway-design-system/issues/`.
- All completed work is accompanied by test validation and verified with `npm run ui:check`.
