# media

## Overview
Component package providing implementations for `src/features/media`.

## Interface
- [index.js] `useMediaStore` (re-export)
- [index.js] `useUploadMedia` (re-export)
- [index.js] `uploadMediaAsset` (re-export)
- [index.js] `validateBatchCount` (re-export)
- [index.js] `MediaRenderer` (re-export)
- [index.js] `MediaCard` (re-export)
- [index.js] `MediaTile` (re-export)
- [index.js] `MediaHero` (re-export)
- [index.js] `MediaChip` (re-export)
- [index.js] `MediaView` (re-export)
- [index.js] `MediaViewCard` (re-export)
- [index.js] `SharedGalleryGrid` (re-export)
- [index.js] `AssetListItem` (re-export)
- [index.js] `ImportMediaPopover` (re-export)
- [index.js] `ImportMediaListView` (re-export)
- [uploadPolicy.js] `MAX_BATCH_UPLOAD_FILES` (const)
- [uploadPolicy.js] `BATCH_UPLOAD_CONCURRENCY` (const)
- [uploadPolicy.js] `DEFAULT_UPLOAD_POLICY` (const)
- [uploadPolicy.js] `ELEMENT_REFERENCE_UPLOAD_POLICY` (const)
- [uploadPolicy.js] `ELEMENT_SHEET_UPLOAD_POLICY` (const)
- [uploadPolicy.js] `CHARACTER_SHEET_UPLOAD_POLICY` (const)
- [uploadPolicy.js] `CHARACTER_DETAIL_UPLOAD_POLICY` (const)
- [uploadPolicy.js] `UPLOAD_POLICIES` (const)
- [uploadPolicy.js] `getAcceptedMimeTypes` (function)
- [uploadPolicy.js] `validateFilesAgainstPolicy` (function)
- [uploadPolicy.js] `default` (default export)

### Subdirectories
- **[api](./api/README.md)**
- **[model](./model/README.md)**
- **[ui](./ui/README.md)**

## Invariants
- None

## Side Effects
- None

## Verification
- Run: `npm test`
