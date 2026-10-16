// [FSD Layer: shared/lib/optimistic] Pure cache operations for optimistic updates.
// Owns: how one cached entity is matched, removed or patched. No React, no queryClient.
// Public: matchWorkflowId, matchFolderId, removeById, patchWorkflowFolder,
//         patchFolderParent, patchFolderName.
// Every function returns a NEW object/array (never mutates) and is idempotent.
// Audit of the inline expressions these will replace: docs/optimistic/cacheops-audit.md

import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";

const isBlank = (v) => v == null || v === "";

/**
 * True when a workflow-like entity has the target id.
 * Compares `id` and `name` raw, then both prefix-stripped ("workflows/x" === "x").
 * Never matches on a null/empty target or an entity without id/name.
 * @param {object|null|undefined} entity
 * @param {string|null|undefined} targetId
 * @returns {boolean}
 */
export function matchWorkflowId(entity, targetId) {
  if (!entity || isBlank(targetId)) return false;
  const target = stripWorkflowPrefix(targetId);
  if (target === "") return false;

  const entityId = !isBlank(entity.id)
    ? stripWorkflowPrefix(entity.id)
    : !isBlank(entity.asset_id)
    ? stripWorkflowPrefix(entity.asset_id)
    : "";
  const entityName = !isBlank(entity.name) ? stripWorkflowPrefix(entity.name) : "";

  if (entity.id === targetId || entity.name === targetId || entity.asset_id === targetId) {
    return entityId === target || entityName === target;
  }

  if ((entityId !== "" && entityId === target) || (entityName !== "" && entityName === target)) {
    return true;
  }

  // Also match when targetId is a nested media/item record of this workflow
  if (Array.isArray(entity.items) && entity.items.some((it) => matchWorkflowId(it, targetId))) {
    return true;
  }
  if (Array.isArray(entity.media) && entity.media.some((m) => matchWorkflowId(m, targetId))) {
    return true;
  }

  return false;
}

/**
 * True when a folder has the target id (`id`, then `folderId`, then `_id`).
 * Never compares the folder `name` (a human label, not an id).
 * @param {object|null|undefined} folder
 * @param {string|null|undefined} folderId
 * @returns {boolean}
 */
export function matchFolderId(folder, folderId) {
  if (!folder || isBlank(folderId)) return false;
  return (folder.id || folder.folderId || folder._id) === folderId;
}

/**
 * Remove every item matching `id`. Returns the SAME array reference when nothing
 * is removed, and the input untouched when it is not an array or `id` is blank.
 * @param {Array|null|undefined} list
 * @param {string} id
 * @param {(item: object, id: string) => boolean} [match=matchWorkflowId]
 * @returns {Array|null|undefined}
 */
export function removeById(list, id, match = matchWorkflowId) {
  if (!Array.isArray(list) || isBlank(id)) return list;
  const next = list.filter((item) => !match(item, id));
  return next.length === list.length ? list : next;
}

/**
 * Put a workflow in a folder (or at root when `folderId` is falsy).
 * Writes the 4 variants read across the app:
 * folder_id, folderId, metadata.folder_id, metadata.folderId.
 * @param {object|null|undefined} wf
 * @param {string|null|undefined} folderId
 * @returns {object|null|undefined}
 */
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

/**
 * Move a folder under another parent (or to root when `parentId` is falsy).
 * Writes BOTH parentId and parent_id (readers use `parent_id || parentId`).
 * @param {object|null|undefined} folder
 * @param {string|null|undefined} parentId
 * @returns {object|null|undefined}
 */
export function patchFolderParent(folder, parentId) {
  if (!folder) return folder;
  const value = parentId || null;
  return { ...folder, parentId: value, parent_id: value };
}

/**
 * Rename a folder.
 * @param {object|null|undefined} folder
 * @param {string} name
 * @returns {object|null|undefined}
 */
export function patchFolderName(folder, name) {
  if (!folder) return folder;
  return { ...folder, name };
}

/**
 * Update all media items matching `mediaId` in the list (e.g. across duplicate workflow_media rows).
 * Returns the SAME array reference if nothing matched.
 * @param {Array|null|undefined} list
 * @param {string|null|undefined} mediaId
 * @param {object|((item: object) => object)} updater
 * @returns {Array|null|undefined}
 */
export function updateMediaById(list, mediaId, updater) {
  if (!Array.isArray(list) || isBlank(mediaId)) return list;
  let changed = false;
  const next = list.map((item) => {
    if (!item || typeof item !== "object") return item;
    const matches =
      item.id === mediaId ||
      item.name === mediaId ||
      item.asset_id === mediaId ||
      stripWorkflowPrefix(item.id) === stripWorkflowPrefix(mediaId);

    if (matches) {
      changed = true;
      const patch = typeof updater === "function" ? updater(item) : updater;
      return { ...item, ...patch };
    }
    return item;
  });
  return changed ? next : list;
}

