# core

## Overview
Component package providing implementations for `src/features/workflows/core`.

## Interface
- [resolveMediaRef.js] `normalizeWorkflowType` (function)
- [resolveMediaRef.js] `getWorkflowPrimaryMediaId` (function)
- [resolveMediaRef.js] `pickUploadPrimaryMedia` (function)
- [resolveMediaRef.js] `pickGenerationPrimaryMedia` (function)
- [resolveMediaRef.js] `pickElementPrimaryMedia` (function)
- [resolveMediaRef.js] `pickCharacterPrimaryMedia` (function)
- [resolveMediaRef.js] `PICKERS` (const)
- [resolveMediaRef.js] `resolveMainMedia` (function)
- [resolveMediaRef.js] `resolveMediaRef` (function)
- [resolveMediaRef.js] `default` (default export)
- [toMediaItem.js] `resolveMediaUrl` (function)
- [toMediaItem.js] `resolveThumbUrl` (function)
- [toMediaItem.js] `normalizeRole` (function)
- [toMediaItem.js] `normalizeMediaStatus` (function)
- [toMediaItem.js] `isVideoMedia` (function)
- [toMediaItem.js] `toMediaItem` (function)
- [toMediaItem.js] `default` (default export)
- [useMediaViewerCore.js] `markMediaLoaded` (function)
- [useMediaViewerCore.js] `isMediaLoadedInCache` (function)
- [useMediaViewerCore.js] `formatMediaDuration` (function)
- [useMediaViewerCore.js] `useMediaViewerCore` (function)

## Invariants
- [resolveMediaRef.js] Guard clauses return `null` when required state or props are absent.
- [toMediaItem.js] Guard clauses return `null` when required state or props are absent.
- [useMediaViewerCore.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
