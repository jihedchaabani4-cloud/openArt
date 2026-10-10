// Shared cache-patching helpers for React Query optimistic updates.
// Bodies copied VERBATIM from inline sites (Phase A rules: zero behavior change).
// Use these only across ≥2 future split-hook files; single-file logic stays inline.

/**
 * Strip the legacy "workflows/" prefix from IDs.
 * Inline source: workflowsApi L418, foldersApi L180 cleanAssetId,
 * useCharacter L164, useElement L386 — all identical bodies.
 */
export function stripWorkflowPrefix(id) {
  return String(id ?? "").replace(/^workflows\//, "");
}

/**
 * Strict two-field identity match for a workflow object against a single target id.
 * Checks `wf.id === targetId || wf.name === targetId` then also a prefix-stripped
 * equality check (both sides symmetrically stripped — mirrors the scattered
 * wCleanId === cleanId patterns in workflowsApi L435 / useCharacter L368).
 *
 * For array-of-targets call sites, combine with `.some()`:
 *   `idsToRemove.some(id => matchWorkflowId(wf, id))`
 * (keeps array iteration inline to preserve exact evaluation order).
 */
export function matchWorkflowId(wf, targetId) {
  const target = targetId ?? "";
  if (!wf) return false;
  if (wf.id === target || wf.name === target) return true;
  const stripped = stripWorkflowPrefix(wf.id || wf.name || "");
  const strippedTarget = stripWorkflowPrefix(target);
  return stripped === strippedTarget && strippedTarget !== "";
}

/**
 * Strict two-field identity match for a media item.
 * Exact body of inline check used in workflowsApi L311 (useToggleLike),
 * mediaApi L385 (useRemoveAsset), and useCharacter L34 / L410 / L419 / L442.
 */
export function matchMediaId(media, targetId) {
  if (!media || targetId == null) return false;
  return media.id === targetId || media.name === targetId;
}

/**
 * Triple coalesce folder identity extractor.
 * Exact body: foldersApi L79 `f.id || f.folderId || f._id`.
 */
export function getFolderId(folderObj) {
  if (!folderObj) return undefined;
  return folderObj.id || folderObj.folderId || folderObj._id;
}

/**
 * Apply folder_id/folderId across root + metadata (4-write pattern).
 * Exact body from foldersApi L196-L204 (useMoveAssetToFolder onMutate).
 * folderId is normalized to `null` when falsy (matches `normalizedFolderId = folderId || null`).
 */
export function applyFolderIdPatch(entity, folderId) {
  const normalized = folderId || null;
  return {
    ...entity,
    folder_id: normalized,
    folderId: normalized,
    metadata: {
      ...(entity?.metadata || {}),
      folder_id: normalized,
      folderId: normalized,
    },
  };
}
