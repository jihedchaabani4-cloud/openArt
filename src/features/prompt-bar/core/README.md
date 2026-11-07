# core

## Overview
Component package providing implementations for `src/features/prompt-bar/core`.

## Interface
- [commandResult.js] `REASONS` (const)
- [commandResult.js] `ok` (function)
- [commandResult.js] `fail` (function)
- [composite.js] `applyComposite` (function)
- [creditCalculationService.js] `calculateModelCredits` (function)
- [creditCalculationService.js] `formatCredits` (function)
- [entityService.js] `normalizeEntity` (function)
- [entityService.js] `addEntity` (function)
- [entityService.js] `removeEntity` (function)
- [entityService.js] `extractEntityIds` (function)
- [entityService.js] `removeEntityWithPromptClean` (function)
- [entityService.js] `getEntityImageCount` (function)
- [entityService.js] `calculateUsedImages` (function)
- [entityService.js] `canAddReference` (function)
- [initialization.js] `initializeFromType` (function)
- [media.js] `getModelReferenceCapability` (re-export)
- [media.js] `getActiveSlots` (function)
- [media.js] `getSlotMaxRefs` (function)
- [media.js] `countUsedRefs` (function)
- [media.js] `remainingQuota` (function)
- [media.js] `allowedTypeForSlot` (function)
- [media.js] `canAttach` (function)
- [media.js] `pruneMedia` (function)
- [mediaRef.js] `getAssetId` (function)
- [mediaRef.js] `sameAsset` (function)
- [mediaRef.js] `isPersistableMedia` (function)
- [mediaRef.js] `resolveMediaUrl` (function)
- [mediaRef.js] `describeMedia` (function)
- [modelManagement.js] `adaptBackendParameter` (function)
- [modelManagement.js] `MODEL_ICON_MAP` (const)
- [modelManagement.js] `resolveModelIcon` (function)
- [modelManagement.js] `adaptBackendModel` (function)
- [modelManagement.js] `adaptBackendCatalog` (function)
- [modelManagement.js] `getModelReferenceCapability` (function)
- [parameterKeys.js] `PARAM` (const)
- [parameterKeys.js] `MEDIA_TYPES` (const)
- [parameterKeys.js] `isMediaType` (function)
- [parameterState.js] `initializeValues` (function)
- [parameterState.js] `setValue` (function)
- [parameterState.js] `getActiveDefinitions` (function)
- [reconciliation.js] `validateParameter` (function)
- [reconciliation.js] `reconcile` (function)
- [serialization.js] `extractWorkflowId` (function)
- [serialization.js] `serialize` (function)
- [tagsResolver.js] `serializeTag` (function)
- [tagsResolver.js] `parsePromptTags` (function)
- [tagsResolver.js] `resolveTagsWithReferences` (function)
- [tagsService.js] `TAG_REGEX` (const)
- [tagsService.js] `getAssetId` (re-export)
- [tagsService.js] `cleanTagsForAsset` (function)
- [tagsService.js] `cleanAllTags` (function)
- [tagsService.js] `isAssetReferencedInPrompt` (function)
- [tagsService.js] `getActiveReferences` (function)
- [tagsService.js] `autoAssignReference` (function)
- [templateContract.js] `defineTemplate` (function)
- [types.js] `SUPPORTED_PARAMETER_TYPES` (const)
- [types.js] `normalizeParameterDefinition` (function)
- [useRealBackendModels.js] `useRealBackendModels` (re-export)

## Invariants
- [commandResult.js] Throws error on invalid arguments or missing context.
- [entityService.js] Guard clauses return `null` when required state or props are absent.
- [mediaRef.js] Guard clauses return `null` when required state or props are absent.
- [serialization.js] Guard clauses return `null` when required state or props are absent.
- [templateContract.js] Throws error on invalid arguments or missing context.

## Side Effects
- None

## Verification
- Run: `npm test`
