# lib

## Overview
Component package providing implementations for `src/shared/lib`.

## Interface
- [AuthGuard.jsx] `AuthGuard` (function)
- [AuthSessionBootstrap.jsx] `AuthSessionBootstrap` (function)
- [displayUtils.js] `STUDIO_GRID_SPACING_CONFIG` (const)
- [displayUtils.js] `getStudioGridSpacingPx` (function)
- [displayUtils.js] `STUDIO_GRID_CONFIG` (const)
- [displayUtils.js] `getCachedImageDimensions` (function)
- [displayUtils.js] `setCachedImageDimensions` (function)
- [displayUtils.js] `getStudioGridDensity` (function)
- [displayUtils.js] `getGridClass` (function)
- [displayUtils.js] `formatGenerationDate` (function)
- [displayUtils.js] `formatPromptForDisplay` (function)
- [displayUtils.js] `getItemMetadata` (function)
- [displayUtils.js] `intrinsicSizeToRatioLabel` (function)
- [displayUtils.js] `intrinsicSizeToCssAspect` (function)
- [displayUtils.js] `getPrimaryMedia` (function)
- [displayUtils.js] `getPrimaryMediaConfig` (function)
- [displayUtils.js] `resolveMediaUrl` (function)
- [displayUtils.js] `isMediaVideo` (function)
- [displayUtils.js] `getWorkflowFolderId` (function)
- [displayUtils.js] `buildCollectionCoverById` (function)
- [generationUtils.js] `getGenerationConfig` (re-export)
- [generationUtils.js] `getGridClass` (re-export)
- [generationUtils.js] `formatGenerationDate` (re-export)
- [generationUtils.js] `formatPromptForDisplay` (re-export)
- [generationUtils.js] `getItemMetadata` (re-export)
- [generationUtils.js] `getPrimaryMedia` (re-export)
- [generationUtils.js] `getPrimaryMediaConfig` (re-export)
- [generationUtils.js] `intrinsicSizeToCssAspect` (re-export)
- [generationUtils.js] `intrinsicSizeToRatioLabel` (re-export)
- [generationUtils.js] `getCachedImageDimensions` (re-export)
- [generationUtils.js] `setCachedImageDimensions` (re-export)
- [logger.js] `logger` (const)
- [logger.js] `default` (default export)
- [ReactQueryProvider.jsx] `ReactQueryProvider` (function)
- [referenceUtils.js] `getGenerationConfig` (function)
- [utils.js] `cn` (function)
- [utils.js] `downloadBlob` (function)
- [utils.js] `downloadFile` (function)

### Subdirectories
- **[optimistic](./optimistic/README.md)**

## Invariants
- [AuthGuard.jsx] Guard clauses return `null` when required state or props are absent.
- [displayUtils.js] Guard clauses return `null` when required state or props are absent.
- [logger.js] Preserves optimistic rollback invariants on mutation failure.
- [referenceUtils.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
