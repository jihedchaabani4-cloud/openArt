# Phase 4 Report — Optimistic Priority 2 mutations

**Commit:** `fec7786` (my-app)
**Tests:** 49/49 passing (was 43/43 before, +6)

## Hooks converted

| Hook | File | What |
|---|---|---|
| `useSetPrimaryMedia` | `features/workflows/api/mutations/useSetPrimaryMedia.js` | Writes `primary_media_id` + `primaryMediaId` + `metadata.primaryMediaId` in the matching workflow; rolls back on error |
| `useDetachMedia` | `features/workflows/api/mutations/useDetachMedia.js` | Injects `tempWfId` via `userOnMutate`; prepends new standalone workflow to `workflows[]`; reassigns `media[].workflowId`; invalidate replaces temp object with real on success |
| `useAddImageToElement` | `features/elements/hooks/useAddImageToElement.js` | `URL.createObjectURL(file)` in `userOnMutate`; prepends optimistic media entry (`status:"uploading"`) to `projectContents.media`; `URL.revokeObjectURL` in `userOnSettled` |
| `useAddMediaToCharacter` | `features/characters/hooks/useAddMediaToCharacter.js` | Same blob-preview pattern; sets `characterId` / `character_id` on optimistic entry |
| `useSetCharacterSheetMedia` | `features/characters/hooks/useSetCharacterSheetMedia.js` | Same blob-preview pattern; sets `is_sheet: true` on optimistic entry |

## Pattern used

All three blob-preview hooks follow the `useBatchUploadAssets` reference exactly:

```
onMutate (userOnMutate):
  URL.createObjectURL(file) → localUrl
  variables._localUrl = localUrl          ← makes localUrl available to applyOptimistic
  return { localUrl }                     ← stored as userContext

applyOptimistic(old, { _localUrl, ... }):
  prepend optimistic media entry with status: "uploading"

onSettled (userOnSettled) receives userContext:
  URL.revokeObjectURL(context.localUrl)   ← always called, success or error
```

Cold-cache safety: if `previousData === undefined`, `applyOptimistic` is not called (no phantom entries created).

## Context passing note

`useOptimisticMutation` passes `context.userContext` (the return value of `userOnMutate`) as the 4th argument to `userOnSettled`. So `context.localUrl` in the hook `onSettled` is correctly `userContext.localUrl`.

## Noticed, not done

- `useAddImageToElement` still supports `imageUrl` / `mediaId` (non-file path) — these paths don't create blob previews (intentional: only file uploads need it).
- `useBatchUploadAssets` does `setCachedImageDimensions(localUrl, ...)` for the dimension cache — not replicated in these simpler hooks (out of scope for Phase 4).

## Remaining phases

- **Phase 5** — Known bugs: `removeDetailImage` rollback, `useBatchUploadAssets` missing `metadata.folder_id`, console.* → logger, dead `useMoveWorkflow` stub.
- **Phase 6** — Race conditions.
- **Phase 7** (optional) — Projects.
