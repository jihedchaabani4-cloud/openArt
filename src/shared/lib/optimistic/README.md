# optimistic

## Overview
Component package providing implementations for `src/shared/lib/optimistic`.

## Interface
- [cacheOps.js] `matchWorkflowId` (function)
- [cacheOps.js] `matchFolderId` (function)
- [cacheOps.js] `removeById` (function)
- [cacheOps.js] `patchWorkflowFolder` (function)
- [cacheOps.js] `patchFolderParent` (function)
- [cacheOps.js] `patchFolderName` (function)
- [cacheOps.js] `updateMediaById` (function)
- [entityKeys.js] `folderEntity` (const)
- [entityKeys.js] `workflowEntity` (const)
- [entityKeys.js] `mediaEntity` (const)
- [entityKeys.js] `projectEntity` (const)
- [entityTracker.js] `beginEntity` (function)
- [entityTracker.js] `endEntity` (function)
- [entityTracker.js] `inFlightCount` (function)
- [entityTracker.js] `isLatest` (function)
- [entityTracker.js] `deferInvalidation` (function)
- [entityTracker.js] `takeDeferred` (function)
- [entityTracker.js] `uniqueKeys` (function)
- [index.js] `useOptimisticMutation` (re-export)
- [index.js] `default` (re-export)
- [index.js] `notifyOptimisticError` (re-export)
- [notifyOptimisticError.js] `notifyOptimisticError` (function)
- [useOptimisticMutation.js] `useOptimisticMutation` (function)
- [useOptimisticMutation.js] `default` (default export)

## Invariants
- [cacheOps.js] Preserves optimistic rollback invariants on mutation failure.
- [entityKeys.js] Preserves optimistic rollback invariants on mutation failure.
- [entityTracker.js] Preserves optimistic rollback invariants on mutation failure.
- [index.js] Preserves optimistic rollback invariants on mutation failure.
- [notifyOptimisticError.js] Preserves optimistic rollback invariants on mutation failure.
- [useOptimisticMutation.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useOptimisticMutation.js] Mutates React Query cache.

## Verification
- Run: `npm test`
