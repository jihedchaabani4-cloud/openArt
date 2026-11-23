// [FSD Layer: features/workflows/api/mutations] — Explicit-intent workspace bulk delete mutation.
// Calls POST /workspace/bulk-delete in sequential chunks of <= 100 total IDs, updates project/folder caches
// from the server response (handling both trashed_workflow_ids and deleted_workflow_ids),
// rolls back on 409 MEDIA_PROCESSING conflict, and re-syncs caches on stale-ID (400/404) or partial-batch errors.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import {
  matchFolderId,
  matchWorkflowId,
  patchWorkflowFolder,
} from "@/shared/lib/optimistic/cacheOps";
import {
  areAllWorkflowMediaFailed,
  isMediaProcessingConflictError,
  getMediaProcessingConflictMessage,
} from "@/features/workflows/lib/mediaStatusHelpers";

const MAX_BATCH_SIZE = 100;
const RATE_LIMIT_MESSAGE = "Too many bulk delete requests, please wait a moment";
const STALE_SYNC_MESSAGE =
  "Some selected items changed or no longer exist. Your workspace has been refreshed.";
const FALLBACK_ERROR_MESSAGE = "Failed to delete selected items.";

function cleanWorkflowId(id) {
  return String(id || "")
    .trim()
    .replace(/^workflows\//, "");
}

function normalizeIdList(ids, { stripWorkflow = false } = {}) {
  if (!Array.isArray(ids)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    if (raw == null || raw === "") continue;
    const id = stripWorkflow ? cleanWorkflowId(raw) : String(raw).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function appendUnique(target, seen, items, { stripWorkflow = false } = {}) {
  if (!Array.isArray(items)) return;
  for (const raw of items) {
    if (raw == null || raw === "") continue;
    const id = stripWorkflow ? cleanWorkflowId(raw) : String(raw).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    target.push(id);
  }
}

/**
 * Pure helper that splits a workspace bulk-delete payload into sequential chunks
 * of at most `maxBatchSize` (default 100) total IDs across all 4 arrays.
 * Preserves folder_ids first, then workflow_ids, character_ids, element_ids.
 *
 * @param {Object} input
 * @param {string[]} [input.folder_ids]
 * @param {string[]} [input.workflow_ids]
 * @param {string[]} [input.character_ids]
 * @param {string[]} [input.element_ids]
 * @param {number} [maxBatchSize=100]
 * @returns {Array<{ folder_ids?: string[], workflow_ids?: string[], character_ids?: string[], element_ids?: string[] }>}
 */
export function chunkWorkspaceBulkDeletePayload(
  { folder_ids, workflow_ids, character_ids, element_ids } = {},
  maxBatchSize = MAX_BATCH_SIZE
) {
  const limit = Math.max(1, Number.isFinite(maxBatchSize) ? Math.floor(maxBatchSize) : MAX_BATCH_SIZE);

  const buckets = [
    ["folder_ids", normalizeIdList(folder_ids)],
    ["workflow_ids", normalizeIdList(workflow_ids, { stripWorkflow: true })],
    ["character_ids", normalizeIdList(character_ids)],
    ["element_ids", normalizeIdList(element_ids)],
  ];

  const chunks = [];
  let current = {};
  let currentCount = 0;

  for (const [key, list] of buckets) {
    let offset = 0;
    while (offset < list.length) {
      const remaining = limit - currentCount;
      const slice = list.slice(offset, offset + remaining);
      current[key] = current[key] ? current[key].concat(slice) : slice;
      currentCount += slice.length;
      offset += slice.length;

      if (currentCount >= limit) {
        chunks.push(current);
        current = {};
        currentCount = 0;
      }
    }
  }

  if (currentCount > 0) {
    chunks.push(current);
  }

  return chunks;
}

function getErrorStatus(err) {
  const raw =
    err?.status ??
    err?.statusCode ??
    err?.response?.status ??
    err?.data?.status ??
    null;
  if (typeof raw === "number") return raw;
  const match = String(err?.message || "").match(/\b(400|404|409|429)\b/);
  return match ? Number(match[1]) : null;
}

function getErrorCode(err) {
  return err?.errorCode || err?.data?.errorCode || err?.code || err?.data?.code || null;
}

function createApiError(res, fallbackMessage) {
  const err = new Error(res?.message || res?.error || fallbackMessage);
  if (typeof res?.status === "number") err.status = res.status;
  if (typeof res?.statusCode === "number") err.statusCode = res.statusCode;
  if (res?.errorCode || res?.code) err.errorCode = res.errorCode || res.code;
  err.data = res;
  return err;
}

function normalizeBulkDeleteError(err) {
  const status = getErrorStatus(err);
  const errorCode = getErrorCode(err);
  const rawMessage = String(err?.message || "").trim();

  const isMediaProcessing = isMediaProcessingConflictError(err);
  const isRateLimited =
    !isMediaProcessing && (status === 429 || /too many|rate limit/i.test(rawMessage));
  const isStaleOrInvalid =
    !isMediaProcessing &&
    (status === 404 ||
      status === 400 ||
      errorCode === "WORKFLOW_NOT_IN_TRASH" ||
      rawMessage.includes("WORKFLOW_NOT_IN_TRASH") ||
      /not found|does not exist|not in trash|invalid/i.test(rawMessage));

  let message = rawMessage || FALLBACK_ERROR_MESSAGE;
  if (isMediaProcessing) {
    message = getMediaProcessingConflictMessage(err);
  } else if (isRateLimited) {
    message = RATE_LIMIT_MESSAGE;
  } else if (isStaleOrInvalid) {
    const isRawTechnicalMsg =
      !rawMessage ||
      /^API error:/i.test(rawMessage) ||
      rawMessage === "WORKFLOW_NOT_IN_TRASH";
    message = isRawTechnicalMsg ? STALE_SYNC_MESSAGE : rawMessage;
  }

  const normalized = new Error(message);
  normalized.status = isMediaProcessing ? status || 409 : status;
  normalized.errorCode = isMediaProcessing ? errorCode || "MEDIA_PROCESSING" : errorCode;
  normalized.data = err?.data;
  normalized.isMediaProcessing = isMediaProcessing;
  normalized.isStaleOrInvalid = isStaleOrInvalid;
  normalized.isRateLimited = isRateLimited;
  return normalized;
}

function removeFoldersFromTree(list, deletedFolderIds) {
  if (!Array.isArray(list) || deletedFolderIds.length === 0) return list;
  const next = [];
  for (const folder of list) {
    if (!folder) continue;
    if (deletedFolderIds.some((id) => matchFolderId(folder, id))) {
      continue;
    }
    if (Array.isArray(folder.children)) {
      next.push({
        ...folder,
        children: removeFoldersFromTree(folder.children, deletedFolderIds),
      });
    } else {
      next.push(folder);
    }
  }
  return next;
}

function isWorkflowInDeletedFolder(wf, deletedFolderSet) {
  if (!wf || deletedFolderSet.size === 0) return false;
  const candidates = [
    wf.folder_id,
    wf.folderId,
    wf.collection_id,
    wf.collectionId,
    wf.metadata?.folder_id,
    wf.metadata?.folderId,
    wf.metadata?.collection_id,
    wf.metadata?.collectionId,
  ];
  return candidates.some((c) => c != null && deletedFolderSet.has(String(c)));
}

function patchFoldersCache(oldData, deletedFolderIds) {
  if (!oldData || deletedFolderIds.length === 0) return oldData;
  if (Array.isArray(oldData)) {
    return removeFoldersFromTree(oldData, deletedFolderIds);
  }
  if (Array.isArray(oldData.items)) {
    return {
      ...oldData,
      items: removeFoldersFromTree(oldData.items, deletedFolderIds),
    };
  }
  if (Array.isArray(oldData.folders)) {
    return {
      ...oldData,
      folders: removeFoldersFromTree(oldData.folders, deletedFolderIds),
    };
  }
  return oldData;
}

function patchFlatWorkflowCache(oldData, removedIds) {
  if (!oldData || !Array.isArray(removedIds) || removedIds.length === 0) return oldData;
  const filterList = (list) =>
    list.filter((entity) => !removedIds.some((id) => matchWorkflowId(entity, id)));
  if (Array.isArray(oldData)) {
    return filterList(oldData);
  }
  if (typeof oldData === "object") {
    const next = { ...oldData };
    if (Array.isArray(oldData.workflows)) next.workflows = filterList(oldData.workflows);
    if (Array.isArray(oldData.items)) next.items = filterList(oldData.items);
    if (Array.isArray(oldData.data)) next.data = filterList(oldData.data);
    return next;
  }
  return oldData;
}

function patchProjectDataCache(oldData, result) {
  if (!oldData?.projectContents) return oldData;

  const deletedFolderIds = result?.deleted_folder_ids || [];
  const trashedWorkflowIds = [
    ...(result?.trashed_workflow_ids || []),
    ...(result?.already_trashed_workflow_ids || []),
  ];
  const deletedWorkflowIds = result?.deleted_workflow_ids || [];
  const allRemovedWorkflowIds = [...trashedWorkflowIds, ...deletedWorkflowIds];

  const deletedCharIds = result?.deleted_orphan_character_ids || [];
  const deletedElemIds = result?.deleted_orphan_element_ids || [];

  const deletedFolderSet = new Set(deletedFolderIds.map(String));
  const deletedWfSet = new Set(deletedWorkflowIds.map(cleanWorkflowId).filter(Boolean));
  const removedWfSet = new Set(allRemovedWorkflowIds.map(cleanWorkflowId).filter(Boolean));
  const deletedCharSet = new Set(deletedCharIds.map(String));
  const deletedElemSet = new Set(deletedElemIds.map(String));

  const pc = oldData.projectContents;
  const currentWorkflows = Array.isArray(pc.workflows) ? pc.workflows : [];
  const currentTrashed = Array.isArray(pc.trashedWorkflows) ? pc.trashedWorkflows : [];
  const currentCharacters = Array.isArray(pc.characters) ? pc.characters : [];
  const currentElements = Array.isArray(pc.elements) ? pc.elements : [];
  const currentMedia = Array.isArray(pc.media) ? pc.media : [];

  const matchesTrashedWorkflow = (entity) =>
    trashedWorkflowIds.some((id) => matchWorkflowId(entity, id));
  const matchesDeletedWorkflow = (entity) =>
    deletedWorkflowIds.some((id) => matchWorkflowId(entity, id));
  const matchesRemovedWorkflow = (entity) =>
    allRemovedWorkflowIds.some((id) => matchWorkflowId(entity, id));

  const nowIso = new Date().toISOString();
  const newlyTrashed = [];
  const existingTrashedIds = new Set(
    currentTrashed.map((w) => cleanWorkflowId(w?.id || w?.name)).filter(Boolean)
  );

  const nextWorkflows = [];
  for (const wf of currentWorkflows) {
    const cleanId = cleanWorkflowId(wf?.id || wf?.name);
    const wfMedia = currentMedia.filter(
      (m) => cleanWorkflowId(m?.workflowId || m?.workflow_id || m?.workflowName) === cleanId
    );
    const isFailedOnly = areAllWorkflowMediaFailed(wf, wfMedia);

    // Permanently deleted failed workflows are removed from active workflows and NEVER added to Trash
    if (matchesDeletedWorkflow(wf) || (matchesTrashedWorkflow(wf) && isFailedOnly)) {
      continue;
    }

    if (matchesTrashedWorkflow(wf)) {
      if (cleanId && !existingTrashedIds.has(cleanId) && !deletedWfSet.has(cleanId)) {
        existingTrashedIds.add(cleanId);
        const cleared = isWorkflowInDeletedFolder(wf, deletedFolderSet)
          ? patchWorkflowFolder(wf, null)
          : wf;
        newlyTrashed.push({
          ...cleared,
          deleted_at: nowIso,
          deletedAt: nowIso,
          metadata: {
            ...(cleared.metadata || {}),
            deleted_at: nowIso,
          },
        });
      }
      continue;
    }

    if (isWorkflowInDeletedFolder(wf, deletedFolderSet)) {
      nextWorkflows.push(patchWorkflowFolder(wf, null));
    } else {
      nextWorkflows.push(wf);
    }
  }

  // Ensure permanently deleted workflow IDs are never left in trashedWorkflows
  const filteredExistingTrashed =
    deletedWorkflowIds.length > 0
      ? currentTrashed.filter((wf) => !matchesDeletedWorkflow(wf))
      : currentTrashed;

  const nextCharacters = currentCharacters.filter((c) => {
    if (!c) return false;
    if (c.id != null && deletedCharSet.has(String(c.id))) return false;
    const wfId = cleanWorkflowId(c.workflow_id || c.workflowId);
    if (wfId && removedWfSet.has(wfId)) return false;
    if (matchesRemovedWorkflow(c)) return false;
    return true;
  });

  const nextElements = currentElements.filter((el) => {
    if (!el) return false;
    if (el.id != null && deletedElemSet.has(String(el.id))) return false;
    const wfId = cleanWorkflowId(el.workflow_id || el.workflowId);
    if (wfId && removedWfSet.has(wfId)) return false;
    if (matchesRemovedWorkflow(el)) return false;
    return true;
  });

  const nextMedia = currentMedia.filter((m) => {
    const mWf = cleanWorkflowId(m?.workflowId || m?.workflow_id || m?.workflowName);
    return !mWf || !removedWfSet.has(mWf);
  });

  const nextProjectContents = {
    ...pc,
    workflows: nextWorkflows,
    trashedWorkflows: [...newlyTrashed, ...filteredExistingTrashed],
    characters: nextCharacters,
    elements: nextElements,
    media: nextMedia,
  };

  if (Array.isArray(pc.collections)) {
    nextProjectContents.collections = removeFoldersFromTree(pc.collections, deletedFolderIds);
  }
  if (Array.isArray(pc.folders)) {
    nextProjectContents.folders = removeFoldersFromTree(pc.folders, deletedFolderIds);
  }

  return {
    ...oldData,
    projectContents: nextProjectContents,
  };
}

/**
 * useWorkspaceBulkDelete:
 * Executes POST /workspace/bulk-delete in sequential <=100 ID chunks.
 * Updates projectData & folders caches from server truth and invalidates trash/library queries.
 */
export function useWorkspaceBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables = {}) => {
      const chunks = chunkWorkspaceBulkDeletePayload({
        folder_ids: variables.folder_ids ?? variables.folderIds,
        workflow_ids: variables.workflow_ids ?? variables.workflowIds,
        character_ids: variables.character_ids ?? variables.characterIds,
        element_ids: variables.element_ids ?? variables.elementIds,
      });

      if (chunks.length === 0) {
        throw new Error("At least one item must be selected");
      }

      const deleted_folder_ids = [];
      const trashed_workflow_ids = [];
      const deleted_workflow_ids = [];
      const already_trashed_workflow_ids = [];
      const deleted_orphan_character_ids = [];
      const deleted_orphan_element_ids = [];

      const seenFolders = new Set();
      const seenTrashed = new Set();
      const seenDeletedWorkflows = new Set();
      const seenAlreadyTrashed = new Set();
      const seenChars = new Set();
      const seenElements = new Set();

      let completedChunks = 0;
      let hasDeletedWorkflowIdsField = false;

      try {
        for (const chunk of chunks) {
          const res = await api.post("/workspace/bulk-delete", chunk);
          if (res && (res.ok === false || res.success === false)) {
            throw createApiError(res, FALLBACK_ERROR_MESSAGE);
          }

          if (res && "deleted_workflow_ids" in res) {
            hasDeletedWorkflowIdsField = true;
          }

          appendUnique(deleted_folder_ids, seenFolders, res?.deleted_folder_ids);
          appendUnique(trashed_workflow_ids, seenTrashed, res?.trashed_workflow_ids, {
            stripWorkflow: true,
          });
          appendUnique(deleted_workflow_ids, seenDeletedWorkflows, res?.deleted_workflow_ids, {
            stripWorkflow: true,
          });
          appendUnique(
            already_trashed_workflow_ids,
            seenAlreadyTrashed,
            res?.already_trashed_workflow_ids,
            { stripWorkflow: true }
          );
          appendUnique(
            deleted_orphan_character_ids,
            seenChars,
            res?.deleted_orphan_character_ids
          );
          appendUnique(
            deleted_orphan_element_ids,
            seenElements,
            res?.deleted_orphan_element_ids
          );
          completedChunks += 1;
        }
      } catch (err) {
        const normalized = normalizeBulkDeleteError(err);
        normalized.completedChunks = completedChunks;
        throw normalized;
      }

      const out = {
        ok: true,
        deleted_folder_ids,
        trashed_workflow_ids,
        already_trashed_workflow_ids,
        deleted_orphan_character_ids,
        deleted_orphan_element_ids,
      };
      if (hasDeletedWorkflowIdsField || deleted_workflow_ids.length > 0) {
        out.deleted_workflow_ids = deleted_workflow_ids;
      }
      return out;
    },

    onMutate: async (variables = {}) => {
      const projectId = variables?.projectId ?? variables?.project_id ?? null;
      if (!projectId) return { snapshots: [] };

      const keys = [
        queryKeys.projectData.byProject(projectId),
        queryKeys.folders.byProject(projectId),
        queryKeys.generations.byProject(projectId),
        queryKeys.trash.all(),
      ];

      const snapshots = [];
      for (const key of keys) {
        const previousData = queryClient.getQueryData(key);
        if (previousData !== undefined) {
          snapshots.push({ key, previousData });
        }
      }
      return { snapshots };
    },

    onSuccess: (result, variables = {}) => {
      const projectId = variables?.projectId ?? variables?.project_id ?? null;
      const allRemovedWorkflowIds = [
        ...(result?.trashed_workflow_ids || []),
        ...(result?.already_trashed_workflow_ids || []),
        ...(result?.deleted_workflow_ids || []),
      ];

      if (projectId) {
        queryClient.setQueryData(queryKeys.folders.byProject(projectId), (old) =>
          patchFoldersCache(old, result.deleted_folder_ids)
        );
        queryClient.setQueryData(queryKeys.projectData.byProject(projectId), (old) =>
          patchProjectDataCache(old, result)
        );

        const existingGenerations = queryClient.getQueryData(
          queryKeys.generations.byProject(projectId)
        );
        if (existingGenerations !== undefined && allRemovedWorkflowIds.length > 0) {
          queryClient.setQueryData(
            queryKeys.generations.byProject(projectId),
            (old) => patchFlatWorkflowCache(old, allRemovedWorkflowIds)
          );
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(projectId) });
      }

      if (result?.deleted_workflow_ids?.length > 0) {
        const existingTrash = queryClient.getQueryData(queryKeys.trash.all());
        if (existingTrash !== undefined) {
          queryClient.setQueryData(queryKeys.trash.all(), (old) =>
            patchFlatWorkflowCache(old, result.deleted_workflow_ids)
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
      if ((result?.trashed_workflow_ids || []).length > 0 || !result?.deleted_workflow_ids?.length) {
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all() });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },

    onError: (err, variables = {}, context) => {
      const projectId = variables?.projectId ?? variables?.project_id ?? null;

      if (err?.isMediaProcessing && Array.isArray(context?.snapshots)) {
        for (const { key, previousData } of context.snapshots) {
          if (previousData !== undefined) {
            queryClient.setQueryData(key, previousData);
          }
        }
      }

      if (err?.isStaleOrInvalid || (err?.completedChunks || 0) > 0) {
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(projectId) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all() });
      }

      const message = err?.message || FALLBACK_ERROR_MESSAGE;
      toast.error(message, { id: "workspace-bulk-delete-error" });
      logger.error("workspace_bulk_delete_failed", {
        message,
        status: err?.status ?? null,
        errorCode: err?.errorCode ?? null,
        projectId,
      });
    },
  });
}

export default useWorkspaceBulkDelete;
