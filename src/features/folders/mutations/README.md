# mutations

## Overview
Component package providing implementations for `src/features/folders/mutations`.

## Interface
- [useCreateFolder.js] `useCreateFolder` (function)
- [useCreateFolder.js] `default` (default export)
- [useDeleteFolder.js] `useDeleteFolder` (function)
- [useDeleteFolder.js] `default` (default export)
- [useMoveAssetToFolder.js] `useMoveAssetToFolder` (function)
- [useMoveAssetToFolder.js] `default` (default export)
- [useUpdateFolder.js] `useUpdateFolder` (function)
- [useUpdateFolder.js] `default` (default export)

## Invariants
- [useCreateFolder.js] Throws error on invalid arguments or missing context.
- [useCreateFolder.js] Preserves optimistic rollback invariants on mutation failure.
- [useDeleteFolder.js] Throws error on invalid arguments or missing context.
- [useDeleteFolder.js] Preserves optimistic rollback invariants on mutation failure.
- [useMoveAssetToFolder.js] Throws error on invalid arguments or missing context.
- [useMoveAssetToFolder.js] Preserves optimistic rollback invariants on mutation failure.
- [useUpdateFolder.js] Throws error on invalid arguments or missing context.
- [useUpdateFolder.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useCreateFolder.js] Mutates React Query cache.

## Verification
- Run: `npm test`
