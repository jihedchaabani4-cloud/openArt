# mutations

## Overview
Component package providing implementations for `src/features/workflows/api/mutations`.

## Interface
- [useDeleteMedia.js] `useDeleteMedia` (function)
- [useDeleteMedia.js] `default` (default export)
- [useDetachMedia.js] `useDetachMedia` (function)
- [useDetachMedia.js] `default` (default export)
- [useGenerateMutation.js] `useGenerateMutation` (function)
- [useMoveWorkflow.js] `useMoveWorkflow` (function)
- [useRemoveWorkflow.js] `useRemoveWorkflow` (function)
- [useRemoveWorkflow.js] `default` (default export)
- [useRemoveWorkflowItem.js] `useRemoveWorkflowItem` (function)
- [useRemoveWorkflowItem.js] `default` (default export)
- [useSetPrimaryMedia.js] `useSetPrimaryMedia` (function)
- [useSetPrimaryMedia.js] `default` (default export)
- [useToggleLike.js] `useToggleLike` (function)
- [useToggleLike.js] `default` (default export)
- [useToggleWorkflowLike.js] `useToggleWorkflowLike` (function)
- [useToggleWorkflowLike.js] `default` (default export)
- [useUpdateWorkflow.js] `useUpdateWorkflow` (function)
- [useUpdateWorkflow.js] `default` (default export)

## Invariants
- [useDeleteMedia.js] Throws error on invalid arguments or missing context.
- [useDeleteMedia.js] Preserves optimistic rollback invariants on mutation failure.
- [useDetachMedia.js] Throws error on invalid arguments or missing context.
- [useDetachMedia.js] Preserves optimistic rollback invariants on mutation failure.
- [useGenerateMutation.js] Throws error on invalid arguments or missing context.
- [useGenerateMutation.js] Preserves optimistic rollback invariants on mutation failure.
- [useRemoveWorkflow.js] Throws error on invalid arguments or missing context.
- [useRemoveWorkflow.js] Preserves optimistic rollback invariants on mutation failure.
- [useRemoveWorkflowItem.js] Throws error on invalid arguments or missing context.
- [useRemoveWorkflowItem.js] Preserves optimistic rollback invariants on mutation failure.
- [useSetPrimaryMedia.js] Throws error on invalid arguments or missing context.
- [useSetPrimaryMedia.js] Preserves optimistic rollback invariants on mutation failure.
- [useToggleLike.js] Throws error on invalid arguments or missing context.
- [useToggleLike.js] Preserves optimistic rollback invariants on mutation failure.
- [useToggleWorkflowLike.js] Throws error on invalid arguments or missing context.
- [useToggleWorkflowLike.js] Preserves optimistic rollback invariants on mutation failure.
- [useUpdateWorkflow.js] Throws error on invalid arguments or missing context.
- [useUpdateWorkflow.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useGenerateMutation.js] Mutates React Query cache.

## Verification
- Run: `npm test`
