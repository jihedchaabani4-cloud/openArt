# Design System Audit — Critical Findings Validation & Refinement

> **Document Type:** Evidence-Based Validation & Corrected Implementation Plan  
> **Target Application:** `my-app` (Frontend)  
> **Source of Truth:** [`c:\Users\jihad\Desktop\open art\design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md) & [`my-app/docs/ui-system/design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md)  
> **Audit Date:** 2026-11-05  
> **Mode:** Read-Only Validation (Zero Code Changes)

---

## 1. Objectives & Executive Validation Summary

This document performs an exhaustive, evidence-based revalidation of the findings presented in the initial Design System Audit. It separates confirmed architectural facts from premature assumptions, identifies actively used compatibility styles that must NOT be removed prematurely, categorizes all dead radius occurrences individually, and establishes an implementation plan that respects context over blanket automation.

### Summary of Revalidated Insights
1. **Source of Truth Parity (Confirmed):**
   Both [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md) (repo root) and [`my-app/docs/ui-system/design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md) are **100% byte-for-byte identical** (SHA256: `40798B74CC6A94D22673094ED6FD61FA80FD8EAC1F5B2D413DF88AC91D9E0A36`).
2. **Dead Radius Classes (Revalidated with Nuance):**
   The claim that `rounded-button`, `rounded-card`, `rounded-dialog`, and `rounded-badge` produce 0px border radius in Tailwind v4 is **confirmed**. However, **blanket find-and-replace is strictly rejected**. Out of 156 production occurrences:
   * 4 occurrences must become **`rounded-full`** (User Avatars in [`UserDropdown.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97) and Action Trigger in [`ActionBtn.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10)). A blanket replace to `rounded-sm` would break these circular controls!
   * 1 occurrence in [`PromptBarControlsRow.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50) must be **removed entirely**, allowing the `<Button />` primitive's internal styles to govern.
   * 3 panel occurrences in [`UserDropdown.jsx:109`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L109) require **`rounded-2xl`**, not card `rounded-lg`.
3. **Legacy CSS Caution (Correction of Previous Claim):**
   The previous report loosely claimed that "307 lines of legacy Material 3 CSS are unused". **This was incorrect and dangerous.** Four critical classes (`.mat-mdc-menu-panel`, `.mat-mdc-menu-item`, `.mat-mdc-menu-item-text`, `.mat-icon`) and four Flow classes (`.flow-menu-panel`, `.flow-internal-menu-item`, `.delete-button`, `.chip-container`) are **STILL ACTIVELY USED** by [`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L77-L98) and [`ReferenceButton.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L151). Deleting them would collapse the in-app Studio item menu.
4. **Arbitrary Shadows Nuance (Correction of Previous Claim):**
   Of the 18 production arbitrary shadow occurrences, **two instances in [`CoreMediaItemView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) are text legibility drop-shadows on arbitrary media overlays**, NOT UI elevation. Stripping them blindly would make text unreadable on white videos/images.
5. **Runtime Typography Confirmed:**
   The codebase bundles and loads **Google Sans Variable Font** locally in [`src/app/layout.js:15`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/layout.js#L15). `abcNormal` is not installed. Transitioning fonts requires explicit user sign-off.
6. **Slider Primitive Feasibility:**
   `radix-ui@^1.4.3` already exports `Slider`. Introducing `@/shared/ui/slider.jsx` requires **zero new dependencies**, but affects only 2 production files.

---

## 2. Incorrect or Insufficiently Supported Findings from Previous Report

| Previous Claim | Reality Discovered | Correction |
|---|---|---|
| *"Apply automated codemod across all 159 dead radius class occurrences"* | A blanket replacement (`rounded-button` $\rightarrow$ `rounded-sm`) would turn circular avatars in [`UserDropdown.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97) and action pills in [`ActionBtn.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10) into 4px rounded rectangles! | **Context-aware replacement only**: Avatars and action triggers must be mapped to `rounded-full`. |
| *"307 lines of Google Material / Flow CSS are obsolete and can be deprecated"* | [`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L77-L98) explicitly relies on `.flow-menu-panel`, `.flow-internal-menu-item`, `.mat-mdc-menu-panel`, and `.mat-mdc-menu-item` for sizing, layout, and delete button styling. | **Classify as Still-Active Compatibility Layer**: Retain these styles until `StudioItemMenu.jsx` is refactored to standard Radix UI primitives. |
| *"All 17 arbitrary shadow bracket classes violate the Zero Box-Shadow Law and should be stripped"* | Lines 302 & 314 in [`CoreMediaItemView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) use `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` on text and icons positioned over dynamic video thumbnails. | **Preserve legibility filters**: These are contrast aids over photography, not container elevation shadows. |
| *"159 occurrences in production code"* | 3 of the 159 occurrences are inside unit test files ([`StudioNavbar.test.jsx:173`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/__tests__/StudioNavbar.test.jsx#L173)). | Production occurrences count is **156 across 57 files**. |

---

## 3. Detailed Inventory of the 156 Production Dead-Radius Occurrences

The 156 occurrences are categorized by element role and intended geometry:

### Category A: Interactive Buttons & Action Targets (55 Occurrences)
* **Intended Geometry:** 4px Sharp (`rounded-sm`).
* **Representative Files:**
  * [`src/components/cinema-studio/elements/CreateElementModal.jsx:48, 149`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L48)
  * [`src/widgets/NewElementDialog/NewElementDialog.jsx:367, 406`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L367)
  * [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:634, 1142`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L634)
  * [`src/widgets/StudioLayout/LeftNavigationRail.jsx:95`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/LeftNavigationRail.jsx#L95)
  * [`src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx:66`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx#L66)
  * [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:45, 151`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L45)
* **Action:** Replace `rounded-button` $\rightarrow$ **`rounded-sm`**.

### Category B: Avatars & Circular Icon Targets (4 Occurrences)
* **Intended Geometry:** Capsule Pill / Circle (`rounded-full`).
* **Exact Occurrences:**
  * [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10) (`ActionBtn` for Favorite & More)
  * [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:62`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L62) (Avatar skeleton)
  * [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:97`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97) (`<Avatar className="... rounded-button">`)
  * [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:99`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L99) (`<AvatarFallback className="... rounded-button">`)
* **Action:** Replace `rounded-button` $\rightarrow$ **`rounded-full`** (NOT `rounded-sm`!).

### Category C: Redundant Primitive Call-Site Override (1 Occurrence)
* **Intended Geometry:** Governed internally by primitive.
* **Exact Occurrence:**
  * [`src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50): `<Button variant="blur" className="settings-trigger-button h-8 px-2.5 rounded-button ...">`
* **Action:** **Delete `rounded-button`**. `<Button />` already applies `rounded-sm` internally.

### Category D: Grid Cards & Media Thumbnail Containers (71 Occurrences)
* **Intended Geometry:** Comfortable Card 8px (`rounded-lg`).
* **Representative Files:**
  * [`src/components/cinema-studio/characters/CharacterCardKrea.jsx:77, 82`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L77)
  * [`src/components/cinema-studio/elements/ElementCardKrea.jsx:158, 163, 204`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L158)
  * [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:216, 220, 230`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L216)
  * [`src/widgets/NewElementDialog/NewElementDialog.jsx:297, 306, 311, 327`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L297)
  * [`src/widgets/PromoSlider.jsx:136`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/PromoSlider.jsx#L136)
  * [`src/widgets/projects/ui/ProjectsGrid.jsx:16`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/projects/ui/ProjectsGrid.jsx#L16)
* **Action:** Replace `rounded-card` $\rightarrow$ **`rounded-lg`**.

### Category E: Floating Panels & Popovers (3 Occurrences)
* **Intended Geometry:** Floating Panel (16px or 8px).
* **Exact Occurrences:**
  * [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:109`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L109) (`user-dropdown-panel w-[360px] rounded-card`)
  * [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:1124`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L1124) (Drag ghost card)
* **Action:** Map User Dropdown to **`rounded-2xl`** (16px Runway panel scale) or **`rounded-lg`** (8px card scale).

### Category F: Modals & Dialog Containers (13 Occurrences)
* **Intended Geometry:** Generous Dialog 16px (`rounded-2xl`).
* **Representative Files:**
  * [`src/components/cinema-studio/elements/CreateElementModal.jsx:40`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L40)
  * [`src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx:29`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx#L29)
  * [`src/components/LoginDialog.jsx:156`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/LoginDialog.jsx#L156)
  * [`src/views/AssetDetailPage.jsx:113`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/AssetDetailPage.jsx#L113)
  * [`src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx:36`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx#L36)
  * [`src/widgets/projects/ui/ProjectsFloatingAction.jsx:14`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/projects/ui/ProjectsFloatingAction.jsx#L14)
* **Action:** Replace `rounded-dialog` $\rightarrow$ **`rounded-2xl`**.

### Category G: Badges & Indicators (9 Occurrences)
* **Intended Geometry:** 8 Sharp (4px) + 1 Circular (9999px).
* **Occurrences:**
  * [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:517`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L517): `w-7 h-7 rounded-badge bg-white` $\rightarrow$ **`rounded-full`** (circular icon indicator).
  * 8 other occurrences (e.g. [`MediaGridItem.jsx:660`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L660)): Text chips $\rightarrow$ **`rounded-sm`** (4px).

---

## 4. Verification of the 18 Arbitrary Shadow Occurrences

| # | File & Line | Applied Class | Actual Visual Role | Violates `design.md`? | Justified Action |
|---|---|---|---|---|---|
| 1 | `[collectionId]/page.js:338` | `shadow-[0_0_30px_rgba(255,255,255,0.4)]` | Dragover active glow indicator | Borderline (interactive glow) | Replace with `ring-2 ring-white ring-offset-2 ring-offset-black` |
| 2 | `test-mention/page.jsx:463` | `shadow-[0_16px_50px_rgba(0,0,0,0.5)]` | Test playground prompt bar container | **Yes** | Test route; replace with `shadow-none border border-white/10` |
| 3 | `CharacterCardKrea.jsx:142` | `shadow-[0_20px_25px_-5px_...,0_8px_10px_...]` | Thumbnail overlay depth inside card | **Yes** | Replace with `shadow-none border border-white/15 bg-black/60` |
| 4-6| `ElementsEmptyState.jsx:91, 122, 153` | `drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]` | 3D SVG illustrated sticker depth | **No** (Graphic asset filter, not UI container) | **Retain** as illustration artwork styling |
| 7 | `DropdownEngine.jsx:148` | `shadow-[0px_4px_4px_...,0px_20px_25px_...]` | Popover menu elevation | **Yes** | Replace with `shadow-none border border-white/10` |
| 8 | `FlowPromptBoxSettings.jsx:309` | `shadow-[var(--mat-menu-container-elevation-shadow)]` | Drawer elevation | Resolves to `none` at runtime | Clean syntax to explicit `shadow-none` |
| 9-11| `dialog.jsx:88, 106, 117` | `shadow-[var(--mat-dialog-container-elevation-shadow)]`| Dialog elevation in primitive variants | Resolves to `none` at runtime | Clean syntax to explicit `shadow-none` |
| 12| `DropdownShell.jsx:71` | `shadow-[var(--mat-menu-container-elevation-shadow)]` | Shell elevation | Resolves to `none` at runtime | Clean syntax to explicit `shadow-none` |
| 13| `hover-card.jsx:19` | `shadow-[var(--mat-menu-container-elevation-shadow)]` | Hover card elevation | Resolves to `none` at runtime | Clean syntax to explicit `shadow-none` |
| 14| `LoadingScreen.jsx:37` | `shadow-[0_0_10px_rgba(59,130,246,0.5)]` | Blue glow on loading progress bar | Borderline (glow indicator) | Replace with electric neon `#EFFE17` without shadow |
| 15| `AssetDetailPage.jsx:113` | `shadow-[0_24px_90px_rgba(0,0,0,0.45)]` | Lightbox modal container elevation | **Yes** | Replace with `shadow-none border border-white/10` |
| 16| `CoreMediaItemView.jsx:302` | `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` | White text legibility on user media | **No (Essential contrast protection)** | **PRESERVE** (prevent white text vanishing on white media) |
| 17| `CoreMediaItemView.jsx:314` | `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` | White icon legibility on user media | **No (Essential contrast protection)** | **PRESERVE** (prevent white icon vanishing on white media) |
| 18| `EditMediaView.jsx:92` | `shadow-[0_0_8px_rgba(255,255,255,0.6)]` | Video playhead trimmer handle glow | Borderline (playhead cursor) | Replace with solid white handle with 1px black outline |

---

## 5. Legacy Material & Google Flow CSS Classification

The 307 lines containing `.mat-` and `.flow-` in [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css) are partitioned into two categories:

### Active Compatibility Layer (MUST NOT BE DELETED YET)
* **Selectors:**
  * `.mat-mdc-menu-panel` & `.flow-menu-panel` (lines 974, 1358): Defines width, z-index, and backdrop blur for studio menus.
  * `.mat-mdc-menu-item`, `.flow-internal-menu-item`, `.mat-mdc-menu-item-text` (lines 1008, 1392): Defines item flexbox alignment, padding, and hover transitions.
  * `.delete-button` (lines 1445–1459): Configures destructive danger hover and red icons.
  * `flow-ingredient-chip`, `.chip-container` (lines 1702–1730): Renders character and element chip pills in [`ReferenceButton.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L151).
  * `flow-error-tile` (lines 1886–2026): Renders error fallback cards in [`FlowErrorTile.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/FlowErrorTile.jsx).
* **Required Action:** Only edit `--mat-menu-container-shape` to 16px. Do NOT strip the selector blocks until [`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx) is migrated to standard Radix UI primitives.

### Truly Dead Angular Material Markup (Safe for Future Pruning)
* **Selectors:**
  * `mat-divider`, `mat-mdc-list-item`, `mat-list-item`, `mat-mdc-menu-content`, `mat-mdc-menu-submenu-icon`.
  * `flow-toggles`, `flow-credit-cost-label`, `flow-video-tile`.
* **Reason:** These are Angular custom elements with zero references in Next.js JSX files.

---

## 6. Typography & Runtime Font Analysis

* **`design.md` Spec:**
  * Primary: **`abcNormal`** (with `abcNormal Fallback`, Inter, or DM Sans).
  * Display weights: 400. Micro-tag weight: 450.
* **Codebase Reality ([`src/app/layout.js:15-30`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/layout.js#L15-L30)):**
  * Loads **Google Sans Variable Font** (`GoogleSans-VariableFont_GRAD,opsz,wght.ttf`) via `next/font/local`.
  * Variable: `--font-google-sans`.
  * Default sans font in `globals.css`: `'Google Sans Text', 'Google Sans', var(--font-google-sans)`.
* **Finding:**
  The project has never bundled `abcNormal`. Switching font families would significantly change text metrics across the whole application.
* **Recommendation:**
  Retain **Google Sans Variable Font** as the active runtime font. Do not change font loading without explicit human instruction.

---

## 7. Reassessing Dropdown & Context Menu Radius (8px vs 16px)

### Evidence Comparison
1. **`runwayml.design (1).md` Text:**
   * Line 145: `comfortable: 8px` (cards, menus).
   * Line 146: `generous: 16px` (alert containers, floating dialogs).
   * Note at Line 431: *"In-app Runway Studio (timeline, generation controls, asset library) lives behind authentication and isn't represented here."*
2. **User Reference Screenshot (Live Runway Studio):**
   * The context menu opened from the media card clearly displays generous, smooth **16px rounded corners** (`rounded-2xl`).
   * The trigger button group on the media card is a **`rounded-full` capsule pill** in white.

### Architectural Decision
* Setting the menu container to **`rounded-2xl` (`16px`)** faithfully reproduces the live Studio user experience.
* The menu items inside remain **`rounded-sm` (`4px`)** on hover, creating comfortable geometric hierarchy (16px outer container, 4px inner items).

---

## 8. Reassessing the Shared `<Slider />` Primitive

* **Actual Usage:**
  * Only 2 production files use `<input type="range">`:
    1. [`DurationSelector.jsx:89`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx#L89) (Video duration 5s / 10s slider).
    2. [`FlowPromptBoxSettings.jsx:626`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L626) (Motion intensity slider).
* **Package Status:**
  * `radix-ui@^1.4.3` is already installed and exports `Slider` out of the box. Zero new npm dependencies are required.
* **Assessment:**
  * Creating `@/shared/ui/slider.jsx` is beneficial for eliminating ~50 lines of duplicate webkit-thumb CSS hacks, but it is not a P0 blocker.
  * It should be placed in **Phase P1 (Component Consistency)**.

---

## 9. Review of Proposed Rule U6 for Ratchet (`ui:check`)

* **Proposed Rule:**
  ```javascript
  {
    id: 'U6',
    desc: 'dead compound radius class (rounded-button/card/dialog/badge/input) - use canonical rounded-sm/lg/2xl/full',
    ext: /\.(jsx?|tsx?)$/,
    re: /\brounded-(button|card|dialog|badge|input)\b/g
  }
  ```
* **False Positive Risk:** **0%**.
  * There is no valid use case for these classes anywhere in the codebase.
  * Tailwind v4 does not recognize them.
  * [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md#L148) explicitly forbids them under the *Single Token Class Law*.
* **Validation:** Adding Rule U6 after migrating the 156 occurrences will permanently guarantee that no developer or AI agent can re-introduce dead radius classes.

---

## 10. Corrected Design-to-Code Comparison Matrix

| Category | `design.md` Spec | Current Code Reality | Validated Status | Context-Aware Action |
|---|---|---|---|---|
| **Buttons** | 4px (`rounded-sm`) | `rounded-sm` inside primitive; 55 call sites pass `rounded-button`; 1 call site passes redundant `rounded-button` on `<Button>` | **MISMATCH at call sites** | Migrate 55 call sites to `rounded-sm`; remove `rounded-button` from [`PromptBarControlsRow.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50) |
| **Avatars & Action Pills** | Pill / Circle (`rounded-full`) | [`ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10) and [`UserDropdown.jsx:97`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97) use `rounded-button` | **MISMATCH (Needs rounded-full)** | Update `ActionBtn` and `UserDropdown` avatars to **`rounded-full`** |
| **Media Item Pill Group** | Capsule pill (`rounded-full`) | [`MediaGridItem.jsx:472`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472) uses `rounded-lg` | **MISMATCH** | Update `ButtonGroup` to **`rounded-full`** |
| **Cards** | 8px (`rounded-lg`) | 71 feature call sites pass `rounded-card` | **MISMATCH at call sites** | Migrate 71 call sites to **`rounded-lg`** |
| **Dropdown Menus** | 16px (`rounded-2xl`, Studio Reference) | Locked to 8px by `--mat-menu-container-shape: 8px !important;` | **MISMATCH with Studio Reference** | Set `--mat-menu-container-shape: var(--radius-2xl, 16px);` and use `rounded-2xl` on menus |
| **Dialogs & Modals** | 16px (`rounded-2xl`) | 13 feature call sites pass `rounded-dialog` | **MISMATCH at call sites** | Migrate 13 call sites to **`rounded-2xl`** |
| **Media Text Legibility Shadows**| Legibility protection over user video | `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` on white text/icons | **JUSTIFIED (Not a violation)** | **PRESERVE** in [`CoreMediaItemView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) |
| **Container Elevation Shadows** | Zero box shadows (`shadow-none`) | 16 feature locations use arbitrary shadow brackets | **MISMATCH** | Strip elevation shadows; replace with `shadow-none border border-white/10` |
| **Typography Family** | `abcNormal` documented | `Google Sans Variable` loaded locally via `layout.js` | **INTENTIONAL DIVERGENCE** | Retain Google Sans; do not change without user approval |
| **Slider Primitive** | Encapsulated primitive | Raw `<input type="range">` in 2 files | **MISSING (Low urgency)** | Add `@/shared/ui/slider.jsx` using `radix-ui` in Phase P1 |

---

## 11. Corrected and Prioritized Implementation Roadmap

*(Read-Only: Awaiting user approval before applying any changes)*

### Phase P0: High-Impact Visual Correctness (Immediate)
1. **Task P0.1 — Media Item Action Pill Alignment:**
   * Files: [`MediaGridItem.jsx:458, 472`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472), [`ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10).
   * Changes: Change `ButtonGroup` to `rounded-full bg-white/80 backdrop-blur-md`; change `ActionBtn` to `rounded-full`.
2. **Task P0.2 — Dropdown & Context Menu Radius (16px):**
   * Files: [`globals.css:346`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L346), [`dropdown-menu.jsx:43-49`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dropdown-menu.jsx#L43-L49), [`context-menu.jsx:83`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/context-menu.jsx#L83).
   * Changes: Set `--mat-menu-container-shape: var(--radius-2xl, 16px);`; set menu content panel to `rounded-2xl`.
3. **Task P0.3 — Context-Aware Migration of 156 Dead Radius Classes:**
   * Category A (55 buttons/toggles): $\rightarrow$ `rounded-sm`.
   * Category B (4 avatars/action pills): $\rightarrow$ `rounded-full`.
   * Category C (1 call site override in `PromptBarControlsRow.jsx:50`): $\rightarrow$ delete `rounded-button`.
   * Category D (71 cards): $\rightarrow$ `rounded-lg`.
   * Category E (3 panels): $\rightarrow$ `rounded-2xl` or `rounded-lg`.
   * Category F (13 dialogs): $\rightarrow$ `rounded-2xl`.
   * Category G (9 badges): 1 circular $\rightarrow$ `rounded-full`, 8 text $\rightarrow$ `rounded-sm`.

### Phase P1: Consistency & Architecture Refinement
1. **Task P1.1 — Create Shared `<Slider />` Primitive:**
   * File: Create `src/shared/ui/slider.jsx` using `radix-ui`.
   * Adopt in [`DurationSelector.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx) and [`FlowPromptBoxSettings.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx) to eliminate raw `<input type="range">`.
2. **Task P1.2 — Add Rule U6 to `ui:check`:**
   * File: [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs).
   * Automatically block any new instances of dead compound radius classes.
3. **Task P1.3 — Consolidate CSS `:root` Blocks:**
   * File: [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css).
   * Merge lines 283, 1695, and 1826 into one coherent `:root` declaration.

### Phase P2: Cleanup & Maintenance
1. **Task P2.1 — Eliminate 16 Container Elevation Shadows:**
   * Replace container box-shadows with `shadow-none border border-white/10`. Keep the 2 media text drop-shadows in `CoreMediaItemView.jsx`.
2. **Task P2.2 — Deprecate Unused Angular Material Markup in `globals.css`:**
   * Safely prune dead Angular classes (`mat-divider`, `mat-list-item`, `flow-video-tile`) while preserving the active menu classes.

---

## 12. Decisions Requiring Human Approval

1. **Approval to execute Phase P0:**
   * Update the Action Pill to `rounded-full`.
   * Update Dropdown & Context Menu container radius to 16px (`rounded-2xl`).
   * Perform context-aware replacement of the 156 dead radius occurrences.
2. **Font Family Direction:**
   * Confirm retention of **Google Sans Variable Font** (recommended) or request evaluation of an `Inter` / `abcNormal` migration.
3. **Radix `<Slider />` Primitive Scope:**
   * Confirm implementing `@/shared/ui/slider.jsx` in Phase P1.
