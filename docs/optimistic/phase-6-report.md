# Phase 6 Report — Race conditions

**Commit:** `e298557` (my-app) · **Tests:** 56/56 (was 52, +4 new, 1 rewritten) · ESLint: 0 errors · build not run (per user instruction).

## Bug found: the Phase 1 guard never fired
`onSettled` skipped invalidation when `queryClient.isMutating({ mutationKey: getMutationKey(vars) }) > 1`.
But `getMutationKey` was **never passed to `useMutation`** (a hook registers one static key), so `isMutating` always returned 0 for those keys. The unit test hid it by mocking `isMutating` to return 2.
Also, each hook used its own key (`["moveAsset", id]`, `["deleteFolder", id]`…), so move and delete on the same item could never see each other anyway.

Failing-first proof: `raceConditions.test.jsx` against the old wrapper → 2 failed (stale item refetched back during a pending delete; failing first rename wiped the two newer renames back to `"A"`).

## Fix
| File | Role |
|---|---|
| `shared/lib/optimistic/entityTracker.js` (new) | Per-`QueryClient` (WeakMap) counter: in-flight count + start sequence per entity, plus deferred invalidation keys. |
| `shared/lib/optimistic/entityKeys.js` (new) | ONE key format per entity: `folderEntity(id)`, `workflowEntity(id)` (prefix stripped), `mediaEntity(id)`. |
| `shared/lib/optimistic/useOptimisticMutation.js` | New `getEntityKey` option (`getMutationKey` kept as legacy alias). Rules below. |
| 10 hooks | `getMutationKey: [hook-specific]` → `getEntityKey: <shared builder>` (+2/−1 lines each). |

### Rules (documented in the wrapper header)
1. **Invalidation:** only the last in-flight mutation on an entity invalidates. Earlier settlers hand their keys over (`deferInvalidation`), and the last one invalidates its own + deferred keys, deduplicated.
2. **Rollback:** a failing mutation restores its snapshot only if it is alone **and** no newer mutation started after it. Otherwise restoring would wipe newer optimistic changes; the last settler's refetch brings the server truth. The error toast is always shown.
3. The tracker slot is released in `finally` (and on an `onMutate` throw), so an entity can never be stuck "in flight".

### Entity mapping
- `folderEntity`: `useUpdateFolder`, `useDeleteFolder`
- `workflowEntity`: `useMoveAssetToFolder`, `useUpdateWorkflow`, `useUpdateCharacter`, `useSetPrimaryMedia`
- `mediaEntity`: `useDeleteMedia`, `useDeleteMediaItem`, `useDetachMedia`, `useRemoveWorkflowItem`

## Tests
- T6.1 move → delete on the same folder: no refetch while the delete is pending; final = server.
- T6.2 three rapid renames, first fails: newer state kept, toast shown, a single refetch at the end, final = server.
- Lone failure still rolls back. Different entities do not block each other.
- Rewritten: the old `isMutating`-mocked test → real two-mutation scenario.

## Noticed, not done
- Cross-entity conflicts are not coordinated (e.g. move workflow **into** a folder that is being deleted: `workflowEntity` vs `folderEntity`). Would need multi-key entities.
- Hand-rolled optimistic hooks outside the wrapper (`useRemoveWorkflow`, `useWorkflowDelete`, `useToggleLike`, `useBatchUploadAssets`, `useGenerateMutation`…) do not join the tracker. Delete-workflow vs rename-workflow can still race.
- `useCreateFolder`, Phase 4 blob hooks and `useRemoveMediaFromCharacter` have no entity key (creates / low-conflict); could take `mediaEntity` later.
- `entityKeys.js` (shared) imports `stripWorkflowPrefix` from `features/` — same precedent as `cacheOps.js`, but it is an FSD layer inversion; moving `stripWorkflowPrefix` to shared would be a separate refactor.
