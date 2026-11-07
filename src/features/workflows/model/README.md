# model

## Overview
Component package providing implementations for `src/features/workflows/model`.

## Interface
- [domainNormalizer.js] `DOMAIN_TYPES` (const)
- [domainNormalizer.js] `MEDIA_STATUS` (const)
- [domainNormalizer.js] `normalizeDomainType` (function)
- [domainNormalizer.js] `getWorkflowDomainType` (function)
- [domainNormalizer.js] `isElementWorkflow` (function)
- [domainNormalizer.js] `isCharacterWorkflow` (function)
- [domainNormalizer.js] `isUploadWorkflow` (function)
- [domainNormalizer.js] `isGenerationWorkflow` (function)
- [domainNormalizer.js] `normalizeMediaStatus` (function)
- [domainNormalizer.js] `normalizeWorkflow` (function)
- [domainNormalizer.js] `normalizeMedia` (function)
- [domainNormalizer.js] `normalizeProjectContents` (function)
- [domainNormalizer.js] `normalizeProjectData` (function)
- [elementSheetConfig.js] `ELEMENT_TYPES` (const)
- [elementSheetConfig.js] `ELEMENT_SHEET_CONFIGS` (const)
- [elementSheetConfig.js] `isElementSheetMode` (function)
- [elementSheetConfig.js] `getElementSheetConfig` (function)
- [elementSheetConfig.js] `normalizeElementMode` (function)
- [elementSheetConfig.js] `normalizeElementReferences` (function)
- [elementSheetConfig.js] `buildElementPrompt` (function)
- [elementSheetConfig.js] `buildElementSheetDraft` (function)
- [elementSheetConfig.js] `syncElementDraft` (function)
- [mediaCacheIndex.js] `buildProjectMediaIndex` (function)
- [mediaCacheIndex.js] `default` (default export)
- [selectStudioWorkflows.js] `groupMediaByWorkflow` (function)
- [selectStudioWorkflows.js] `resolveConfig` (function)
- [selectStudioWorkflows.js] `selectStudioWorkflows` (function)
- [useFilteredWorkflows.js] `selectStudioWorkflows` (re-export)
- [useFilteredWorkflows.js] `useFilteredWorkflows` (function)
- [useFilteredWorkflows.js] `useFilteredGenerations` (const)
- [useMediaActions.js] `useWorkflowActions` (function)
- [useResolvedMedia.js] `useResolvedMedia` (function)
- [useResolvedMedia.js] `default` (default export)
- [useStudioWorkflows.js] `useStudioWorkflows` (function)
- [useStudioWorkflows.js] `default` (default export)
- [useWorkflowDelete.js] `useWorkflowDelete` (function)
- [useWorkflowDelete.js] `default` (default export)
- [useWorkflowsStore.js] `useWorkflowUiStore` (re-export)
- [useWorkflowsStore.js] `useWorkflowsStore` (const)
- [useWorkflowsStore.js] `useGenerationsStore` (const)
- [useWorkflowsStore.js] `default` (default export)
- [useWorkflowUiStore.js] `useWorkflowUiStore` (const)

## Invariants
- [elementSheetConfig.js] Guard clauses return `null` when required state or props are absent.
- [useMediaActions.js] Guard clauses return `null` when required state or props are absent.
- [useWorkflowDelete.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [useWorkflowUiStore.js] Mutates Zustand global store state.

## Verification
- Run: `npm test`
