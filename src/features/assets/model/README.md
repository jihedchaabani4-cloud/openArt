# model

## Overview
Component package providing implementations for `src/features/assets/model`.

## Interface
- [assetsFilters.js] `MEDIA_FILTERS` (const)
- [assetsFilters.js] `CATEGORY_FILTERS` (const)
- [assetsFilters.js] `AssetsFiltersProvider` (function)
- [assetsFilters.js] `useAssetsFilters` (function)
- [assetsLibrary.js] `PAGE_SIZE` (const)
- [assetsLibrary.js] `isVideoUrl` (function)
- [assetsLibrary.js] `resolveLibraryEntryMedia` (function)
- [assetsLibrary.js] `getEntryTimestamp` (function)
- [assetsLibrary.js] `formatDateHeading` (function)
- [assetsLibrary.js] `resolveLibraryCategory` (function)
- [assetsLibrary.js] `filterLibraryItems` (function)
- [assetsLibrary.js] `buildGroupedPhotos` (function)
- [assetsLibrary.js] `buildDownloadFilename` (function)
- [assetsLibrary.js] `buildAssetsZipFilename` (function)
- [useAssetsSelection.js] `useAssetsSelection` (function)

## Invariants
- [assetsFilters.js] Throws error on invalid arguments or missing context.

## Side Effects
- None

## Verification
- Run: `npm test`
