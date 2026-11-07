# mutations

## Overview
Component package providing implementations for `src/features/media/api/mutations`.

## Interface
- [useBatchUploadAssets.js] `useBatchUploadAssets` (function)
- [useRemoveAsset.js] `useRemoveAsset` (function)
- [useRemoveAsset.js] `default` (default export)

## Invariants
- [useBatchUploadAssets.js] Throws error on invalid arguments or missing context.
- [useBatchUploadAssets.js] Preserves optimistic rollback invariants on mutation failure.
- [useRemoveAsset.js] Throws error on invalid arguments or missing context.
- [useRemoveAsset.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useBatchUploadAssets.js] Mutates React Query cache.

## Verification
- Run: `npm test`
