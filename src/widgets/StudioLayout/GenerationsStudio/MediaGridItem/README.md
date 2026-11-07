# MediaGridItem

## Overview
Component package providing implementations for `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem`.

## Interface
- [ActionBtn.jsx] `ActionBtn` (re-export)
- [ActionBtn.jsx] `default` (re-export)
- [CollectionMediaGridItem.jsx] `CollectionMediaGridItem` (const)
- [CollectionMediaGridItem.jsx] `CollectionGridItem` (re-export)
- [CollectionMediaGridItem.jsx] `default` (default export)
- [constants.js] `spring` (const)
- [constants.js] `springGentle` (const)
- [constants.js] `fadeEase` (const)
- [constants.js] `slideEase` (const)
- [constants.js] `iconCls` (const)
- [index.js] `MediaGridItem` (re-export)
- [index.js] `CollectionMediaGridItem` (re-export)
- [index.js] `CollectionGridItem` (re-export)
- [index.js] `StudioMediaGridCard` (re-export)
- [index.js] `TrashMediaGridCard` (re-export)
- [index.js] `WorkflowMediaGridItem` (re-export)
- [index.js] `CoreMediaItemView` (re-export)
- [index.js] `StudioItemDropdownMenu` (re-export)
- [index.js] `StudioContextMenuContent` (re-export)
- [index.js] `getStudioMenuItems` (re-export)
- [index.js] `getWorkflowEntityType` (re-export)
- [MediaGridItem.jsx] `WorkflowMediaGridItem` (const)
- [MediaGridItem.jsx] `MediaGridItem` (const)
- [MediaGridItem.jsx] `CollectionMediaGridItem` (re-export)
- [MediaGridItem.jsx] `CollectionGridItem` (re-export)
- [MediaGridItem.jsx] `StudioMediaGridCard` (re-export)
- [MediaGridItem.jsx] `TrashMediaGridCard` (re-export)
- [MediaGridItem.jsx] `default` (default export)
- [StudioItemMenu.jsx] `StudioItemDropdownMenu` (function)
- [StudioItemMenu.jsx] `StudioContextMenuContent` (function)
- [StudioMediaGridCard.jsx] `StudioMediaGridCard` (const)
- [StudioMediaGridCard.jsx] `default` (default export)
- [studioMenuConfig.js] `getWorkflowEntityType` (function)
- [studioMenuConfig.js] `getStudioMenuItems` (function)
- [TrashMediaGridCard.jsx] `TrashMediaGridCard` (const)
- [TrashMediaGridCard.jsx] `default` (default export)
- [trashMenuConfig.js] `getTrashMenuItems` (function)

## Invariants
- [StudioMediaGridCard.jsx] Guard clauses return `null` when required state or props are absent.
- [TrashMediaGridCard.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [CollectionMediaGridItem.jsx] Registers global window/DOM event listeners.
- [StudioMediaGridCard.jsx] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
