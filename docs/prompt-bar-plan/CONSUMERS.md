# Legacy Store Consumers Inventory

Inventory of all consumers of `usePromptStore`, `useCharacterStore`, and `useElementStore`.

## Classification Guide
- **MIGRATE**: The field or action duplicates data in the per-instance PromptBar store (`prompt`, `selectedModelId`, `parameterValues`, `activeMode`, references). Target for migration in Phase P5.
- **KEEP**: Genuinely separate state belonging to a distinct domain (gallery drag-and-drop state, character feature traits form). Remains in legacy store per PB-D-17.
- **UNKNOWN**: Field or consumer whose ownership cannot be unambiguously classified. (Current count: 0).

---

## Consumer Inventory Table

| Consumer File | Store | Field / Action | Duplicates Instance Store? | Class | Notes |
|---|---|---|---|---|---|
| `src/features/workflows/model/useMediaActions.js:169-181` | `usePromptStore` | `setGenerationMode`, `setPrompt`, `setModelId`, `setRatio`, `setReferenceImages`, `setQuality`, `setVideoResolution`, `setDuration`, `setMotion`, `setCount` | YES | **MIGRATE** | Dual-write site in `handleReuseSettings`. Duplicates writes already sent to `activeBarStore`. |
| `src/features/workflows/model/useMediaActions.js:217-227` | `usePromptStore` | `setGenerationMode`, `clearReferences`, `addReference` | YES | **MIGRATE** | Fallback in `handleAnimate` when `animateMedia` returns false. |
| `src/features/workflows/model/useMediaActions.js:263` | `usePromptStore` | `addReference` | YES | **MIGRATE** | Fallback in `handleUseAsReference`. |
| `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js:22-26` | `usePromptStore` | `setGenerationMode`, `setModelId`, `setRatio`, `setQuality`, `setVideoResolution` | YES | **MIGRATE** | Presets generation parameters upon loading element edit page. |
| `src/features/workflows/model/useMediaActions.js:110-112` | `useElementStore` | `setPrompt`, `features` | NO | **KEEP** | Updates element prompt & traits during element action. |
| `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js:20-21` | `useElementStore` | `hydrateElementDraft`, `resetElementStore` | NO | **KEEP** | Element turnaround sheet & draft hydration. |
| `src/app/cinema-studio/[projectId]/characters/new/page.js:124` | `useCharacterStore` | `setPrompt` | NO | **KEEP** | Sets prompt from archetype selection. Character prompt bar is locked (PB-D-18). |
| `src/features/prompt-bar/ui/common/editor/FeatureNode.jsx:8` | `useCharacterStore` | `openFeatureEditorForLabel` | NO | **KEEP** | Lexical feature tag click handler opening character traits editor. |
| `src/features/prompt-bar/ui/common/editor/plugins/SyncFeaturesPlugin.jsx:10-11` | `useCharacterStore` | `features`, `updateFeature` | NO | **KEEP** | Synchronizes Lexical editor state with character traits form. |
| `src/features/prompt-bar/ui/common/editor/plugins/TextTagConverterPlugin.jsx:20` | `useCharacterStore` | `updateFeature` | NO | **KEEP** | Converts typed text into character feature nodes. |
| `src/app/cinema-studio/[projectId]/assets/page.js:67-68` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem` | NO | **KEEP** | Gallery drag & drop state. |
| `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js:109-136` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem` | NO | **KEEP** | Collection view drag & drop state. |
| `src/app/cinema-studio/[projectId]/elements/page.js:47` | `usePromptStore` | `isDraggingGalleryItem` | NO | **KEEP** | Elements grid drag overlay. |
| `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx:96` | `usePromptStore` | `isDraggingGalleryItem` | NO | **KEEP** | Navbar drag dropzone visual feedback. |
| `src/features/studio/useDragAutoScroll.js:204-273` | `usePromptStore` | `isDraggingGalleryItem`, subscribe | NO | **KEEP** | Studio container edge auto-scrolling during drag. |
| `src/features/studio/useStudioItemDrag.js:145-205` | `usePromptStore` | `setIsDraggingGalleryItem`, `setDraggedItem` | NO | **KEEP** | Media item drag handlers. |
| `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:68-788` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem`, setters | NO | **KEEP** | Grid item drag initiation and drop handling. |

---

## UNKNOWN Count
**Total UNKNOWN**: 0

## Proposed Migration Order for Phase P5
1. `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js`: Isolated form loader; replace legacy setters with `promptBarService` or local state.
2. `src/features/workflows/model/useMediaActions.js`: Central media action handler; eliminate dual writes in `handleReuseSettings`, replace legacy fallback in `handleAnimate` and `handleUseAsReference` with explicit `promptBarService` calls.
3. Drag-and-drop state in `usePromptStore`: Retain in `usePromptStore` per PB-D-17 without disrupting gallery interactions.
