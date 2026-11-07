# CacheOps Audit — Phase 1 (T1.2)

Audit of pure cache operations defined in `shared/lib/optimistic/cacheOps.js` against existing inline expressions across `my-app/src`.
**Note:** In Phase 1, NO existing call sites are replaced yet. This audit inventories the exact expressions to be replaced in Phases 2+.

---

## 1. `matchWorkflowId(entity, targetId)`

### Implementation
```js
export function matchWorkflowId(entity, targetId) {
  if (!entity || isBlank(targetId)) return false;
  const target = stripWorkflowPrefix(targetId);
  if (target === "") return false;

  const entityId = !isBlank(entity.id) ? stripWorkflowPrefix(entity.id) : "";
  const entityName = !isBlank(entity.name) ? stripWorkflowPrefix(entity.name) : "";

  if (entity.id === targetId || entity.name === targetId) {
    return entityId === target || entityName === target;
  }

  return (entityId !== "" && entityId === target) || (entityName !== "" && entityName === target);
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/workflows/api/mutations/useUpdateWorkflow.js:28` | `const wCleanId = stripWorkflowPrefix(w.id \|\| w.name \|\| ''); if (wCleanId === cleanId)` | Identical matching logic. Helper also guards against empty string / null match. |
| `features/workflows/api/mutations/useRemoveWorkflow.js:40` | `wf => !idsToRemove.includes(wf.id) && !idsToRemove.includes(wf.name)` | **Flag:** Existing code only checked exact `id` and `name` without stripping `workflows/` prefix. Helper adds prefix-stripped equality check, which prevents desync if normalized ID is used. |
| `features/workflows/model/useWorkflowDelete.js:53` | `(wf) => wf.id !== workflowId && wf.name !== workflowId` | **Flag:** Existing code only checked raw id and name. Helper handles prefix stripping. |
| `features/characters/hooks/useUpdateCharacter.js:47` | `const wCleanId = stripWorkflowPrefix(w.id \|\| w.name \|\| ''); if (wCleanId === cleanId)` | Identical matching logic. |
| `features/elements/hooks/useUpdateElementMetadata.js:41` | `if (wf.id !== workflowId && wf.name !== workflowId) return wf;` | **Flag:** Existing code checked raw strings. Helper adds prefix stripping. |

---

## 2. `matchFolderId(folder, targetId)`

### Implementation
```js
export function matchFolderId(folder, folderId) {
  if (!folder || isBlank(folderId)) return false;
  return (folder.id || folder.folderId || folder._id) === folderId;
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/folders/api/foldersApi.js` (pre-revert git `1dd1e37:79`) | `const fId = folder.id \|\| folder.folderId \|\| folder._id; if (fId === folderId)` | Identical 3-field coalesce. |
| `features/folders/mutations/useUpdateFolder.js` (future Phase 2) | N/A (currently pessimistic) | Will match folder in `folders.byProject` cache query. |
| `features/folders/mutations/useDeleteFolder.js` (future Phase 2) | N/A (currently pessimistic) | Will filter out deleted folder in cache query. |

---

## 3. `removeById(list, id, match = matchWorkflowId)`

### Implementation
```js
export function removeById(list, id, match = matchWorkflowId) {
  if (!Array.isArray(list) || isBlank(id)) return list;
  const next = list.filter((item) => !match(item, id));
  return next.length === list.length ? list : next;
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/workflows/api/mutations/useRemoveWorkflow.js:39-41` | `(old.projectContents?.workflows \|\| []).filter(wf => !idsToRemove.includes(wf.id) && !idsToRemove.includes(wf.name))` | Replaced by iterating `idsToRemove` with `removeById` or passing `matchWorkflowId`. Preserves immutability and returns original reference if no match. |
| `features/folders/mutations/useDeleteFolder.js` (future Phase 2) | N/A (currently pessimistic) | Will use `removeById(oldFolders, folderId, matchFolderId)`. |
| `features/media/api/mutations/useRemoveAsset.js:39` | `updatedWorkflows = workflows.filter(wf => wfId !== targetWfId \|\| hasRemainingMedia)` | Candidate for composite workflow removal when media count reaches 0. |

---

## 4. `patchWorkflowFolder(wf, folderId)`

### Implementation
```js
export function patchWorkflowFolder(wf, folderId) {
  if (!wf) return wf;
  const value = folderId || null;
  return {
    ...wf,
    folder_id: value,
    folderId: value,
    metadata: { ...(wf.metadata || {}), folder_id: value, folderId: value },
  };
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/folders/api/foldersApi.js` (pre-revert git `1dd1e37:196-204`) | `applyFolderIdPatch(wf, normalizedFolderId)` | Exact 4-field write pattern across root (`folder_id`, `folderId`) and `metadata` (`folder_id`, `folderId`). Normalizes falsy folderId to `null`. |
| `features/folders/mutations/useMoveAssetToFolder.js` (future Phase 2) | N/A (currently pessimistic) | Will update `projectData.projectContents.workflows` on move asset drop. |

---

## 5. `patchFolderParent(folder, parentId)`

### Implementation
```js
export function patchFolderParent(folder, parentId) {
  if (!folder) return folder;
  const value = parentId || null;
  return { ...folder, parentId: value, parent_id: value };
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/folders/api/foldersApi.js` (pre-revert git `1dd1e37:113`) | `return { ...f, ...patch };` where `patch = { parentId }` | **Flag:** Old code only wrote `parentId`. However, UI consumers read both `c.parentId` and `c.parent_id` (e.g. `collection/[collectionId]/page.js:76`, `StudioNavbarLeft.jsx:46`). Helper writes both `parentId` and `parent_id` to prevent subtle desync. |

---

## 6. `patchFolderName(folder, name)`

### Implementation
```js
export function patchFolderName(folder, name) {
  if (!folder) return folder;
  return { ...folder, name };
}
```

### Call Sites to Replace Later

| Target File : Line | Existing Inline Expression | Comparison & Flags |
|---|---|---|
| `features/folders/api/foldersApi.js` (pre-revert git `1dd1e37:113`) | `return { ...f, ...patch };` where `patch = { name }` | Exact match. |
