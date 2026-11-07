# OpenArt — Phase 2: MediaView Consumer Migration Audit & Controlled Adoption Report

**Date:** November 6, 2026  
**Status:** Completed & Verified  
**Baseline Test Count:** 129 test files, 879 passing tests  
**UI Ratchet:** 0 new violations (`ui-check: OK`)  
**Production Build:** Clean (Next.js 16.2.1 Turbopack)  

---

## 1. Executive Summary

Phase 2 executed a controlled, evidence-based adoption of the canonical `MediaView` (`src/features/media/ui/MediaView.jsx`). 

Rather than executing a mechanical mass migration that flattens necessary domain boundaries, this phase:
1. **Audited and classified all 8 target components** across the application.
2. **Preserved specialized feature adapters** that own domain state and interactions (Studio drag/drop/inline-rename, Picker selection/keyboard rings, and Reference cover/pending upload management).
3. **Migrated direct media presentation call sites** to canonical `MediaView`.
4. **Eliminated two major Feature-Sliced Design (FSD) layer inversions** where feature modules were improperly importing from the widget layer (`features/workflows` and `features/media/ui/MediaViewCard` importing `@/widgets/CoreMediaItemView`).
5. **Maintained 100% backward compatibility** through lightweight delegation shims, ensuring zero regressions across all 879 tests.

---

## 2. Complete Consumer Inventory

A full codebase scan for all usages of `CoreMediaItemView`, `CoreMediaItemPresenter`, `MediaItemView`, `MediaItemViewCore`, `MediaView`, `MediaGridItem`, `ReferenceMediaCard`, and `MediaViewCard` yielded the following inventory:

| Component / Symbol | Defined At | Primary Callers | Primary Responsibility |
|---|---|---|---|
| **`MediaView`** | `src/features/media/ui/MediaView.jsx` | Canonical rendering entry point | Central media layout, video/image rendering, lifecycle states (`ProcessingCard`, `FlowErrorTile`), slots, context menu |
| **`CoreMediaItemPresenter`** | `src/features/media/ui/MediaView.jsx` | Internal to `MediaView` (re-exported) | Pure presentational engine |
| **`MediaViewCard`** | `src/features/media/ui/MediaViewCard.jsx` | `ImportMediaPopover.jsx` | Media Picker item tile: owns selection ring, focus ring, checkbox badge, keyboard selection, hover video scrub |
| **`MediaGridItem`** | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx` | Studio Grid, Collection Grid, Assets, Characters, Elements, Trash | Studio tile adapter: owns drag & drop to PromptBar, inline renaming pill, action buttons, studio dropdown menus, delete dialog |
| **`ReferenceMediaCard`** | `src/components/cinema-studio/common/ReferenceMediaGalleryGrid.jsx` | `ReferenceMediaGalleryGrid.jsx` | Reference photo adapter: owns cover photo bookmark badge, set cover action, pending upload/delete states |
| **`EditMediaView`** | `src/widgets/EditMediaView/EditMediaView.jsx` | `/assets/edit/[workflowId]`, `/elements/edit/[workflowId]` | Inspection page viewer: owns uncropped true-size display and interactive video scrubber bar (`VideoControlsBar`) |
| **`WorkflowMediaGalleryCard`** | `src/features/workflows/ui/WorkflowMediaGallery.jsx` | Workflow sidebar on edit pages | Sidebar media thumbnail card with detach/delete actions and right-click context menu |
| **`CharacterSheetSection`** | `src/components/cinema-studio/characters/CharacterSheetSection.jsx` | Character detail view | Uncropped 3-view turnaround character sheet viewer with update overlay and actions |
| **`MediaItemView`** | `src/widgets/CoreMediaItemView/MediaItemView.jsx` | Backward-compatibility shim | Pass-through wrapper with minimal defaults |
| **`MediaItemViewCore`** | `src/widgets/CoreMediaItemView/index.js` | Export alias (0 callers) | Unused re-export alias |
| **`ImageStatusView`** | `src/features/workflows/ui/ImageStatusView.jsx` | `LibraryMediaGridItem.jsx` | Legacy duplicated media status tile |

---

## 3. Consumer Classification & Justification

### Group A — Direct MediaView Consumers (Migrated)
These components require only media presentation, standard loading/error handling, image/video behavior, and generic slot projection:

1. **`WorkflowMediaGalleryCard` ([`src/features/workflows/ui/WorkflowMediaGallery.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/workflows/ui/WorkflowMediaGallery.jsx)):**
   - **Reasoning:** Only presents candidate workflow media thumbnails with `topLeft` action buttons and right-click context menu.
   - **Action:** Migrated directly to `<MediaView item={item} src={displayUrl} isVideo={iVideo} status={...} contextMenuItems={menuItems} />`.
   - **Architectural win:** Eliminates FSD layer inversion (`features/workflows` no longer imports from `widgets/CoreMediaItemView`).

2. **`CharacterSheetSection` ([`src/components/cinema-studio/characters/CharacterSheetSection.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/characters/CharacterSheetSection.jsx)):**
   - **Reasoning:** Displays the character turnaround sheet with `fit="contain"` and custom overlay during update.
   - **Action:** Migrated directly to `<MediaView workflow={workflow} item={item} src={activeSheetSrc} fit="contain" overlay={...} />`.

### Group B — Feature Adapters (Retained & Internal Delegation Updated)
These components own critical domain-specific behavior and state machines. They MUST NOT be deleted or absorbed into `MediaView`:

1. **`MediaViewCard` ([`src/features/media/ui/MediaViewCard.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/MediaViewCard.jsx)):**
   - **Domain ownership:** Picker selection (`isSelected`), keyboard navigation (`Space`/`Enter` selection), double-click selection, badge badges (`accessibility_new`, `widgets`, `play_arrow`), hover scrub bar.
   - **Action:** Retained as the Picker adapter; updated internal delegation from `CoreMediaItemView` to `MediaView` (relative import `./MediaView`).
   - **Architectural win:** Eliminates intra-feature FSD inversion (`features/media/ui/MediaViewCard` no longer reaches up into `widgets/CoreMediaItemView`).

2. **`MediaGridItem` ([`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx)):**
   - **Domain ownership:** Studio drag & drop (`useStudioItemDrag`), floating inline rename pill (`InlineRenamePill`), Studio button group (`ButtonGroup`, `ActionBtn`), like toggle mutation, delete confirmation modal, and collection directory management (`CollectionMediaGridItem`).
   - **Action:** Retained as the primary Studio grid adapter; updated internal delegation from `CoreMediaItemView` to `MediaView` from `@/features/media`.

3. **`ReferenceMediaCard` ([`src/components/cinema-studio/common/ReferenceMediaGalleryGrid.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/components/cinema-studio/common/ReferenceMediaGalleryGrid.jsx)):**
   - **Domain ownership:** Reference photo strip management (1 to 6 photos), cover bookmark indicator, set-cover mutation, pending upload/delete spinners.
   - **Action:** Retained as the Reference gallery adapter; updated internal delegation from `MediaItemView` to `MediaView` from `@/features/media`.

4. **`EditMediaView` ([`src/widgets/EditMediaView/EditMediaView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/EditMediaView/EditMediaView.jsx)):**
   - **Domain ownership:** Uncropped edit canvas layout, custom interactive scrubber (`VideoControlsBar`), pointer seek event listeners.
   - **Action:** Retained as the Edit page viewer; updated import to `MediaView` from `@/features/media`. Employs `core={core}` pass-through so hook execution is bypassed in the presenter.

### Group C — Legacy Compatibility Shims (Retained for Zero Regressions)
1. **`CoreMediaItemView.jsx` ([`src/widgets/CoreMediaItemView/CoreMediaItemView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/CoreMediaItemView.jsx)):**
   - Retained as a 13-line re-export shim to satisfy existing static assertions (`iconName="videocam"`, borderless card styling) and external references.
2. **`MediaItemView.jsx` ([`src/widgets/CoreMediaItemView/MediaItemView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/MediaItemView.jsx)):**
   - Retained as a pass-through wrapper for backward compatibility, now delegating directly to `MediaView`.
3. **`index.js` ([`src/widgets/CoreMediaItemView/index.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/CoreMediaItemView/index.js)):**
   - Re-exports `CoreMediaItemView`, `CoreMediaItemPresenter`, `MediaItemViewCore`, and `MediaItemView`.

### Group D — Duplicate / Unused Implementations (Identified)
1. **`ImageStatusView` ([`src/features/workflows/ui/ImageStatusView.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/workflows/ui/ImageStatusView.jsx)):**
   - Legacy duplicate of `ProcessingCard`, `FlowErrorTile`, and media image/video rendering. Used only by `LibraryMediaGridItem`. Scheduled for future phase consolidation.
2. **Theoretical Hierarchy (`MediaHero`, `MediaChip`, `MediaTile`, `MediaCard`, `MediaRenderer`):**
   - Zero live production consumers. Retained without deletion to maintain isolation and avoid touching non-targeted files.

---

## 4. Phase 1 Architecture Verification Results

| Verification Item | Finding | Status |
|---|---|---|
| **1. FSD Boundaries** | `features/media/ui/MediaView.jsx` imports strictly from `@/shared/*` and `@/features/workflows/core/*`. Zero imports from `widgets` or `app`. Migrations eliminated previous inversions in `MediaViewCard` and `WorkflowMediaGallery`. | **VERIFIED** |
| **2. `resolveMainMedia` Ownership** | Single source of truth in `src/features/workflows/core/resolveMediaRef.js`. Zero duplicate resolution logic in `MediaView`. | **VERIFIED** |
| **3. Source Precedence** | When both `media` (or `item`) and `workflow` are passed, direct media visual data wins, while workflow supplies entity metadata (`is_liked`, favorited). | **VERIFIED** |
| **4. `mediaId` Scope** | Performs purely synchronous in-memory index selection within `workflow.items`. Zero data fetching or N+1 queries. | **VERIFIED** |
| **5. `core` Pass-Through** | Callers passing precomputed `core` (e.g. `EditMediaView`) bypass hook state allocation in `MediaView`, avoiding duplicate re-renders. | **VERIFIED** |
| **6. Video Ref Forwarding** | Supports both external `videoRef` and internal/core refs. Tested and verified in unit tests. | **VERIFIED** |
| **7. Hover Playback Lifecycle** | `playOnHover` plays on `mouseEnter` and pauses/resets (`currentTime = 0`) on `mouseLeave`. | **VERIFIED** |
| **8. Autoplay Behavior** | When `playOnHover` is true, background autoplay is automatically disabled to eliminate audio/video contention. | **VERIFIED** |
| **9. Status Precedence** | Supports canonical `'ready'` and legacy `'completed'` alongside `'processing'` and `'failed'`. | **VERIFIED** |
| **10. Circular Dependency Risk** | Dependency direction is strictly `widgets` $\to$ `features` $\to$ `shared`. Zero circular imports exist. | **VERIFIED** |

---

## 5. Controlled Migration Summary

```
Before:
[WorkflowMediaGallery] --------> (widgets/CoreMediaItemView) [FSD Inversion]
[MediaViewCard] ---------------> (widgets/CoreMediaItemView) [FSD Inversion]
[EditMediaView] ---------------> (widgets/CoreMediaItemView)
[MediaGridItem] ---------------> (widgets/CoreMediaItemView)
[ReferenceMediaCard] ----------> (widgets/CoreMediaItemView/MediaItemView) -> (widgets/CoreMediaItemView)
[CharacterSheetSection] -------> (widgets/CoreMediaItemView/MediaItemView) -> (widgets/CoreMediaItemView)

After:
[WorkflowMediaGallery] --------> (features/media/MediaView) [FSD Compliant]
[MediaViewCard] ---------------> (./MediaView)              [FSD Compliant]
[EditMediaView] ---------------> (features/media/MediaView)
[MediaGridItem] ---------------> (features/media/MediaView)
[ReferenceMediaCard] ----------> (features/media/MediaView)
[CharacterSheetSection] -------> (features/media/MediaView)
(widgets/CoreMediaItemView) ---> delegation shim to (features/media/MediaView)
```

---

## 6. Verification & Gate Evidence

### Vitest Test Suite (100% Pass)
```
 ✓ src/features/media/ui/__tests__/MediaView.test.jsx (21 tests)
 ✓ src/features/media/ui/__tests__/MediaViewCard.test.jsx (11 tests)
 ✓ src/features/media/ui/__tests__/MediaRenderer.test.jsx (7 tests)
 ✓ src/features/media/ui/__tests__/mediaReRenders.test.jsx (4 tests)
 ✓ src/widgets/CoreMediaItemView/CoreMediaItemView.test.jsx (13 tests)
 ✓ src/widgets/CoreMediaItemView/MediaItemView.test.jsx (7 tests)
 ✓ src/widgets/EditMediaView/__tests__/EditMediaView.test.jsx (1 test)
 ✓ src/widgets/StudioLayout/__tests__/StudioLayoutAlignment.test.jsx (11 tests)
 ✓ src/components/cinema-studio/characters/CharacterSheetSection.test.jsx (6 tests)
 ✓ src/components/cinema-studio/characters/CharacterDetailsGallery.test.jsx (20 tests)
 ✓ src/components/cinema-studio/elements/ElementDetailsGallery.test.jsx (13 tests)

 Test Files  129 passed (129)
      Tests  879 passed (879)
   Duration  78.30s
```

### UI Ratchet Gate Check (`npm run ui:check`)
```
Rule   Now  Baseline  New  Description
U1     241       448    0  raw color literal (#hex, rgb(), hsl(), oklch(), oklab()) outside token files
U2     715      1258    0  Tailwind arbitrary value (w-[437px], p-[13px], ...)
U3      13        13    0  raw <button> outside the primitives folder (use the Button primitive)
U4       8         8    0  fetch( inside components/, features/, or widgets/ (use the API client or a hook)
U5      83        97    0  inline style={{ }} (use tokens/classes; allowed only for truly dynamic values)
U6       0         0    0  dead radius class (rounded-button, rounded-card, rounded-dialog, rounded-badge, rounded-input)
U7       0         0    0  positive Tailwind shadow class (shadow-xs, shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl; use shadow-none or border separation)

ui-check: OK (no new violations)
```

### Production Build (`npm run build`)
```
▲ Next.js 16.2.1 (Turbopack)
✓ Compiled successfully in 6.8s
  Running TypeScript ...
  Finished TypeScript in 2.1s ...
✓ Generating static pages using 11 workers (14/14) in 721ms
```

---

## 7. Remaining Architectural Risks & Recommendations

1. **`ImageStatusView` (`features/workflows/ui/ImageStatusView.jsx`):**
   - Still used in `LibraryMediaGridItem.jsx`. It duplicates error and progress rendering.
   - *Recommendation:* Migrate `LibraryMediaGridItem` to `MediaView` in a focused follow-up session, then safely decommission `ImageStatusView`.
2. **Theoretical Media Hierarchy (`MediaHero`, `MediaChip`, `MediaTile`, `MediaCard`, `MediaRenderer`):**
   - Verified to have zero production consumers.
   - *Recommendation:* Keep them untouched until an explicit deprecation and removal ticket is authorized.
3. **CoreMediaItemView Deprecation Timeline:**
   - All live production components now render `MediaView`.
   - `CoreMediaItemView.jsx` and `MediaItemView.jsx` can remain as permanent or long-term shims at zero operational cost, preventing breaking changes across external or future branches.
