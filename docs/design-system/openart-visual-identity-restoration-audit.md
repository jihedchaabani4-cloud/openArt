# OpenArt Visual Identity Restoration Audit & Implementation Plan

**Project:** OpenArt / Labveil  
**Branch:** `runway-design`  
**Status:** Approved with Technical Corrections  
**Date:** 2026-11-05  

---

## 1. Executive Summary & Design Philosophy

The Runway Design System migration successfully established crucial architectural discipline across OpenArt:
- Clean typography hierarchy using **Inter** and **Noto Sans Arabic**.
- Muted secondary typography via **Cool-Slate** (`#767d88`).
- Strict 4-tier geometric radius hierarchy (**4px, 6px, 8px, 16px**).
- 1px hairline border separation (**`border-white/10`**).
- Eradication of 500+ arbitrary Tailwind classes, dead CSS selectors, and legacy `--mat-*` token bloat.

However, during Tickets 04–08, the application was **over-flattened**. Essential visual characteristics that defined OpenArt's premium, high-tech creative atmosphere were stripped in favor of uniform, opaque dark slabs (`#131314` and `#1e1f20`):
1. **Glassmorphism & Controlled Backdrop Blur:** The Prompt Bar, settings popover, modal backdrop, and floating media overlays lost their translucency.
2. **Neon Brand CTA (`#EFFE17`):** OpenArt's signature electric yellow call-to-action was replaced with monochrome white across default button primitives.
3. **Tactile Micro-interactions:** Snappy active press scales (`active:scale-[0.98]`, `active:scale-95`) and hover highlights were muted.

### Guiding Synthesis:
> **"OpenArt provides the visual identity. Runway provides useful design discipline and consistency."**
> 
> We do NOT revert or abandon the Runway migration. We keep Runway's typography, spacing scales, 4-tier radius hierarchy, hairline border geometry, and semantic tokens, while restoring OpenArt's signature controlled glassmorphism, brand gradients, neon accents, and tactile depth.

---

## 2. Technical Clarifications & Rendering Constraints

### 2.1 Actual Tailwind CSS v4 Backdrop-Blur Scale
The project uses Tailwind CSS v4 (`@tailwindcss/postcss: ^4`). Under Tailwind v4 defaults, the backdrop-blur tokens correspond to:
- `backdrop-blur-xs`: `4px`
- `backdrop-blur-sm`: `8px`
- `backdrop-blur-md`: `12px`
- `backdrop-blur-lg`: `16px`
- `backdrop-blur-xl`: `24px`
- `backdrop-blur-2xl`: `40px` (Note: **40px**, not 20px)
- `backdrop-blur-3xl`: `64px`

### 2.2 Performance & GPU Fill-Rate Discipline
- Backdrop filters are **not** automatically cheap. GPU fragment shader cost scales directly with filtered pixel surface area (`O(width * height * kernel_radius)`).
- Applying large blur kernels (e.g. `backdrop-blur-2xl` or `100px`) over full-screen overlays creates substantial compositing overhead, causing frame drops during CSS animations and battery drain on mobile devices.
- **Rule of Restraint:**
  - Full-viewport overlays (`DialogOverlay`): use light, moderate blur (`backdrop-blur-sm: 8px` or `backdrop-blur-md: 12px`) with `bg-black/70`.
  - Floating creation chrome (Prompt Bar, popover menus): use controlled `backdrop-blur-xl` (`24px`) or `backdrop-blur-lg` (`16px`) strictly bounded to the component container.
  - Media overlay pills (pin, play, like): use compact `backdrop-blur-md` (`12px`) over media only.
  - Large static panels and page canvas remain 100% opaque without backdrop filters.

### 2.3 Strict Shadow Law (Rule U7 Intact)
- **Rule U7 remains 100% intact.** External positive elevation shadows (`shadow-xs` through `shadow-2xl`) remain strictly forbidden.
- No general-purpose `shadow-ambient` class will be introduced.
- Depth is achieved via:
  1. Contrast between `bg-surface-canvas` (`#000000`), `bg-surface-panel` (`#131314`), and `bg-surface-card` (`#1e1f20`).
  2. Translucent surfaces + controlled backdrop blur.
  3. Crisp 1px hairline borders (`border-white/10` and `hover:border-white/20`).

### 2.4 Button Primitive Integrity & 6 Core Variants
- The six canonical Runway semantic variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`) are strictly preserved.
- `variant="primary"` remains high-contrast white (`bg-white text-black`).
- The unauthorized `variant="neon"` on Button has been completely removed. Button variants are strictly limited to the 6 canonical Runway semantic variants.
- OpenArt's brand color `#EFFE17` is preserved in existing non-button contexts (such as `<Badge variant="neon">` and designated branding accents), but never as a Button variant.
- Zero generic `size` or `shape` props.

---

## 3. Approved Restoration Scope & Inventory

| # | Slice / Component | Target File | Pre-Migration Style | Current Flattened Style | Approved Restored Treatment | Runway Rule Alignment | Priority |
|---|---|---|---|---|---|---|---|
| **1** | **Floating Prompt Bar** | [`promptBarLayout.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/model/core/promptBarLayout.js) | `bg-(--background-base-pri)` (`rgba(22,23,24,0.9)`), `backdrop-blur-[80px]` | `bg-surface-panel` (`#131314` solid), `border border-white/10`, `shadow-none` | `bg-surface-panel/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-none` | 16px radius preserved, hairline border preserved, zero positive shadows. | **P0** |
| **2** | **Settings Popover** | [`FlowPromptBoxSettings.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx) | `backgroundColor: "rgba(22,23,24,0.6)"`, `backdropFilter: "blur(100px)"` | `backgroundColor: "#1e1f20"` (opaque), `border: "1px solid rgba(255,255,255,0.10)"` | `bg-surface-card/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-none` (`backgroundColor: "rgba(30,31,32,0.9)"`, `backdropFilter: "blur(24px)"`) | 8px radius preserved, 1px border preserved. | **P0** |
| **3** | **Prompt Bar Top Panel & Mentions** | [`PromptBarTopPanel.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx), [`AtMentionMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx) | `bg-(--background-base-pri)`, `backdrop-blur-[80px]` | Solid `bg-surface-card`, `border border-white/10` | `bg-surface-card/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-none` | Consistent with Prompt Bar shell. | **P0** |
| **4** | **Dialog Overlay** | [`dialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx) | `bg-black/65 backdrop-blur-[24px]` | `bg-black/75` (zero blur) | `bg-black/70 backdrop-blur-md` (`12px` blur) | Defocuses background without excessive GPU fill overhead. | **P0** |
| **5** | **Dialog Content (`variant="glass"`)** | [`dialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx) | `bg-[rgba(20,21,24,0.72)] backdrop-blur-[100px]` | Solid `bg-surface-panel` | `bg-surface-panel/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-none text-white` | Glass styling applies ONLY to `variant="glass"`. Other variants remain solid. | **P0** |
| **6** | **Button 6 Core Variants** | [`button.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx) | Legacy variants | Flat 6 core variants | Preserved strictly the 6 core Runway semantic variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`). Primary CTA is white (`bg-white text-black`). Unauthorized `neon` variant removed. | Exactly 6 variants, 4px radius, no arbitrary classes. | **P0** |
| **7** | **Floating Media Action Overlays** | [`LibraryMediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/assets/ui/LibraryMediaGridItem.jsx), [`CharacterCardKrea.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx) | `bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/20` | Flat solid `bg-surface-card` or `bg-surface-panel/90`, zero blur | `bg-black/50 backdrop-blur-md hover:bg-black/70 active:scale-95 text-white border border-white/15 rounded-sm shadow-none` | Applies strictly to floating controls over actual media. | **P1** |
| **8** | **Dropdown Menus** | [`dropdown-menu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx) | `backgroundColor: "rgba(22,23,24,0.9)"`, `backdropFilter: "blur(100px)"` | Flat solid `bg-surface-card` (`#1e1f20`) | Evaluate per-context. Keep solid by default; restore translucency only where floating over complex media. | Context-aware, not global. | **P2** |

---

## 4. Implementation Slices & Verification Plan

Execution proceeds strictly in sequential, independent slices:

### **Slice 1: Prompt Bar & Settings Popover (P0)**
- Files:
  - `my-app/src/features/prompt-bar/model/core/promptBarLayout.js`
  - `my-app/src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx`
  - `my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx`
  - `my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx`
- Verification:
  - `cd my-app && npm run ui:check` (0 new violations, Rule U7 = 0)
  - `cd my-app && npx vitest run src/features/prompt-bar/` (all 347 tests pass)

### **Slice 2: Dialog Overlay & Glass Variant (P0)**
- Files:
  - `my-app/src/shared/ui/dialog.jsx`
- Verification:
  - `cd my-app && npm run ui:check`
  - `cd my-app && npx vitest run src/shared/ui/__tests__/dialog.test.jsx` (all tests pass)

### **Slice 3: Button Primitive Rigidity (P0)**
- Files:
  - `my-app/src/shared/ui/button.jsx`
  - `my-app/src/shared/ui/__tests__/button.test.jsx`
- Scope:
  - Strictly preserve the 6 core Runway semantic variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`).
  - Keep `primary` as high-contrast white (`bg-white text-black`).
  - Unauthorized `variant="neon"` removed completely.
- Verification:
  - `cd my-app && npm run ui:check`
  - `cd my-app && npx vitest run src/shared/ui/__tests__/button.test.jsx` (all 14 tests pass)

### **Slice 4: Floating Media Action Overlays (P1)**
- Files:
  - `my-app/src/features/assets/ui/LibraryMediaGridItem.jsx`
  - `my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx`
- Verification:
  - `cd my-app && npm run ui:check`
  - `cd my-app && npx vitest run src/widgets/StudioLayout/` and `src/components/cinema-studio/`

### **Slice 5: Dropdown Menus Evaluation (P2)**
- Targeted inspection of actual dropdown usage contexts.

---

## 5. Visual Capture Strategy (Isolated Authenticated Testing)

To avoid unauthenticated redirects (`AuthGuard` redirecting headless requests from protected paths to `/login`), visual verification of studio components will be performed against isolated development harnesses or authenticated mock contexts, **without modifying production `AuthGuard` rules**.

---

## 6. Stop Condition

- Complete approved restoration Slices 1–4.
- Verify each slice with tests, UI ratchet (`npm run ui:check`), and Turbopack build (`npm run build`).
- Do NOT start Ticket 09.
- Do NOT start Ticket 10.
- Do NOT modify backend or business logic.
- Stop and deliver the comprehensive implementation report.
