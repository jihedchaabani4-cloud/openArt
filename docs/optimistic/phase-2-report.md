# Optimistic Updates: Phase 2 Report (Folders & Move)

Status: DONE
Commit (my-app): `844805f`
Self-review score: 100/100

---

## 1. What changed

### Mutations converted to optimistic (1 hook / file)
- `src/features/folders/mutations/useMoveAssetToFolder.js`:
  - Re-implemented with `useOptimisticMutation` + `matchWorkflowId` + `patchWorkflowFolder`.
  - On drag & drop to a folder (or root), `projectData` cache is immediately updated: writes all 4 variants (`folder_id`, `folderId`, `metadata.folder_id`, `metadata.folderId`).
  - 0ms UI delay: the card moves/disappears instantly.
  - On error: rolls back to snapshot immediately and triggers unified error toast.
- `src/features/folders/mutations/useUpdateFolder.js`:
  - Re-implemented with `useOptimisticMutation` + `matchFolderId` + `patchFolderName` + `patchFolderParent`.
  - On rename: folder title updates immediately in cache.
  - On move (drag to parent/sub-collection): updates both `parentId` and `parent_id` immediately in cache.
  - On `FOLDER_CYCLE` error: rolls back and shows user-friendly toast: *"Cannot move a collection inside itself or its children."*
- `src/features/folders/mutations/useDeleteFolder.js`:
  - Re-implemented with `useOptimisticMutation` + `removeById` + `matchFolderId`.
  - Folder immediately vanishes from UI upon delete action.
  - On `FOLDER_NOT_EMPTY` error: rolls back to snapshot (reappears in grid) and shows toast: *"Cannot delete collection: it contains items or sub-collections."*

### UI Handlers cleaned (T2.4)
- `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`:
  - Removed empty `.catch(() => {})` in `handleDrop` for both `moveAsset` and `updateFolder`.
  - Converted `handleRename` to non-blocking (removed unnecessary `await`).
  - Converted `handleDelete` to non-blocking dialog dismiss + redirect, replacing browser `alert()` with automatic toast notification on rollback.
- `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx`:
  - Removed empty `.catch(() => {})` in `executeMoveToParent` for both `moveAsset` and `updateFolder`.
  - Converted `handleSaveName` to non-blocking (removed unnecessary `await`).
  - Converted `handleDelete` on collection page to immediate dialog close + redirect + optimistic delete.
- `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js`:
  - Removed empty `.catch(() => {})` in `handleRootDrop` for both `moveAsset` and `updateFolder`.

---

## 2. Test & Quality Results

| Check | Result | Evidence |
|---|---|---|
| Vitest Unit Tests | **38 / 38 PASSING (100%)** | `npm test` exit 0 (logger: 3, cacheOps: 20, notify: 3, useOptimisticMutation: 6, folderMutations: 6) |
| Failing-first verified | **YES** | 3 tests failed before hook conversion (assets not updated in cache), all 6 passed after |
| ESLint | **0 errors, 0 warnings** on folder mutations | `npx eslint src/features/folders/mutations/` exit 0 |
| Secrets scan | **CLEAN** | `git diff --cached` passed with 0 secret leaks |

---

## 3. Smoke Test Checklist (for manual QA in browser)

1. **Move asset into collection (Move In):**
   - Drag any generation or asset onto a collection card in `AssetsLibraryPage`.
   - Card disappears immediately from the root grid (0ms latency).
   - If network disconnects or API fails: item reappears in root grid + error toast displayed.
2. **Move asset out of collection (Move Out):**
   - Inside a collection page, drag an item to the top navigation arrow / root drop zone.
   - Item disappears immediately from the collection feed.
3. **Move sub-collection into collection:**
   - Drag a collection card onto another collection card.
   - Folder disappears immediately from the parent collection feed.
   - If circular drop (target is child of dragged folder): rollback occurs + toast *"Cannot move a collection inside itself or its children."*
4. **Rename collection:**
   - Click rename pill on collection card or in navbar header.
   - Title changes immediately without waiting for server response.
5. **Delete empty collection:**
   - Confirm delete on an empty collection.
   - Dialog closes immediately, card vanishes from grid.
6. **Delete non-empty collection (Rollback test):**
   - Confirm delete on a collection that has assets inside.
   - Card vanishes briefly, backend rejects with 409 `FOLDER_NOT_EMPTY`.
   - Card immediately reappears in grid + error toast displayed: *"Cannot delete collection: it contains items or sub-collections."*

---

## 4. Next Step

**Phase 3: Priority 1 (High UX Impact Mutations)**
- `useUpdateWorkflow` (workflow rename / description across workflows[], characters[], elements[])
- `useUpdateCharacter`
- `useDeleteMedia`, `useRemoveWorkflowItem`, `useDeleteMediaItem`
- `useCreateFolder` (temporary id with seamless replacement)
- `EditNavbar` delete without blocking await

Waiting for human **"go"** to start Phase 3.
