# hooks

## Overview
Component package providing implementations for `src/features/elements/hooks`.

## Interface
- [index.js] `useElement` (re-export)
- [index.js] `default` (re-export)
- [index.js] `useElementSheetWorkflows` (re-export)
- [index.js] `useCreateElementSheetMutation` (re-export)
- [index.js] `useUpdateElementMetadata` (re-export)
- [index.js] `useAddImageToElement` (re-export)
- [index.js] `useDeleteMediaItem` (re-export)
- [index.js] `useAnalyzeElementVision` (re-export)
- [useAddImageToElement.js] `useAddImageToElement` (function)
- [useAddImageToElement.js] `default` (default export)
- [useAnalyzeElementVision.js] `useAnalyzeElementVision` (function)
- [useCreateElementForm.js] `useCreateElementForm` (function)
- [useCreateElementForm.js] `default` (default export)
- [useCreateElementSheetMutation.js] `useCreateElementSheetMutation` (function)
- [useDeleteMediaItem.js] `useDeleteMediaItem` (function)
- [useDeleteMediaItem.js] `default` (default export)
- [useElementComposer.js] `useElement` (function)
- [useElementComposer.js] `default` (default export)
- [useElementEdit.js] `useElementEdit` (function)
- [useElementEdit.js] `default` (default export)
- [useElementSheetWorkflows.js] `useElementSheetWorkflows` (function)
- [useNewElement.js] `useNewElement` (function)
- [useNewElement.js] `default` (default export)
- [useUpdateElementMetadata.js] `useUpdateElementMetadata` (function)

## Invariants
- [useAddImageToElement.js] Preserves optimistic rollback invariants on mutation failure.
- [useCreateElementSheetMutation.js] Throws error on invalid arguments or missing context.
- [useCreateElementSheetMutation.js] Preserves optimistic rollback invariants on mutation failure.
- [useDeleteMediaItem.js] Preserves optimistic rollback invariants on mutation failure.
- [useElementComposer.js] Guard clauses return `null` when required state or props are absent.
- [useNewElement.js] Guard clauses return `null` when required state or props are absent.
- [useUpdateElementMetadata.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useAddImageToElement.js] Mutates React Query cache.
- [useAnalyzeElementVision.js] Mutates React Query cache.
- [useCreateElementSheetMutation.js] Mutates React Query cache.
- [useUpdateElementMetadata.js] Mutates React Query cache.

## Verification
- Run: `npm test`
