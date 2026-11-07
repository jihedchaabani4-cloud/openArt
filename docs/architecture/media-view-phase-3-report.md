# OpenArt — Phase 3: Media Rendering Consolidation & Legacy Cleanup Report

**Date:** November 6, 2026  
**Status:** Completed & Fully Consolidated  
**Baseline Test Count:** 129 test files, 879 passing tests (0 regressions)  
**UI Ratchet:** Passed (`ui-check: OK`, -10 baseline violations eliminated)  
**Production Build:** Clean (Next.js 16.2.1 Turbopack, 8.3s build, 0 errors)  

---

## 1. Executive Summary

Phase 3 finalized the unified media rendering consolidation for OpenArt. 

Key outcomes:
1. **Consolidated `ImageStatusView`:** Migrated `LibraryMediaGridItem` to canonical `MediaView`, and permanently removed `src/features/workflows/ui/ImageStatusView.jsx`. This eliminated an ad-hoc duplicate rendering engine and purged 10 historical UI ratchet violations (6 U1, 2 U2, 2 U5) from the codebase.
2. **Affirmed Resolver Ownership:** Confirmed that `resolveMediaRef.js` and `resolveMainMedia` belong in `src/features/workflows/core/` as a Workflow domain responsibility, avoiding unnecessary abstraction churn.
3. **Classified Remaining Compatibility Shims:** Verified that `CoreMediaItemView.jsx` and `MediaItemView.jsx` serve essential roles as static assertion anchors and test compatibility shims at zero runtime maintenance cost.
4. **Deferred Theoretical Component Deletion:** Preserved `MediaHero`, `MediaChip`, `MediaTile`, `MediaCard`, and `MediaRenderer` to avoid breaking `SharedGalleryGrid` fallback defaults and their dedicated unit tests.
5. **Full Verification:** Zero test regressions across all 129 test files (879/879 tests passed), clean Next.js Turbopack build, and updated AST knowledge graph.

---

## 2. ImageStatusView Behavior Comparison & Consolidation

### Behavior Comparison Table

| Feature / Behavior | `ImageStatusView.jsx` (Legacy) | `MediaView.jsx` (Canonical) | Verdict |
|---|---|---|---|
| **1. Image rendering** | Lazy-loaded `<img>` with `object-cover` and custom `@keyframes` skeleton shimmer. | `<img>` with intrinsic aspect caching, decoding async, and smooth `bg-surface-panel animate-pulse` skeleton. | **MediaView covers and improves** (avoids non-standard `<style jsx>` attribute warning). |
| **2. Video rendering** | Relied on cloning `children` to inject `onLoadedData`. | Native `<video>` rendering with `videoRef`, `loop`, `playsInline`, `muted`, `preload="metadata"`, and hover scrubbing. | **MediaView covers natively** without fragile `React.cloneElement`. |
| **3. Processing states** | Renders `<ProcessingCard progress={progress} isVideo={isVideo} />`. | Renders `<ProcessingCard progress={progress} isVideo={isVideo} />`. | **Identical capability.** |
| **4. Progress display** | Passed down to `ProcessingCard`. | Passed down to `ProcessingCard` from `progress` prop, `core.progress`, or `item.progress`. | **Identical capability.** |
| **5. Failed states** | Renders `<FlowErrorTile error={error} onReusePrompt={onReusePrompt} onDelete={onDelete} />`. | Renders `<FlowErrorTile error={error} onReusePrompt={onRetry} canReusePrompt={canReusePrompt} onDelete={onDelete} />`. | **Identical capability.** |
| **6. Error messages** | Displayed via `FlowErrorTile`. | Displayed via `FlowErrorTile`. | **Identical capability.** |
| **7. Retry behavior** | `onReusePrompt` callback. | `onRetry` / `canReusePrompt` callbacks. | **Identical capability.** |
| **8. Missing / invalid URLs** | Rendered blank `bg-white/5` fallback div. | Renders clean placeholder/skeleton without throwing or crashing. | **Identical capability.** |
| **9. Aspect ratio and fit** | Container inline style `aspectRatio: aspect`. | Container computed style `aspectRatio: displayAspect`, with `fit="cover"` or `fit="contain"`. | **MediaView covers and satisfies UI Rule U5.** |
| **10. Loading / fallback** | Shimmer animation overlay. | Design-token skeleton pulse overlay. | **Identical capability.** |
| **11. Slots and overlays** | Only basic `children`. | 7 designated slots (`topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `bottom`, `center`, `overlay`). | **MediaView is strictly superior.** |
| **12. Accessibility** | Inlined raw styles. | Semantic buttons, design system tokens, and ARIA labels. | **MediaView is strictly superior.** |

### Migration Decision & Execution
`MediaView` fully covers every functional requirement of `ImageStatusView` while eliminating an ad-hoc rendering branch:
- **`LibraryMediaGridItem.jsx`:** Migrated to `<MediaView item={media} src={media.url} isVideo={isVideo} status={status} fit="cover" videoRef={videoRef} playOnHover={true} ... />`.
- **Domain behavior preserved:** The selection checkbox button, bottom badges (play arrow, like heart), top-right action buttons (Like, Delete), router navigation, and delete confirmation dialog all remain fully intact in `LibraryMediaGridItem`.
- **Safe removal of `ImageStatusView.jsx`:** After verifying zero other production consumers, zero test imports, and zero static assertions, `src/features/workflows/ui/ImageStatusView.jsx` was deleted using `git rm`.

---

## 3. Resolver Ownership Review

### Investigation Findings
`src/features/workflows/core/resolveMediaRef.js` defines:
- `normalizeWorkflowType(workflow)` (`UPLOAD | GENERATION | ELEMENT | CHARACTER`)
- `getWorkflowPrimaryMediaId(workflow)`
- `pickCharacterPrimaryMedia(workflow, items)` (explicit pin $\to$ turnaround sheet $\to$ non-detail $\to$ first)
- `pickElementPrimaryMedia(workflow, items)` (primary media id $\to$ first)
- `pickUploadPrimaryMedia(workflow, items)`
- `pickGenerationPrimaryMedia(workflow, items)`
- `resolveMainMedia(workflow, items)`
- `resolveMediaRef(ref, context)`

### Ownership Decision: Keep in `features/workflows/core`
1. **Workflow Domain Responsibility:** A `workflow` is a composite business entity representing generation jobs, character sheets, element collections, or upload batches. Determining which asset is the "primary display media" of a workflow requires evaluating workflow types, character roles (`sheet`, `detail`), and element metadata. It is inherently a Workflow domain concern, not a generic media property.
2. **FSD Justification:** `features/workflows/core` is a pure JavaScript headless sublayer (zero DOM, zero React). Both `features/workflows` and `features/media` exist at the `features` layer. Consuming headless core helpers across peer features is permitted and standard in FSD when no circular dependencies exist.
3. **Ponytail / YAGNI Principle:** Moving `resolveMediaRef.js` to `features/media` or `shared` would touch 15+ caller files across the application solely for file path churn. It would create unnecessary abstraction with zero functional or performance improvement.
4. **Resolution:** **Retain `resolveMediaRef.js` in `src/features/workflows/core/`.**

---

## 4. Legacy Compatibility Classification

Every remaining compatibility export and import was inspected and classified:

| Export / File | Location | Usages | Classification | Action / Recommendation |
|---|---|---|---|---|
| **`CoreMediaItemView.jsx`** | `src/widgets/CoreMediaItemView/CoreMediaItemView.jsx` | `CoreMediaItemView.test.jsx`, `StudioLayoutAlignment.test.jsx`, barrel indexes | **Static assertion dependency & Test consumer** | **RETAIN SHIM.** Deleting it would fail `StudioLayoutAlignment.test.jsx:198` (which inspects the file on disk). The 13-line shim has zero operational overhead. |
| **`CoreMediaItemPresenter`** | `src/features/media/ui/MediaView.jsx` | `MediaView.test.jsx`, `CoreMediaItemView.test.jsx`, re-exported in shims | **Public presentational primitive** | **RETAIN.** Essential for callers that supply their own state and wish to bypass hook allocation. |
| **`MediaItemView.jsx`** | `src/widgets/CoreMediaItemView/MediaItemView.jsx` | `MediaItemView.test.jsx` (7 tests), barrel index | **Test consumer & Compatibility shim** | **RETAIN SHIM.** Thin wrapper delegating to `MediaView`. Ensures backward compatibility for external branches. |
| **`MediaItemViewCore`** | `src/widgets/CoreMediaItemView/index.js` | `src/widgets/index.js` (0 callers) | **Unused export alias** | Harmless export alias in barrels. Retained for API stability. |

---

## 5. Theoretical Media Hierarchy Review

The theoretical components in `src/features/media/ui/`:
- `MediaHero.jsx`
- `MediaChip.jsx`
- `MediaTile.jsx`
- `MediaCard.jsx`
- `MediaRenderer.jsx`

### Findings:
1. `MediaCard` and `MediaTile` are imported by `src/features/media/ui/SharedGalleryGrid.jsx` as fallback defaults (`DefaultCard = variant === "tile" ? MediaTile : MediaCard`).
2. They are actively tested in [`mediaReRenders.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/__tests__/mediaReRenders.test.jsx) and [`MediaRenderer.test.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/media/ui/__tests__/MediaRenderer.test.jsx).
3. They do not introduce runtime errors, FSD violations, or UI ratchet regressions.

### Decision:
Per the prompt instruction (*"Deletion may be deferred if it does not materially improve the architecture"*), **deletion is deferred**. Deleting them now would require modifying `SharedGalleryGrid` defaults and rewriting multiple test suites for negligible gain.

---

## 6. Dependency Graph — Before & After

```
Before Phase 1-3:
[Studio MediaGridItem] --------> (widgets/CoreMediaItemView) [Inverted Coupling to StudioItemMenu]
[EditMediaView] ---------------> (widgets/CoreMediaItemView)
[WorkflowMediaGallery] --------> (widgets/CoreMediaItemView) [FSD Inversion]
[MediaViewCard] ---------------> (widgets/CoreMediaItemView) [FSD Inversion]
[ReferenceMediaCard] ----------> (widgets/CoreMediaItemView/MediaItemView)
[CharacterSheetSection] -------> (widgets/CoreMediaItemView/MediaItemView)
[LibraryMediaGridItem] --------> (features/workflows/ui/ImageStatusView) [Duplicate Presenter]

After Phase 3 Consolidation:
[Studio MediaGridItem] --------> (features/media/MediaView) [FSD Compliant]
[EditMediaView] ---------------> (features/media/MediaView) [core={core} pass-through]
[WorkflowMediaGallery] --------> (features/media/MediaView) [FSD Compliant]
[MediaViewCard] ---------------> (./MediaView)              [FSD Compliant]
[ReferenceMediaCard] ----------> (features/media/MediaView) [Direct Feature Delegation]
[CharacterSheetSection] -------> (features/media/MediaView) [Direct Feature Delegation]
[LibraryMediaGridItem] --------> (features/media/MediaView) [Duplicate Eliminated]

Compatibility Shims:
(widgets/CoreMediaItemView) ---> Re-exports (features/media/MediaView)
(widgets/MediaItemView) -------> Delegates to (features/media/MediaView)
(ImageStatusView) -------------> REMOVED (Zero Consumers)
```

---

## 7. Verification & Gate Evidence

### Vitest Test Suite (100% Pass)
```
 ✓ src/features/assets/ui/__tests__/LibraryMediaGridItem.test.jsx (2 tests)
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
   Duration  74.30s
```

### UI Ratchet Gate Check (`npm run ui:check`)
```
Rule   Now  Baseline  New  Description
U1     235       448    0  raw color literal outside token files (-6 violations)
U2     713      1258    0  Tailwind arbitrary value (-2 violations)
U3      13        13    0  raw <button> outside primitives folder
U4       8         8    0  fetch( inside components/features/widgets
U5      81        97    0  inline style={{ }} (-2 violations)
U6       0         0    0  dead radius class
U7       0         0    0  positive Tailwind shadow class

ui-check: OK (no new violations, 10 historical violations permanently eliminated)
```

### Production Build (`npm run build`)
```
▲ Next.js 16.2.1 (Turbopack)
✓ Compiled successfully in 8.3s
  Running TypeScript ...
  Finished TypeScript in 1.95s ...
✓ Generating static pages using 11 workers (14/14) in 669ms
```

---

## 8. Final Architecture Recommendation

The Unified MediaView Architecture is now **complete and closed**.

- **Single Canonical Engine:** `src/features/media/ui/MediaView.jsx` handles all media presentation throughout OpenArt.
- **Clear Domain Separation:** Studio, Picker, Library, and Reference behaviors remain cleanly encapsulated in their owning feature adapters.
- **Zero FSD Inversions:** No feature imports from higher layers.
- **Zero Regressions:** All 879 tests pass, production builds cleanly, and the UI ratchet shows a net reduction of 10 violations.
- **No Further Phases Required:** The consolidation goals have been fully achieved.
