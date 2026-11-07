# studio

## Overview
Component package providing implementations for `src/features/studio`.

## Interface
- [index.js] `usePromptStore` (re-export)
- [index.js] `useCharacterStore` (re-export)
- [index.js] `useElementStore` (re-export)
- [index.js] `useLibraryFilter` (re-export)
- [index.js] `extractIdentifyingKeys` (re-export)
- [index.js] `getEntityImageCount` (re-export)
- [index.js] `addMediaToPrompt` (re-export)
- [index.js] `animateMedia` (re-export)
- [index.js] `normalizeMediaAsset` (re-export)
- [index.js] `canAnyModelAcceptEntity` (re-export)
- [index.js] `setPendingPromptAction` (re-export)
- [index.js] `consumePendingPromptAction` (re-export)
- [index.js] `getActivePromptBarStore` (re-export)
- [index.js] `setActivePromptBarStore` (re-export)
- [index.js] `PromptBarStoreProvider` (re-export)
- [index.js] `PromptBarStoreContext` (re-export)
- [index.js] `tagsService` (re-export)
- [index.js] `entityService` (re-export)
- [index.js] `adaptBackendModel` (re-export)
- [index.js] `adaptBackendCatalog` (re-export)
- [index.js] `getModelReferenceCapability` (re-export)
- [index.js] `useDragAutoScroll` (re-export)
- [index.js] `findScrollContainer` (re-export)
- [index.js] `scrollContainerBy` (re-export)
- [index.js] `useStudioItemDrag` (re-export)
- [index.js] `detectDropTargetAtPoint` (re-export)
- [useDragAutoScroll.js] `findScrollContainer` (function)
- [useDragAutoScroll.js] `scrollContainerBy` (function)
- [useDragAutoScroll.js] `useDragAutoScroll` (function)
- [usePromptStore.js] `usePromptStore` (re-export)
- [useStudioItemDrag.js] `detectDropTargetAtPoint` (function)
- [useStudioItemDrag.js] `useStudioItemDrag` (function)

### Subdirectories
- **[core](./core/README.md)**

## Invariants
- [useDragAutoScroll.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [useDragAutoScroll.js] Registers global window/DOM event listeners.
- [useStudioItemDrag.js] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
