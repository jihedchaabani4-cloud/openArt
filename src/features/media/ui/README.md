# ui

## Overview
Component package providing implementations for `src/features/media/ui`.

## Interface
- [AssetListItem.jsx] `AssetListItem` (function)
- [MediaCard.jsx] `MediaCard` (const)
- [MediaCard.jsx] `default` (default export)
- [MediaChip.jsx] `MediaChip` (const)
- [MediaChip.jsx] `default` (default export)
- [MediaHero.jsx] `MediaHero` (const)
- [MediaHero.jsx] `default` (default export)
- [MediaRenderer.jsx] `MediaRenderer` (const)
- [MediaRenderer.jsx] `default` (default export)
- [MediaTile.jsx] `MediaTile` (const)
- [MediaTile.jsx] `default` (default export)
- [MediaView.jsx] `CoreMediaItemPresenter` (const)
- [MediaView.jsx] `MediaView` (const)
- [MediaView.jsx] `CoreMediaItemView` (const)
- [MediaView.jsx] `default` (default export)
- [MediaViewCard.jsx] `MediaViewCard` (const)
- [SharedGalleryGrid.jsx] `resolveCachedMediaItem` (function)
- [SharedGalleryGrid.jsx] `resolveCachedWorkflowMediaItem` (function)
- [SharedGalleryGrid.jsx] `SharedGalleryGrid` (const)
- [SharedGalleryGrid.jsx] `default` (default export)

### Subdirectories
- **[ImportMediaDialog](./ImportMediaDialog/README.md)**

## Invariants
- [MediaRenderer.jsx] Guard clauses return `null` when required state or props are absent.
- [MediaView.jsx] Guard clauses return `null` when required state or props are absent.
- [SharedGalleryGrid.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [MediaViewCard.jsx] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
