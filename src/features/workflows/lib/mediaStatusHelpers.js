// [FSD Layer: features/workflows/lib] — Canonical media & workflow status helpers for deletion rules.
// Enforces:
// 1. In-flight / processing media cannot be deleted (6 statuses + 409 MEDIA_PROCESSING conflict).
// 2. Failed-only media skips Trash and is permanently deleted directly.

import { isFolderDescendant } from "@/features/folders/model/useFolderMove";

export const MEDIA_IN_FLIGHT_STATUSES = [
  "processing",
  "pending",
  "queued",
  "uploading",
  "in_progress",
  "starting",
];

export const MEDIA_FAILED_STATUSES = ["failed", "error", "rejected"];

export const MEDIA_PROCESSING_DEFAULT_MESSAGE =
  "Cannot delete while media is still processing";

function cleanWfId(id) {
  return String(id ?? "")
    .trim()
    .replace(/^workflows\//, "");
}

function collectStatusCandidates(item) {
  if (!item || typeof item !== "object") return [];
  return [
    item.raw?.status,
    item.status,
    item.media_status,
    item.mediaStatus,
    item.raw?.media_status,
    item.raw?.mediaStatus,
    item.mediaMetadata?.status,
    item.raw?.mediaMetadata?.status,
  ]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim().toLowerCase());
}

/**
 * Checks if a status string or media/workflow item is currently in-flight.
 *
 * @param {string|Object|null|undefined} itemOrStatus
 * @returns {boolean}
 */
export function isMediaInFlight(itemOrStatus) {
  if (!itemOrStatus) return false;
  if (typeof itemOrStatus === "string") {
    return MEDIA_IN_FLIGHT_STATUSES.includes(itemOrStatus.trim().toLowerCase());
  }
  if (typeof itemOrStatus !== "object") return false;

  const candidates = collectStatusCandidates(itemOrStatus);
  return candidates.some((status) => MEDIA_IN_FLIGHT_STATUSES.includes(status));
}

/**
 * Checks if a status string or media item is in a terminal failed state.
 *
 * @param {string|Object|null|undefined} itemOrStatus
 * @returns {boolean}
 */
export function isMediaFailed(itemOrStatus) {
  if (!itemOrStatus) return false;
  if (typeof itemOrStatus === "string") {
    return MEDIA_FAILED_STATUSES.includes(itemOrStatus.trim().toLowerCase());
  }
  if (typeof itemOrStatus !== "object") return false;
  if (isMediaInFlight(itemOrStatus)) return false;

  const candidates = collectStatusCandidates(itemOrStatus);
  if (candidates.length > 0) {
    return (
      candidates.some((status) => MEDIA_FAILED_STATUSES.includes(status)) &&
      !candidates.some((status) =>
        ["completed", "success", "ready"].includes(status)
      )
    );
  }

  if (
    (itemOrStatus.error || itemOrStatus.error_message) &&
    !itemOrStatus.url &&
    !itemOrStatus.file_url
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts all media items embedded on a workflow object.
 *
 * @param {Object|null|undefined} workflow
 * @returns {Array<Object>}
 */
export function getWorkflowMediaItems(workflow) {
  if (!workflow || typeof workflow !== "object") return [];
  const items = [];
  const seen = new Set();

  const pushArray = (list) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const key = entry.id || entry.name || entry.asset_id || entry;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(entry);
    }
  };

  pushArray(workflow.items);
  pushArray(workflow.media);
  pushArray(workflow.media_items);

  if (
    items.length === 0 &&
    workflow.primary_media &&
    typeof workflow.primary_media === "object"
  ) {
    items.push(workflow.primary_media);
  }

  return items;
}

/**
 * True if workflow?.status, targetItem, or ANY item in workflow?.items / workflow?.media is in-flight.
 *
 * @param {Object|null|undefined} workflow
 * @param {Object|Array<Object>|string|null} [targetItem=null]
 * @returns {boolean}
 */
export function hasInFlightMedia(workflow, targetItem = null) {
  if (Array.isArray(targetItem)) {
    if (targetItem.some((item) => isMediaInFlight(item))) return true;
  } else if (isMediaInFlight(targetItem)) {
    return true;
  }

  if (!workflow) return false;
  if (isMediaInFlight(workflow)) return true;

  const items = getWorkflowMediaItems(workflow);
  return items.some((item) => isMediaInFlight(item));
}

/**
 * True when the workflow's media (or targetItem if workflow has no items array)
 * has at least 1 media item (or explicit failed workflow status) and EVERY media item
 * is in MEDIA_FAILED_STATUSES.
 * Mixed failed + completed returns false; empty with non-failed status returns false.
 *
 * @param {Object|null|undefined} workflow
 * @param {Object|Array<Object>|null} [targetItem=null]
 * @returns {boolean}
 */
export function areAllWorkflowMediaFailed(workflow, targetItem = null) {
  if (!workflow && !targetItem) return false;
  if (hasInFlightMedia(workflow, targetItem)) return false;

  const embeddedItems = getWorkflowMediaItems(workflow);
  const externalItems = Array.isArray(targetItem)
    ? targetItem.filter((item) => item && typeof item === "object")
    : [];
  const items = embeddedItems.length > 0 ? embeddedItems : externalItems;

  if (items.length > 0) {
    return items.every((item) => isMediaFailed(item));
  }

  if (targetItem && !Array.isArray(targetItem) && typeof targetItem === "object") {
    return isMediaFailed(targetItem);
  }

  if (typeof targetItem === "string") {
    return isMediaFailed(targetItem);
  }

  return isMediaFailed(workflow?.status ?? workflow?.media_status ?? null);
}

/**
 * Detects a 409 MEDIA_PROCESSING conflict error from the backend.
 *
 * @param {any} err
 * @returns {boolean}
 */
export function isMediaProcessingConflictError(err) {
  if (!err) return false;
  const status =
    err?.status ??
    err?.statusCode ??
    err?.response?.status ??
    err?.data?.status ??
    null;
  const code =
    err?.errorCode ??
    err?.code ??
    err?.data?.errorCode ??
    err?.data?.code ??
    null;

  return (
    status === 409 ||
    code === "MEDIA_PROCESSING" ||
    err?.message === "MEDIA_PROCESSING"
  );
}

/**
 * Resolves user-facing error message for a 409 MEDIA_PROCESSING conflict error.
 *
 * @param {any} err
 * @param {string} [fallback=MEDIA_PROCESSING_DEFAULT_MESSAGE]
 * @returns {string}
 */
export function getMediaProcessingConflictMessage(
  err,
  fallback = MEDIA_PROCESSING_DEFAULT_MESSAGE
) {
  const raw = typeof err?.message === "string" ? err.message.trim() : "";
  if (!raw || raw === "MEDIA_PROCESSING" || /^API error:\s*409\b/i.test(raw)) {
    return fallback;
  }
  return raw;
}

/**
 * Checks if an item belongs to any folder ID in `folderIdSet`.
 *
 * @param {Object|null|undefined} item
 * @param {Set<string>} folderIdSet
 * @returns {boolean}
 */
export function isEntityInFolderSet(item, folderIdSet) {
  if (!item || !folderIdSet || folderIdSet.size === 0) return false;
  const candidates = [
    item.folder_id,
    item.folderId,
    item.collection_id,
    item.collectionId,
    item.metadata?.folder_id,
    item.metadata?.folderId,
    item.metadata?.collection_id,
    item.metadata?.collectionId,
  ];
  return candidates.some((c) => c != null && folderIdSet.has(String(c)));
}

/**
 * Checks whether any targeted workflow or folder in a bulk delete / drag-to-trash operation
 * currently has in-flight media.
 *
 * @param {Object} params
 * @param {Array<Object>} [params.selectedEntries]
 * @param {Array<string>} [params.workflowIds]
 * @param {Array<string>} [params.folderIds]
 * @param {Object} [params.projectData]
 * @param {Array<Object>|Object} [params.folders]
 * @returns {boolean}
 */
export function hasInFlightWorkspaceDeleteTargets({
  selectedEntries = [],
  workflowIds = [],
  folderIds = [],
  projectData = null,
  folders = null,
} = {}) {
  for (const entry of selectedEntries) {
    if (!entry) continue;
    if (entry.workflow && hasInFlightMedia(entry.workflow)) return true;
    if (entry.item && isMediaInFlight(entry.item)) return true;
    if (entry.status && isMediaInFlight(entry.status)) return true;
  }

  const projectContents = projectData?.projectContents || projectData || {};
  const cachedWorkflows = Array.isArray(projectContents.workflows)
    ? projectContents.workflows
    : [];
  const cachedMedia = Array.isArray(projectContents.media)
    ? projectContents.media
    : [];

  let allFolders = [];
  if (Array.isArray(folders)) {
    allFolders = folders;
  } else if (Array.isArray(folders?.items)) {
    allFolders = folders.items;
  } else if (Array.isArray(projectContents.collections)) {
    allFolders = projectContents.collections;
  } else if (Array.isArray(projectContents.folders)) {
    allFolders = projectContents.folders;
  }

  const targetWfIds = new Set(
    (Array.isArray(workflowIds) ? workflowIds : [])
      .map(cleanWfId)
      .filter(Boolean)
  );
  for (const entry of selectedEntries) {
    if (entry?.itemType === "workflow" && entry.id) {
      const cleaned = cleanWfId(entry.id);
      if (cleaned) targetWfIds.add(cleaned);
    }
  }

  if (targetWfIds.size > 0) {
    for (const wf of cachedWorkflows) {
      const wfId = cleanWfId(wf?.id || wf?.name);
      if (wfId && targetWfIds.has(wfId) && hasInFlightMedia(wf)) {
        return true;
      }
    }
    for (const m of cachedMedia) {
      const mWfId = cleanWfId(m?.workflowId || m?.workflow_id || m?.workflowName);
      if (mWfId && targetWfIds.has(mWfId) && isMediaInFlight(m)) {
        return true;
      }
    }
  }

  const rootFolderIds = new Set(
    (Array.isArray(folderIds) ? folderIds : [])
      .filter((id) => id != null && id !== "")
      .map(String)
  );
  for (const entry of selectedEntries) {
    if (entry?.itemType === "collection" && entry.id) {
      rootFolderIds.add(String(entry.id));
    }
  }

  if (rootFolderIds.size > 0) {
    const targetFolderSet = new Set(rootFolderIds);
    for (const rootId of rootFolderIds) {
      for (const folder of allFolders) {
        const candidateId = folder?.id ?? folder?.folderId ?? folder?._id;
        if (
          candidateId != null &&
          isFolderDescendant(allFolders, rootId, candidateId)
        ) {
          targetFolderSet.add(String(candidateId));
        }
      }
    }

    const folderWfIds = new Set();
    for (const wf of cachedWorkflows) {
      if (!isEntityInFolderSet(wf, targetFolderSet)) continue;
      if (hasInFlightMedia(wf)) return true;
      const wfId = cleanWfId(wf?.id || wf?.name);
      if (wfId) folderWfIds.add(wfId);
    }

    for (const m of cachedMedia) {
      if (isEntityInFolderSet(m, targetFolderSet) && isMediaInFlight(m)) {
        return true;
      }
      const mWfId = cleanWfId(m?.workflowId || m?.workflow_id || m?.workflowName);
      if (mWfId && folderWfIds.has(mWfId) && isMediaInFlight(m)) {
        return true;
      }
    }
  }

  return false;
}
