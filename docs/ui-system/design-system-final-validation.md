# Design System Audit — Final Validation & Implementation Readiness

> **Document Type:** Final Authoritative Implementation-Ready Specification  
> **Target Application:** `my-app` (Frontend)  
> **Source of Truth:** [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md) & [`my-app/docs/ui-system/design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md)  
> **Audit Status:** Complete & Fully Validated (Read-Only)  
> **Date:** 2026-11-05

---

## 1. Executive Summary

This final validation report establishes an implementation-ready baseline for aligning `my-app` with the canonical Runway design specification in [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md). Every finding from the previous audits has been re-examined against the live codebase:

1. **Source of Truth Parity (100% Confirmed):**
   Root [`design.md`](file:///c:/Users/jihad/Desktop/open%20art/design.md) and [`my-app/docs/ui-system/design.md`](file:///c:/Users/jihad/Desktop/open%20art/my-app/docs/ui-system/design.md) are identical (SHA-256: `40798B74CC6A94D22673094ED6FD61FA80FD8EAC1F5B2D413DF88AC91D9E0A36`).
2. **Exact Dead-Radius Count Verified (156 Production Occurrences):**
   Excluding test files, exactly **156 occurrences** across **57 files** currently write dead compound classes (`rounded-button`, `rounded-card`, `rounded-dialog`, `rounded-badge`). All 156 have been individually inspected and mapped.
3. **Category E Discrepancy Resolved:**
   Category E contains exactly **3 floating panels/popovers**:
   * [`UserDropdown.jsx:109`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L109) (User account/credit panel)
   * [`ElementInfoSidebar.jsx:57`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementInfoSidebar.jsx#L57) (Floating element info popover)
   * [`KeyboardShortcutsHelp.jsx:65`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx#L65) (Floating keyboard shortcuts popover)
   The drag ghost overlay in [`MediaGridItem.jsx:1124`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L1124) is properly classified as a media thumbnail (Category D).
4. **Context Menu vs Dropdown Menu Radius Boundary Established:**
   Setting the shared `DropdownMenuContent` primitive to 16px indiscriminately would unintentionally bloat compact toolbars and select dropdowns. Instead, standard dropdowns, select menus, and popovers remain **8px (`rounded-lg`)**, while the large floating media item menu in Runway Studio ([`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx)) receives **16px (`rounded-2xl`)**.
5. **Preservation of Legibility Shadows:**
   The 18 arbitrary shadow occurrences have been classified into 5 functional categories. Two drop-shadows in [`CoreMediaItemView.jsx:302-314`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) are essential legibility contrast layers over arbitrary user video thumbnails and **must be preserved**.
6. **Active Compatibility CSS Safeguarded:**
   Out of 90 selector blocks containing `.mat-*` and `.flow-*` in [`globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css), **12 selectors are actively used** by React components. They must remain intact until component refactoring takes place.

---

## 2. Verified Occurrence Counts

Full verification across `my-app/src` confirms:

* **Total Occurrences in Entire Workspace:** 159
* **Occurrences in Unit Test Files:** 3 (e.g. [`StudioNavbar.test.jsx:173`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/__tests__/StudioNavbar.test.jsx#L173))
* **Occurrences in Production Source Code:** **156** (across 57 files)

### Breakdown by Category and Target Geometry

| Category | Description | Count | Target Canonical Class |
|---|---|---|---|
| **Category A** | Interactive Buttons, Nav Links, Option Toggles | 55 | `rounded-sm` (4px Sharp) |
| **Category B** | User Avatars & Media Action Pills | 5 | `rounded-full` (9999px Pill / Circle) |
| **Category C** | Redundant Call-Site Override on `<Button />` | 1 | **REMOVE** (Inherits `rounded-sm` internally) |
| **Category D** | Media Tiles, Feature Cards, Dropzones, Skeletons | 71 | `rounded-lg` (8px Comfortable) |
| **Category E** | Large Floating Panels & Popovers | 3 | `rounded-2xl` (16px Generous Panel) |
| **Category F** | Modal Dialogs, Creation Sheets, Lightboxes | 13 | `rounded-2xl` (16px Generous Dialog) |
| **Category G** | Metadata Chips & Status Badges | 8 | `rounded-sm` (4px Sharp) |
| **Total** | **All Production Occurrences** | **156** | **Exact 100% Match** |

---

## 3. Complete 156-Occurrence Inventory Table

Every single occurrence is cataloged with its exact file path, line number, current class, inspected UI element, intended geometry, and context-specific replacement:

| # | File & Line | Current Class | Element / Component | Intended Geometry | Proposed Replacement | Reason |
|---|---|---|---|---|---|---|
| 1 | [`src/app/cinema-studio/[projectId]/characters/page.js:177`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/cinema-studio/[projectId]/characters/page.js#L177) | `rounded-dialog` | Characters page creation button container | Generous Dialog (16px) | `rounded-2xl` | Hero floating action button wrapper |
| 2 | [`src/app/dev/ui/page.jsx:48`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L48) | `rounded-badge` | UI showcase badge container | Sharp Micro Tag (4px) | `rounded-sm` | Showcase demonstration token |
| 3 | [`src/app/dev/ui/page.jsx:154`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L154) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 4 | [`src/app/dev/ui/page.jsx:158`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L158) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 5 | [`src/app/dev/ui/page.jsx:162`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L162) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 6 | [`src/app/dev/ui/page.jsx:166`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L166) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 7 | [`src/app/dev/ui/page.jsx:170`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L170) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 8 | [`src/app/dev/ui/page.jsx:181`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L181) | `rounded-badge` | UI showcase badge container | Sharp Micro Tag (4px) | `rounded-sm` | Showcase demonstration token |
| 9 | [`src/app/dev/ui/page.jsx:183`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L183) | `rounded-badge` | UI showcase badge container | Sharp Micro Tag (4px) | `rounded-sm` | Showcase demonstration token |
| 10 | [`src/app/dev/ui/page.jsx:185`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L185) | `rounded-button` | UI showcase button container | Sharp Action Target (4px) | `rounded-sm` | Design system showcase display container |
| 11 | [`src/app/dev/ui/page.jsx:187`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L187) | `rounded-button` | UI showcase button container | Sharp Action Target (4px) | `rounded-sm` | Design system showcase display container |
| 12 | [`src/app/dev/ui/page.jsx:189`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L189) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 13 | [`src/app/dev/ui/page.jsx:191`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L191) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 14 | [`src/app/dev/ui/page.jsx:193`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L193) | `rounded-dialog` | UI showcase documentation box | Generous Dialog (16px) | `rounded-2xl` | Design system showcase display container |
| 15 | [`src/app/dev/ui/page.jsx:195`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L195) | `rounded-dialog` | UI showcase documentation box | Generous Dialog (16px) | `rounded-2xl` | Design system showcase display container |
| 16 | [`src/app/dev/ui/page.jsx:318`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/dev/ui/page.jsx#L318) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 17 | [`src/components/cinema-studio/characters/CharacterCardKrea.jsx:77`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L77) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 18 | [`src/components/cinema-studio/characters/CharacterCardKrea.jsx:82`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L82) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 19 | [`src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx:12`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx#L12) | `rounded-dialog` | Character image preview modal container | Generous Dialog (16px) | `rounded-2xl` | Lightbox preview modal adhering to Runway 16px dialog spec |
| 20 | [`src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx:29`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/FlowCharacterImagePreview.jsx#L29) | `rounded-dialog` | Character image preview modal container | Generous Dialog (16px) | `rounded-2xl` | Lightbox preview modal adhering to Runway 16px dialog spec |
| 21 | [`src/components/cinema-studio/elements/CreateElementModal.jsx:40`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L40) | `rounded-dialog` | CreateElementModal dialog container | Generous Dialog (16px) | `rounded-2xl` | Modal surface container adhering to Runway 16px dialog spec |
| 22 | [`src/components/cinema-studio/elements/CreateElementModal.jsx:48`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L48) | `rounded-button` | Modal close button | Sharp Action Target (4px) | `rounded-sm` | Interactive icon button; 4px sharp standard |
| 23 | [`src/components/cinema-studio/elements/CreateElementModal.jsx:149`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/CreateElementModal.jsx#L149) | `rounded-button` | Element image remove button | Sharp Action Target (4px) | `rounded-sm` | Interactive icon button; 4px sharp standard |
| 24 | [`src/components/cinema-studio/elements/ElementCardKrea.jsx:158`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L158) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 25 | [`src/components/cinema-studio/elements/ElementCardKrea.jsx:163`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L163) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 26 | [`src/components/cinema-studio/elements/ElementCardKrea.jsx:204`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L204) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 27 | [`src/components/cinema-studio/elements/ElementCardKrea.jsx:226`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementCardKrea.jsx#L226) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 28 | [`src/components/cinema-studio/elements/ElementInfoSidebar.jsx:57`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementInfoSidebar.jsx#L57) | `rounded-card` | Element info floating popover | Floating Overlay Panel (16px) | `rounded-2xl` | Floating metadata popover over canvas; 16px generous panel tier |
| 29 | [`src/components/cinema-studio/elements/ElementInfoSidebar.jsx:140`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementInfoSidebar.jsx#L140) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 30 | [`src/components/cinema-studio/elements/ElementInfoSidebar.jsx:172`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementInfoSidebar.jsx#L172) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 31 | [`src/components/cinema-studio/elements/NewElementCardKrea.jsx:11`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/NewElementCardKrea.jsx#L11) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 32 | [`src/components/cinema-studio/elements/NewElementCardKrea.jsx:14`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/NewElementCardKrea.jsx#L14) | `rounded-card` | Studio Character/Element card container or media frame | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 33 | [`src/components/LoginDialog.jsx:156`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/LoginDialog.jsx#L156) | `rounded-dialog` | LoginDialog visual side container | Generous Dialog (16px) | `rounded-2xl` | Modal visual backdrop container inside 16px dialog |
| 34 | [`src/features/assets/ui/AssetsSidebar.jsx:30`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/assets/ui/AssetsSidebar.jsx#L30) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 35 | [`src/features/assets/ui/LibraryMediaGridItem.jsx:71`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/assets/ui/LibraryMediaGridItem.jsx#L71) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 36 | [`src/features/assets/ui/MediaInfoStrip.jsx:41`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/assets/ui/MediaInfoStrip.jsx#L41) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 37 | [`src/features/media/ui/AssetListItem.jsx:40`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/AssetListItem.jsx#L40) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 38 | [`src/features/media/ui/AssetListItem.jsx:49`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/AssetListItem.jsx#L49) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 39 | [`src/features/media/ui/MediaCard.jsx:35`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaCard.jsx#L35) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 40 | [`src/features/media/ui/MediaHero.jsx:36`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaHero.jsx#L36) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 41 | [`src/features/media/ui/MediaTile.jsx:48`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaTile.jsx#L48) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 42 | [`src/features/media/ui/MediaViewCard.jsx:145`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaViewCard.jsx#L145) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 43 | [`src/features/media/ui/SharedGalleryGrid.jsx:147`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/SharedGalleryGrid.jsx#L147) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 44 | [`src/features/payments/ui/PackageSelectionDialog.jsx:163`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L163) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 45 | [`src/features/payments/ui/PackageSelectionDialog.jsx:255`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L255) | `rounded-dialog` | Modal / Dialog container | Generous Dialog (16px) | `rounded-2xl` | Adheres to Runway 16px generous dialog specification |
| 46 | [`src/features/payments/ui/PackageSelectionDialog.jsx:268`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L268) | `rounded-dialog` | Modal / Dialog container | Generous Dialog (16px) | `rounded-2xl` | Adheres to Runway 16px generous dialog specification |
| 47 | [`src/features/payments/ui/PackageSelectionDialog.jsx:301`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L301) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 48 | [`src/features/payments/ui/PackageSelectionDialog.jsx:401`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L401) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 49 | [`src/features/payments/ui/PackageSelectionDialog.jsx:447`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L447) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 50 | [`src/features/payments/ui/PricingSection.jsx:229`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PricingSection.jsx#L229) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 51 | [`src/features/payments/ui/PricingSection.jsx:233`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PricingSection.jsx#L233) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 52 | [`src/features/payments/ui/PricingSection.jsx:610`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PricingSection.jsx#L610) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 53 | [`src/features/projects/ui/ProjectCard.jsx:35`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/ui/ProjectCard.jsx#L35) | `rounded-card` | Project card container or skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 54 | [`src/features/projects/ui/ProjectCard.jsx:39`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/ui/ProjectCard.jsx#L39) | `rounded-card` | Project card container or skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 55 | [`src/features/projects/ui/ProjectCard.jsx:82`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/ui/ProjectCard.jsx#L82) | `rounded-card` | Project card container or skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 56 | [`src/features/projects/ui/ProjectError.jsx:57`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/ui/ProjectError.jsx#L57) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 57 | [`src/features/projects/ui/ProjectError.jsx:67`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/ui/ProjectError.jsx#L67) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 58 | [`src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx#L50) | `rounded-button` | PromptBar settings trigger button | Governed internally by <Button /> primitive | `REMOVE` | <Button /> already applies rounded-sm internally; call-site class is redundant |
| 59 | [`src/features/prompt-bar/platform/parts/PromptBarSlotsRow.jsx:105`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarSlotsRow.jsx#L105) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 60 | [`src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx:56`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx#L56) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 61 | [`src/features/prompt-bar/templates/CharacterPromptBar.jsx:61`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/templates/CharacterPromptBar.jsx#L61) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 62 | [`src/features/prompt-bar/ui/character/CharacterFeatureEditor.jsx:68`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/character/CharacterFeatureEditor.jsx#L68) | `rounded-dialog` | Modal / Dialog container | Generous Dialog (16px) | `rounded-2xl` | Adheres to Runway 16px generous dialog specification |
| 63 | [`src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx:277`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx#L277) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 64 | [`src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx:304`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx#L304) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 65 | [`src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx:346`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx#L346) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 66 | [`src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx:352`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx#L352) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 67 | [`src/features/prompt-bar/ui/common/editor/MentionPlugin.jsx:191`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/editor/MentionPlugin.jsx#L191) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 68 | [`src/features/prompt-bar/ui/common/MediaInput.jsx:187`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/MediaInput.jsx#L187) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 69 | [`src/features/prompt-bar/ui/common/MediaInput.jsx:203`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/MediaInput.jsx#L203) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 70 | [`src/features/prompt-bar/ui/common/MediaInput.jsx:212`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/MediaInput.jsx#L212) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 71 | [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:45`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L45) | `rounded-button` | ReferenceButton slot container | Sharp Action Target (4px) | `rounded-sm` | Ingredient chip reference button; 4px sharp standard |
| 72 | [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:151`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L151) | `rounded-button` | Chip container interactive button | Sharp Action Target (4px) | `rounded-sm` | Ingredient chip reference button; 4px sharp standard |
| 73 | [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:216`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L216) | `rounded-card` | Reference thumbnail popup or image plate | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image clipping specification |
| 74 | [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:220`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L220) | `rounded-card` | Reference thumbnail popup or image plate | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image clipping specification |
| 75 | [`src/features/prompt-bar/ui/common/ReferenceButton.jsx:230`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/ReferenceButton.jsx#L230) | `rounded-card` | Reference thumbnail popup or image plate | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image clipping specification |
| 76 | [`src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx:146`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx#L146) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 77 | [`src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx:161`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx#L161) | `rounded-badge` | Badge / Metadata tag | Sharp Micro Tag (4px) | `rounded-sm` | Runway sharp 4px micro tag specification |
| 78 | [`src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx:177`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx#L177) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 79 | [`src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx:77`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx#L77) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 80 | [`src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx:78`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx#L78) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 81 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:100`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L100) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 82 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:306`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L306) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 83 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:337`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L337) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 84 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:347`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L347) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 85 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:386`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L386) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 86 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:396`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L396) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 87 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:435`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L435) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 88 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:447`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L447) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 89 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:520`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L520) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 90 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:543`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L543) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 91 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:590`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L590) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 92 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:620`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L620) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 93 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:673`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L673) | `rounded-badge` | Badge / Metadata tag | Sharp Micro Tag (4px) | `rounded-sm` | Runway sharp 4px micro tag specification |
| 94 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:696`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L696) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 95 | [`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:707`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L707) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 96 | [`src/shared/ui/popover.jsx:7`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/popover.jsx#L7) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 97 | [`src/shared/ui/select.jsx:50`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx#L50) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 98 | [`src/shared/ui/select.jsx:51`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx#L51) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 99 | [`src/shared/ui/select.jsx:199`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx#L199) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 100 | [`src/shared/ui/tooltip.jsx:7`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/tooltip.jsx#L7) | `rounded-badge` | Badge / Metadata tag | Sharp Micro Tag (4px) | `rounded-sm` | Runway sharp 4px micro tag specification |
| 101 | [`src/views/AssetDetailPage.jsx:113`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/AssetDetailPage.jsx#L113) | `rounded-dialog` | AssetDetailPage lightbox wrapper | Generous Dialog (16px) | `rounded-2xl` | Full-viewport media detail modal preview |
| 102 | [`src/views/landing/components/BentoFeatures.jsx:45`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L45) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 103 | [`src/views/landing/components/BentoFeatures.jsx:61`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L61) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 104 | [`src/views/landing/components/BentoFeatures.jsx:74`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L74) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 105 | [`src/views/landing/components/BentoFeatures.jsx:90`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L90) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 106 | [`src/views/landing/components/BentoFeatures.jsx:98`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L98) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 107 | [`src/views/landing/components/BentoFeatures.jsx:126`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L126) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 108 | [`src/views/landing/components/BentoFeatures.jsx:144`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L144) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 109 | [`src/views/landing/components/BentoFeatures.jsx:150`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L150) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 110 | [`src/views/landing/components/BentoFeatures.jsx:163`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L163) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 111 | [`src/views/landing/components/BentoFeatures.jsx:179`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L179) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 112 | [`src/views/landing/components/BentoFeatures.jsx:220`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L220) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 113 | [`src/views/landing/components/BentoFeatures.jsx:236`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L236) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 114 | [`src/views/landing/components/BentoFeatures.jsx:252`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/BentoFeatures.jsx#L252) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 115 | [`src/views/landing/components/HeroSection.jsx:49`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/HeroSection.jsx#L49) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 116 | [`src/views/landing/components/HeroSection.jsx:68`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/HeroSection.jsx#L68) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 117 | [`src/views/landing/components/HeroSection.jsx:108`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/HeroSection.jsx#L108) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 118 | [`src/views/landing/components/ModelSlider.jsx:58`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/landing/components/ModelSlider.jsx#L58) | `rounded-card` | Landing page bento card / feature container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px article/feature card specification |
| 119 | [`src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx:66`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx#L66) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 120 | [`src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx:75`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx#L75) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 121 | [`src/widgets/CoreMediaItemView/CoreMediaItemView.jsx:174`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L174) | `rounded-card` | Core media card container or placeholder skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 122 | [`src/widgets/CoreMediaItemView/CoreMediaItemView.jsx:216`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L216) | `rounded-card` | Core media card container or placeholder skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 123 | [`src/widgets/ElementEditNavbar/ElementEditNavbar.jsx:64`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ElementEditNavbar/ElementEditNavbar.jsx#L64) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 124 | [`src/widgets/ElementEditNavbar/ElementEditNavbar.jsx:73`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ElementEditNavbar/ElementEditNavbar.jsx#L73) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 125 | [`src/widgets/ImportMediaDialog/ImportMediaListView.jsx:137`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaListView.jsx#L137) | `rounded-card` | Import media preview tile or container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 126 | [`src/widgets/ImportMediaDialog/ImportMediaListView.jsx:149`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaListView.jsx#L149) | `rounded-card` | Import media preview tile or container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 127 | [`src/widgets/ImportMediaDialog/ImportMediaListView.jsx:155`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaListView.jsx#L155) | `rounded-card` | Import media preview tile or container | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px image card clipping specification |
| 128 | [`src/widgets/ImportMediaDialog/ImportMediaListView.jsx:187`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaListView.jsx#L187) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 129 | [`src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:841`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaPopover.jsx#L841) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 130 | [`src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:848`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaPopover.jsx#L848) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 131 | [`src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:864`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaPopover.jsx#L864) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 132 | [`src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx:15`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx#L15) | `rounded-button` | Interactive action button | Sharp Action Target (4px) | `rounded-sm` | Runway sharp 4px action target specification |
| 133 | [`src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx:21`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx#L21) | `rounded-badge` | Badge / Metadata tag | Sharp Micro Tag (4px) | `rounded-sm` | Runway sharp 4px micro tag specification |
| 134 | [`src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx:65`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx#L65) | `rounded-card` | Keyboard shortcuts floating dialog panel | Floating Overlay Panel (16px) | `rounded-2xl` | Floating shortcut guide overlay; 16px generous panel tier |
| 135 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:297`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L297) | `rounded-card` | Element creation dropzone / reference preview | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card container specification |
| 136 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:306`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L306) | `rounded-card` | Element creation dropzone / reference preview | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card container specification |
| 137 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:311`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L311) | `rounded-card` | Element creation dropzone / reference preview | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card container specification |
| 138 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:327`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L327) | `rounded-card` | Element creation dropzone / reference preview | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card container specification |
| 139 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:367`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L367) | `rounded-button` | Thumbnail selection slot / add button | Sharp Action Target (4px) | `rounded-sm` | Interactive media slot button; 4px sharp standard |
| 140 | [`src/widgets/NewElementDialog/NewElementDialog.jsx:406`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/NewElementDialog/NewElementDialog.jsx#L406) | `rounded-button` | Thumbnail selection slot / add button | Sharp Action Target (4px) | `rounded-sm` | Interactive media slot button; 4px sharp standard |
| 141 | [`src/widgets/projects/ui/ProjectsFloatingAction.jsx:14`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/projects/ui/ProjectsFloatingAction.jsx#L14) | `rounded-dialog` | ProjectsFloatingAction floating pill container | Generous Dialog (16px) | `rounded-2xl` | Floating action container; 16px matches Runway generous tier |
| 142 | [`src/widgets/projects/ui/ProjectsGrid.jsx:16`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/projects/ui/ProjectsGrid.jsx#L16) | `rounded-card` | Project card container or skeleton | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 143 | [`src/widgets/PromoSlider.jsx:136`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/PromoSlider.jsx#L136) | `rounded-card` | Card / Container surface | Comfortable Card (8px) | `rounded-lg` | Runway comfortable 8px card specification |
| 144 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10) | `rounded-button` | ActionBtn media card action trigger | Capsule Action Target (9999px) | `rounded-full` | Runway Studio action trigger pill standard; circular 28x28px button |
| 145 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:517`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L517) | `rounded-badge` | MediaGridItem element-sheet circular icon badge | Circular Indicator (9999px) | `rounded-full` | Square 28x28px badge with icon; must be circular, not sharp 4px |
| 146 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:634`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L634) | `rounded-button` | Variation thumbnail button | Sharp Action Target (4px) | `rounded-sm` | Interactive grid tile target; 4px sharp standard |
| 147 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:660`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L660) | `rounded-badge` | MediaGridItem variation status chip | Sharp Micro Tag (4px) | `rounded-sm` | Metadata chip over media; Runway sharp 4px badge spec |
| 148 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:1124`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L1124) | `rounded-card` | Media item drag ghost thumbnail overlay | Comfortable Card (8px) | `rounded-lg` | Floating drag thumbnail matches 8px card geometry |
| 149 | [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:1142`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L1142) | `rounded-button` | Selection drag preview button | Sharp Action Target (4px) | `rounded-sm` | Interactive grid tile target; 4px sharp standard |
| 150 | [`src/widgets/StudioLayout/LeftNavigationRail.jsx:95`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/LeftNavigationRail.jsx#L95) | `rounded-button` | Left navigation rail link button | Sharp Action Target (4px) | `rounded-sm` | Sidebar navigation target; 4px sharp button standard |
| 151 | [`src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx:36`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx#L36) | `rounded-dialog` | NewProjectView main viewport surface | Generous Dialog (16px) | `rounded-2xl` | Large sheet/view surface container |
| 152 | [`src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx:66`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx#L66) | `rounded-button` | Settings toggle-group container | Sharp Action Target (4px) | `rounded-sm` | Segmented option toggle group; 4px sharp standard |
| 153 | [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:62`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L62) | `rounded-button` | User avatar skeleton | Circular Avatar (9999px) | `rounded-full` | User avatars are circular icons; must not be square 4px |
| 154 | [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:97`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L97) | `rounded-button` | Avatar primitive wrapper | Circular Avatar (9999px) | `rounded-full` | User avatars are circular icons; must not be square 4px |
| 155 | [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:99`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L99) | `rounded-button` | AvatarFallback text container | Circular Avatar (9999px) | `rounded-full` | User avatars are circular icons; must not be square 4px |
| 156 | [`src/widgets/StudioNavbar/ui/UserDropdown.jsx:109`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L109) | `rounded-card` | User dropdown menu panel | Floating Overlay Panel (16px) | `rounded-2xl` | Floating user menu overlay; aligns with Runway Studio 16px panel scale |


---

## 4. Dropdown and Context Menu Decision Matrix

To ensure that changing the radius of the media card context menu does not introduce unintended side effects across smaller dropdowns, every floating overlay has been audited:

| Component | Shared Primitive | Current Radius | Intended Radius | Live Evidence / Spec Reference | Scope of Change |
|---|---|---|---|---|---|
| **Studio Item Context Menu** | [`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx) via `ContextMenuContent` | `rounded-lg` (8px) locked by `globals.css:1309` (`!important`) | **`rounded-2xl` (16px)** | User screenshot of live Runway Studio shows generous 16px curve | Local to `StudioItemMenu.jsx` and `--mat-menu-container-shape` |
| **Studio Item Dropdown Menu** | [`StudioItemMenu.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx) via `DropdownMenuContent` | `rounded-lg` (8px) locked by `globals.css:1309` (`!important`) | **`rounded-2xl` (16px)** | 3-dots trigger opens the same 16px generous floating menu | Local to `StudioItemMenu.jsx` and `--mat-menu-container-shape` |
| **Toolbar Filter Dropdown** | [`DropdownShell.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/DropdownShell.jsx) via `DropdownMenuContent` | `rounded-lg` (8px) | **`rounded-lg` (8px)** | [`design.md:143`](file:///c:/Users/jihad/Desktop/open%20art/design.md#L143) comfortable card/panel tier | Keep primitive default at 8px |
| **Select Dropdown** | [`select.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/select.jsx#L132) via `SelectContent` | `rounded-lg` (8px) | **`rounded-lg` (8px)** | Form selects are compact; 8px matches input/field proportion | No change (keep 8px) |
| **Popover Panel** | [`popover.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/popover.jsx#L54) via `PopoverContent` | `rounded-lg` (8px) | **`rounded-lg` (8px)** | Popovers adhere to comfortable card tier | No change (keep 8px) |
| **Hover Card** | [`hover-card.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/hover-card.jsx#L19) via `HoverCardContent` | `rounded-lg` (8px) | **`rounded-lg` (8px)** | Information cards over links adhere to 8px tier | No change (keep 8px) |
| **User Dropdown Panel** | [`UserDropdown.jsx:109`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/UserDropdown.jsx#L109) | Dead `rounded-card` (0px) | **`rounded-2xl` (16px)** | Large 360px account/credit panel over canvas | Feature change in `UserDropdown.jsx` |
| **Floating Popovers (Info/Help)**| [`ElementInfoSidebar.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementInfoSidebar.jsx#L57), [`KeyboardShortcutsHelp.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx#L65)| Dead `rounded-card` (0px) | **`rounded-2xl` (16px)** | Prominent floating overlays over studio canvas | Feature change in component files |

### Key Rule Distinction
* **Outer Panel vs Inner Items:**
  * The outer floating container of `StudioItemMenu` uses **`rounded-2xl` (16px)**.
  * The interactive menu items inside use **`rounded-sm` (4px)** on hover with **`gap-3` / `gap-3.5`** spacing.
  * This preserves the visual hierarchy shown in the user's reference screenshot.

---

## 5. Shadow Inventory Revalidation

All 18 production arbitrary shadow occurrences have been classified into 5 functional categories:

| # | File & Line | Current Shadow | Functional Category | Violates `design.md`? | Recommendation & Justification |
|---|---|---|---|---|---|
| 1 | [`[collectionId]/page.js:338`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js#L338) | `shadow-[0_0_30px_rgba(255,255,255,0.4)]` | Interactive state indicator | Borderline | **Replace with high-contrast ring**: `ring-2 ring-white ring-offset-2 ring-offset-black outline-2`. Preserves dragover affordance without fuzzy shadow. |
| 2 | [`test-mention/page.jsx:463`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/test-mention/page.jsx#L463) | `shadow-[0_16px_50px_rgba(0,0,0,0.5)]` | Container elevation | **Yes** | **Replace with `shadow-none border border-white/10`**. Test route container. |
| 3 | [`CharacterCardKrea.jsx:142`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterCardKrea.jsx#L142) | `shadow-[0_20px_25px_-5px_...,0_8px_10px_...]`| Container elevation | **Yes** | **Replace with `shadow-none border border-white/15 bg-black/60`**. Violates Zero Box-Shadow Law. |
| 4 | [`ElementsEmptyState.jsx:91`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementsEmptyState.jsx#L91) | `drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]` | Illustration graphic effect | **No** | **PRESERVE**. Graphic filter applied to SVG illustration artwork, not UI container. |
| 5 | [`ElementsEmptyState.jsx:122`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementsEmptyState.jsx#L122) | `drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]` | Illustration graphic effect | **No** | **PRESERVE**. Graphic filter applied to SVG illustration artwork, not UI container. |
| 6 | [`ElementsEmptyState.jsx:153`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementsEmptyState.jsx#L153) | `drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]` | Illustration graphic effect | **No** | **PRESERVE**. Graphic filter applied to SVG illustration artwork, not UI container. |
| 7 | [`DropdownEngine.jsx:148`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx#L148) | `shadow-[0px_4px_4px_...,0px_20px_25px_...]`| Container elevation | **Yes** | **Replace with `shadow-none border border-white/10`**. Eliminates artificial drop shadow. |
| 8 | [`FlowPromptBoxSettings.jsx:309`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L309) | `shadow-[var(--mat-menu-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 9 | [`dialog.jsx:88`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L88) | `shadow-[var(--mat-dialog-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 10| [`dialog.jsx:106`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L106) | `shadow-[var(--mat-dialog-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 11| [`dialog.jsx:117`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/dialog.jsx#L117) | `shadow-[var(--mat-dialog-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 12| [`DropdownShell.jsx:71`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/DropdownShell.jsx#L71) | `shadow-[var(--mat-menu-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 13| [`hover-card.jsx:19`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/hover-card.jsx#L19) | `shadow-[var(--mat-menu-container-elevation-shadow)]`| Container elevation | Variable is `none` | **Clean to explicit `shadow-none`**. Removes bracket syntax for dead variable. |
| 14| [`LoadingScreen.jsx:37`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/LoadingScreen.jsx#L37) | `shadow-[0_0_10px_rgba(59,130,246,0.5)]` | Interactive state indicator | Borderline | **Replace with pure white / neon track fill** without fuzzy blue glow. |
| 15| [`AssetDetailPage.jsx:113`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/views/AssetDetailPage.jsx#L113) | `shadow-[0_24px_90px_rgba(0,0,0,0.45)]` | Container elevation | **Yes** | **Replace with `shadow-none border border-white/10`**. Modal backdrop provides cinematic focus. |
| 16| [`CoreMediaItemView.jsx:302`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) | `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` | Text/icon legibility | **No** | **PRESERVE**. Protects white status text contrast directly over bright/white video frames. |
| 17| [`CoreMediaItemView.jsx:314`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L314) | `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` | Text/icon legibility | **No** | **PRESERVE**. Protects white duration icon contrast directly over bright/white video frames. |
| 18| [`EditMediaView.jsx:92`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/EditMediaView/EditMediaView.jsx#L92) | `shadow-[0_0_8px_rgba(255,255,255,0.6)]` | Interactive state indicator | Borderline | **Replace with solid white handle + 1px black border** (`bg-white border border-black/40`). |

---

## 6. Legacy CSS Classification

Analysis of all 90 selector blocks containing `.mat-*` and `.flow-*` in [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css):

### 6.1 Actively Used Selectors (DO NOT DELETE)
These classes are actively rendered in JSX:

1. **`mat-mdc-menu-panel` & `flow-menu-panel`** (Lines 974, 1358):
   * *Usage:* Rendered on `<DropdownMenuContent>` in [`StudioItemMenu.jsx:77`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L77).
   * *Role:* Sets width (13rem), min-width (12rem), and backdrop blur.
2. **`mat-mdc-menu-item` & `flow-internal-menu-item`** (Lines 1008, 1392):
   * *Usage:* Rendered on `<DropdownMenuItem>` in [`StudioItemMenu.jsx:94`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L94).
   * *Role:* Controls item height, text layout, and hover layers.
3. **`mat-mdc-menu-item-text`** (Lines 98, 155):
   * *Usage:* Rendered inside [`StudioItemMenu.jsx:98`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L98).
   * *Role:* Flex wrapper for icon and label alignment.
4. **`delete-button`** (Lines 1445–1459):
   * *Usage:* Applied conditionally on destructive items in [`StudioItemMenu.jsx:95`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L95).
   * *Role:* Colors label and icon in red without a filled red background.
5. **`mat-icon`** (Line 104 in `StudioItemMenu.jsx`, line 10 in `GoogleIcon.jsx`):
   * *Usage:* Controls Material Symbols font size, alignment, and sizing.
6. **`flow-menu-item`** (Used in [`button.jsx:117`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/button.jsx#L117)):
   * *Usage:* Button variant alias.
7. **`flow-prompt-box-settings` & `flow-toggles`** (Lines 1303, 1332):
   * *Usage:* Rendered in [`FlowPromptBoxSettings.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx) and [`StudioSettingsDropdown.jsx:66`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx#L66).
8. **`flow-credit-cost-label`** (Line 1352):
   * *Usage:* Rendered in [`FlowPromptBoxSettings.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx).
9. **`flow-video-tile` & `flow-error-tile`** (Lines 1864, 1886):
   * *Usage:* Rendered in [`FlowErrorTile.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/ui/FlowErrorTile.jsx).

### 6.2 Confirmed Unused Selectors (Safe for Future Pruning)
These 16 selectors have zero references in any JSX, JS, or dynamic prop:

* `mat-divider`
* `mat-mdc-list-item`
* `mat-list-item`
* `mat-mdc-menu-content`
* `mat-mdc-menu-submenu-icon`
* `flow-model-picker-panel`
* `flow-textarea`
* `flow-character-ingredient-chip`
* `flow-element-ingredient-chip`
* `flow-ingredient-chip`
* `flow-icon-button`
* `flow-icon-button-primary`
* `--flow-panel-border-radius`
* `--flow-menu-panel-width`
* `--flow-menu-panel-min-width`
* `--flow-icon-wght`

---

## 7. Design System Source of Truth Validation

The architecture strictly follows this unidirectional dependency chain:

$$	ext{design.md} longrightarrow 	ext{Design Tokens (:root)} longrightarrow 	ext{Tailwind Theme (@theme inline)} longrightarrow 	ext{Shared Primitives} longrightarrow 	ext{Feature Components}$$

### Dependency Audit
1. **`design.md` $ightarrow$ Tokens:**
   * Correctly reflects the OLED black palette (`#000000`, `#131314`, `#1e1f20`, `#282a2c`), base radius hierarchy (4px, 6px, 8px, 16px, 9999px), and 8px base spacing ladder.
2. **Tokens $ightarrow$ Tailwind Theme:**
   * Tailwind v4 uses `@theme inline` inside [`src/app/globals.css:165-281`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L165-L281).
   * Verified: No circular variable definitions exist in `:root`.
3. **Tailwind Theme $ightarrow$ Shared Primitives:**
   * Shared primitives in `src/shared/ui/*` correctly consume standard classes (`rounded-sm`, `rounded-lg`, `rounded-2xl`, `rounded-full`).
4. **Shared Primitives $ightarrow$ Feature Components:**
   * **The Seam of Failure:** Feature components bypassed primitives by applying dead compound classes (`rounded-button`, `rounded-card`). Migrating the 156 occurrences restores the seam.

---

## 8. Corrected Implementation Roadmap

*(Awaiting explicit human approval before any file is touched)*

### Phase P0: Required Visual Correctness Fixes (Zero Side-Effect Risk)

* **Task P0.1: Media Item Action Pill Alignment**
  * **Files:** [`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:458, 472`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L472) & [`ActionBtn.jsx:10`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn.jsx#L10).
  * **Change:** Update `ButtonGroup` to `rounded-full bg-white/80 backdrop-blur-md`; update `ActionBtn` to `rounded-full`.
  * **Scope:** Local to media item component.
  * **Risk:** None. Fixes rectangular trigger into capsule pill.
* **Task P0.2: Studio Media Item Menu Radius Alignment (16px)**
  * **Files:** [`src/app/globals.css:346, 1309, 1361`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css#L346) & [`StudioItemMenu.jsx:77, 135`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx#L77).
  * **Change:** Update `--mat-menu-container-shape` from 8px to `var(--radius-2xl, 16px)` so the `!important` rule locks `StudioItemMenu` to 16px. Keep generic `DropdownMenuContent` primitive at 8px default.
  * **Scope:** Local to Studio Item Menu; does not alter compact select dropdowns.
  * **Risk:** None.
* **Task P0.3: Context-Aware Migration of 156 Dead Radius Classes**
  * **Files:** 57 files listed in Section 3 inventory table.
  * **Change:** Replace dead classes according to their verified geometry:
    * 55 buttons $ightarrow$ `rounded-sm`
    * 5 avatars/pills $ightarrow$ `rounded-full`
    * 1 redundant button override $ightarrow$ remove `rounded-button`
    * 71 cards $ightarrow$ `rounded-lg`
    * 3 floating panels $ightarrow$ `rounded-2xl`
    * 13 dialogs $ightarrow$ `rounded-2xl`
    * 8 badges $ightarrow$ `rounded-sm`
  * **Scope:** Feature call sites across 57 files.
  * **Validation:** `npm run ui:check` continues passing with 0 new violations.

---

### Phase P1: Shared Component Consistency and Enforcement

* **Task P1.1: Introduce Canonical Radix `<Slider />` Primitive**
  * **Files:** Create `src/shared/ui/slider.jsx`; adopt in [`DurationSelector.jsx:89`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx#L89) and [`FlowPromptBoxSettings.jsx:626`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx#L626).
  * **Change:** Build Radix UI slider primitive (already exported by `radix-ui@^1.4.3`); remove ~50 lines of duplicate custom webkit-thumb CSS hacks.
  * **Scope:** Shared primitive + 2 feature files.
* **Task P1.2: Add Rule U6 to `ui:check`**
  * **Files:** [`scripts/ui-check.cjs`](file:///c:/Users/jihad/Desktop/open%20art/my-app/scripts/ui-check.cjs).
  * **Change:** Add regex rule flagging any future occurrences of `rounded-(button|card|dialog|badge|input)`.
  * **Scope:** Linting/ratchet script only. Zero risk of false positives.
* **Task P1.3: Consolidate CSS `:root` Declarations**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css).
  * **Change:** Merge lines 283, 1695, and 1826 into one organized `:root` block.

---

### Phase P2: CSS Cleanup and Maintenance

* **Task P2.1: Clean Non-Legibility Elevation Shadows**
  * **Files:** 13 feature files containing container elevation shadows (Section 5).
  * **Change:** Replace container box-shadows with `shadow-none border border-white/10`. Strictly preserve the 2 legibility drop-shadows in [`CoreMediaItemView.jsx:302-314`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx#L302) and 3 illustration drop-shadows in [`ElementsEmptyState.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/elements/ElementsEmptyState.jsx).
* **Task P2.2: Prune Confirmed Unused Angular Material Rules**
  * **Files:** [`src/app/globals.css`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/globals.css).
  * **Change:** Remove the 16 confirmed unused selectors identified in Section 6.2.

---

### Deferred Tasks (Require Separate Design Decisions)

* **Font Migration (Google Sans $ightarrow$ abcNormal / Inter):**
  * Currently deferred. Codebase retains bundled Google Sans Variable font for stability.

---

## 9. Remaining Human Approval Decisions

| Decision | Recommended Action | Impact | Status |
|---|---|---|---|
| **1. Approval to execute Phase P0** | **Approve** (Action Pill `rounded-full`, Studio Item Menu 16px, 156 context-aware radius replacements) | Eliminates all broken 0px corners and aligns card trigger and menu with Runway Studio | **Awaiting Approval** |
| **2. Retain Google Sans Variable Font** | **Approve** (Keep Google Sans; do not switch to Inter or abcNormal) | Preserves current layout, typography weights, and line wraps | **Awaiting Approval** |
| **3. Preserve Media Text Legibility Drop-Shadows** | **Approve** (Keep `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` in `CoreMediaItemView.jsx`) | Ensures text readability over bright/white video frames | **Awaiting Approval** |
| **4. Implement Radix `<Slider />` in Phase P1** | **Approve** (Build `@/shared/ui/slider.jsx` via `radix-ui`) | Eliminates raw range inputs without adding new dependencies | **Awaiting Approval** |
