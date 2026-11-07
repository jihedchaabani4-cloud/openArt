# model

## Overview
Component package providing implementations for `src/features/folders/model`.

## Interface
- [useDownloadCollection.js] `downloadCollectionAsZip` (function)
- [useDownloadCollection.js] `useDownloadCollection` (function)
- [useFolderMove.js] `getParentFolderId` (function)
- [useFolderMove.js] `resolveMoveOutTarget` (function)
- [useFolderMove.js] `parseTransferPayload` (function)
- [useFolderMove.js] `useFolderMove` (function)
- [useFolderMove.js] `default` (default export)

## Invariants
- [useDownloadCollection.js] Throws error on invalid arguments or missing context.
- [useDownloadCollection.js] Guard clauses return `null` when required state or props are absent.
- [useFolderMove.js] Throws error on invalid arguments or missing context.
- [useFolderMove.js] Guard clauses return `null` when required state or props are absent.
- [useFolderMove.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- None

## Verification
- Run: `npm test`
