# Phase 5 Report — Known bugs

**Commit:** `d8c439b` (my-app) · **Tests:** 52/52 (was 49, +3) · ESLint: 0 errors on touched files · build not run (dev server holds `.next/`, per user instruction).

## Tasks

| Task | File | Change |
|---|---|---|
| T5.1 | `features/characters/hooks/useRemoveMediaFromCharacter.js` | Was pessimistic (onSuccess invalidate only). Now `useOptimisticMutation`: media removed from `projectContents.media` immediately, snapshot restored + toast on API error. (`removeDetailImage` in `useCharacter.js` calls this hook, so the desync is fixed at the source.) |
| T5.2 | `features/media/api/mutations/useBatchUploadAssets.js` | Optimistic workflow now writes `folder_id`, `folderId`, `metadata.folder_id`, `metadata.folderId` (same contract as `patchWorkflowFolder`). |
| T5.3 | 6 files | `console.error` → `logger.error(event, { error })` in `useWorkflowDelete`, `useGenerateMutation`, `useCreateCharacterMutation`, `useGenerateCharacterSheetMutation`, `useCreateElementSheetMutation`, `InlineRenamePill`. |
| T5.4 | `features/workflows/api/mutations/useMoveWorkflow.js` | `@deprecated` JSDoc pointing to `useMoveAssetToFolder`. Not removed (public export contract). |

## Failing-first proof
`phase5Bugs.test.jsx` run against the pre-fix versions of the two hooks: **2 failed / 1 passed** (the rollback test passes trivially on old code since nothing was removed). After fix: 3/3.

## Security note
`variables` are **not** logged in `useGenerateMutation`, `useCreateCharacterMutation`, `useCreateElementSheetMutation`: their payloads contain user prompts (AGENTS.md: never log prompts). Only `{ error }` is logged.

## Noticed, not done
- `notifyOptimisticError` (Phase 1) logs `variables` of every optimistic mutation. Current optimistic hooks only pass ids/names, but a future hook with a prompt in its variables would leak it. Suggest: whitelist fields (ids only) in a later task.
- Remaining `console.*` outside the initiative's touched files (~60 sites): `shared/api/client.js`, `ElementVisionService.js`, `useCharacter.js`, `useElementEdit.js`, `useCreateElementForm.js`, `characterService.js`, `mediaReferenceService.js`, `usePromptStore.js`, `PromptBarPlatform.jsx`, `PromptEditor.jsx`, app `page.js`/`route.js` files, `StudioNavbarLeft.jsx`, `ImportMediaPopover.jsx`, `NavbarImportButton.jsx`, `AssetsLibraryPage.jsx`, `ProjectError.jsx`, `downloadMediaItem.js`, `utils.js`, `useRealBackendModels.js`, `useExtendVideoMutation.js`, `useUpdateElementMetadata.js`. Separate task.
- Optimistic upload *media items* still write only `folder_id` (not `folderId`). Out of the T5.2 scope (workflow entry).
- Working tree contains unrelated uncommitted changes (`client.js`, `displayUtils.js`, StudioNavbar widgets, `ConfirmDeleteDialog`, `assets/page.js`, …) — not mine, not staged.
