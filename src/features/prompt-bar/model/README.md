# model

## Overview
Component package providing implementations for `src/features/prompt-bar/model`.

## Interface
- [feature-constants.js] `createEmptyFeatures` (function)
- [feature-constants.js] `clearFeatureSelection` (function)
- [feature-constants.js] `applyFeatureSelection` (function)
- [feature-constants.js] `mergeElementFeatures` (function)
- [feature-constants.js] `resolveFeatureEditorSelection` (function)
- [feature-constants.js] `TABS` (const)
- [feature-constants.js] `IDENTITY_SUB_TABS` (const)
- [feature-constants.js] `HEAD_SUB_TABS` (const)
- [feature-constants.js] `DETAILS_SUB_TABS` (const)
- [feature-constants.js] `ERA_STEPS` (const)
- [feature-constants.js] `AGE_STEPS` (const)
- [feature-constants.js] `HEIGHT_STEPS` (const)
- [feature-constants.js] `CHARACTER_TYPE_OPTIONS` (const)
- [feature-constants.js] `IDENTITY_OPTIONS` (const)
- [feature-constants.js] `HEAD_OPTIONS` (const)
- [feature-constants.js] `DETAILS_OPTIONS` (const)
- [feature-constants.js] `OUTFIT_OPTIONS` (const)
- [feature-constants.js] `RENDERING_STYLE_OPTIONS` (const)
- [feature-constants.js] `getFeatureInfo` (function)
- [feature-constants.js] `getFeatureInfoFromLabel` (function)
- [feature-constants.js] `extractFeaturesFromPrompt` (function)
- [useCharacterStore.js] `useCharacterStore` (const)
- [useCharacterStore.js] `useElementStore` (const)
- [useCharacterStore.js] `default` (default export)
- [useElementStore.js] `useCharacterStore` (re-export)
- [useElementStore.js] `useElementStore` (re-export)
- [useElementStore.js] `default` (re-export)
- [useLibraryFilter.js] `extractIdentifyingKeys` (function)
- [useLibraryFilter.js] `useLibraryFilter` (function)
- [usePromptStore.js] `usePromptStore` (const)

### Subdirectories
- **[core](./core/README.md)**

## Invariants
- [feature-constants.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [useCharacterStore.js] Mutates Zustand global store state.
- [usePromptStore.js] Mutates Zustand global store state.

## Verification
- Run: `npm test`
