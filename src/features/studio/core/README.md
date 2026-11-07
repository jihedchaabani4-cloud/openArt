# core

## Overview
Component package providing implementations for `src/features/studio/core`.

## Interface
- [mediaReferenceService.js] `setPendingPromptAction` (function)
- [mediaReferenceService.js] `consumePendingPromptAction` (function)
- [mediaReferenceService.js] `canAnyModelAcceptEntity` (function)
- [mediaReferenceService.js] `findBestModelForEntity` (function)
- [mediaReferenceService.js] `normalizeMediaAsset` (function)
- [mediaReferenceService.js] `addMediaToPrompt` (function)
- [mediaReferenceService.js] `animateMedia` (function)

## Invariants
- [mediaReferenceService.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [mediaReferenceService.js] Reads/writes client browser storage.

## Verification
- Run: `npm test`
