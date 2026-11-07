# core

## Overview
Component package providing implementations for `src/features/prompt-bar/model/core`.

## Interface
- [promptBarLayout.js] `PROMPT_BAR_VARIANTS` (const)
- [promptBarLayout.js] `getPromptBarVariant` (function)
- [promptBarLayout.js] `getPromptBarContainerClassName` (function)
- [promptBarLayout.js] `getPromptBarContentClassName` (function)
- [promptBarRules.js] `normalizeGenerationMode` (function)
- [promptBarRules.js] `isMotionMode` (function)
- [promptBarRules.js] `isVideoMode` (function)
- [promptBarRules.js] `isSlottedReferenceMode` (function)
- [promptBarRules.js] `isVideoAsset` (function)
- [promptBarRules.js] `getReferenceAssetKey` (function)
- [promptBarRules.js] `cleanMediaAssetTags` (function)
- [promptBarRules.js] `cleanAllMediaAssetTags` (function)
- [promptBarRules.js] `getGenerationSection` (function)
- [promptBarRules.js] `resolveGenerationReferenceRole` (function)
- [promptBarRules.js] `shouldAllowReferenceAdd` (function)
- [promptBarRules.js] `resolveGenerationSectionMode` (function)

## Invariants
- None

## Side Effects
- None

## Verification
- Run: `npm test`
