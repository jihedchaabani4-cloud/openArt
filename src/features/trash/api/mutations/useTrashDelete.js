// [FSD Layer: features/trash/api/mutations] — Explicit-intent permanent Trash delete mutation.
// Supports Mode A ({ workflow_ids }, chunked sequentially <= 100) and Mode B ({ all: true, project_id? }).
// Never sends both `all` and `workflow_ids` in the same request.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import { matchWorkflowId } from "@/shared/lib/optimistic/cacheOps";

const MAX_BATCH_SIZE = 100;
const RATE_LIMIT_MESSAGE = "Too many bulk delete requests, please wait a moment";
const NOT_IN_TRASH_MESSAGE = "Some selected items are no longer in Trash. Refreshing Trash.";
const STALE_TRASH_MESSAGE = "Some selected items could not be found in Trash. Refreshing Trash.";
const FALLBACK_ERROR_MESSAGE = "Failed to permanently delete trashed items.";

function cleanWorkflowId(id) {
  return String(id || "")
    .trim()
    .replace(/^workflows\//, "");
}

/**
 * Pure helper that deduplicates, normalizes, and splits workflow IDs into
 * sequential arrays of at most `maxBatchSize` (default 100) IDs.
 *
 * @param {string[]} ids
 * @param {number} [maxBatchSize=100]
 * @returns {string[][]}
 */
export function chunkIds(ids, maxBatchSize = MAX_BATCH_SIZE) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const limit = Math.max(1, Number.isFinite(maxBatchSize) ? Math.floor(maxBatchSize) : MAX_BATCH_SIZE);

  const unique = [];
  const seen = new Set();
  for (const raw of ids) {
    if (raw == null || raw === "") continue;
    const id = cleanWorkflowId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }

  const chunks = [];
  for (let i = 0; i < unique.length; i += limit) {
    chunks.push(unique.slice(i, i + limit));
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
  const match = String(err?.message || "").match(/\b(400|404|429)\b/);
  return match ? Number(match[1]) : null;
}

function getErrorCode(err) {
  return err?.errorCode || err?.data?.errorCode || err?.code || err?.data?.code || null;
}

function createApiError(res, fallbackMessage) {
  const err = new Error(res?.message || res?.error || fallbackMessage);
  if (typeof res?.status === "number") err.status = res.status;
  if (res?.errorCode || res?.code) err.errorCode = res.errorCode || res.code;
  err.data = res;
  return err;
}

function normalizeTrashDeleteError(err) {
  const status = getErrorStatus(err);
  const errorCode = getErrorCode(err);
  const rawMessage = String(err?.message || "").trim();

  const isRateLimited = status === 429 || /too many|rate limit/i.test(rawMessage);
  const isNotInTrash =
    errorCode === "WORKFLOW_NOT_IN_TRASH" ||
    rawMessage.includes("WORKFLOW_NOT_IN_TRASH") ||
    /not in trash/i.test(rawMessage);
  const isStaleOrInvalid =
    status === 404 ||
    status === 400 ||
    isNotInTrash ||
    /not found|does not exist/i.test(rawMessage);

  let message = rawMessage || FALLBACK_ERROR_MESSAGE;
  if (isRateLimited) {
    message = RATE_LIMIT_MESSAGE;
  } else if (isNotInTrash) {
    message = NOT_IN_TRASH_MESSAGE;
  } else if (isStaleOrInvalid) {
    const isRawTechnicalMsg = !rawMessage || /^API error:/i.test(rawMessage);
    message = isRawTechnicalMsg ? STALE_TRASH_MESSAGE : rawMessage;
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.errorCode = errorCode;
  normalized.data = err?.data;
  normalized.isStaleOrInvalid = isStaleOrInvalid;
  normalized.isRateLimited = isRateLimited;
  return normalized;
}

function patchTrashedWorkflowsCache(oldData, { all, deletedWorkflowIds }) {
  if (!oldData?.projectContents) return oldData;
  const currentTrashed = Array.isArray(oldData.projectContents.trashedWorkflows)
    ? oldData.projectContents.trashedWorkflows
    : [];

  if (all) {
    if (currentTrashed.length === 0) return oldData;
    return {
      ...oldData,
      projectContents: {
        ...oldData.projectContents,
        trashedWorkflows: [],
      },
    };
  }

  if (!Array.isArray(deletedWorkflowIds) || deletedWorkflowIds.length === 0) {
    return oldData;
  }

  const nextTrashed = currentTrashed.filter(
    (wf) => !deletedWorkflowIds.some((id) => matchWorkflowId(wf, id))
  );

  return {
    ...oldData,
    projectContents: {
      ...oldData.projectContents,
      trashedWorkflows: nextTrashed,
    },
  };
}

/**
 * useTrashDelete:
 * Executes POST /trash/delete in Mode A ({ workflow_ids }) or Mode B ({ all: true, project_id? }).
 * Immediately removes deleted items from cached projectContents.trashedWorkflows and invalidates
 * projectData, trash, workflows, and library queries so Trash badge counts refresh cleanly.
 */
export function useTrashDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables = {}) => {
      const projectId = variables.projectId ?? variables.project_id ?? null;
      const isEmptyAll = variables.all === true;

      // Mode B: Empty Trash ({ all: true, project_id? }) — never includes workflow_ids
      if (isEmptyAll) {
        const body = projectId ? { all: true, project_id: projectId } : { all: true };
        try {
          const res = await api.post("/trash/delete", body);
          if (res && (res.ok === false || res.success === false)) {
            throw createApiError(res, FALLBACK_ERROR_MESSAGE);
          }

          const deletedWorkflowIds = Array.isArray(res?.deleted_workflow_ids)
            ? res.deleted_workflow_ids.map(cleanWorkflowId).filter(Boolean)
            : [];
          const count =
            typeof res?.count === "number" ? res.count : deletedWorkflowIds.length;
          const deletedMediaCount =
            typeof res?.deleted_media_count === "number" ? res.deleted_media_count : 0;
          const storageFailures = Array.isArray(res?.storage_failures)
            ? res.storage_failures
            : typeof res?.storage_failures === "number"
              ? res.storage_failures
              : [];

          return {
            ok: true,
            deleted_workflow_ids: deletedWorkflowIds,
            count,
            deleted_media_count: deletedMediaCount,
            storage_failures: storageFailures,
          };
        } catch (err) {
          throw normalizeTrashDeleteError(err);
        }
      }

      // Mode A: Permanent delete selected trashed items ({ workflow_ids }) — never includes all
      const rawIds = variables.workflowIds ?? variables.workflow_ids ?? [];
      const chunks = chunkIds(rawIds, MAX_BATCH_SIZE);
      if (chunks.length === 0) {
        throw new Error("At least one trashed item must be selected");
      }

      const deletedWorkflowIds = [];
      const seenDeleted = new Set();
      let totalCount = 0;
      let totalDeletedMedia = 0;
      let hasNumericFailures = false;
      let numericFailures = 0;
      const arrayFailures = [];
      let completedChunks = 0;

      try {
        for (const chunk of chunks) {
          const res = await api.post("/trash/delete", { workflow_ids: chunk });
          if (res && (res.ok === false || res.success === false)) {
            throw createApiError(res, FALLBACK_ERROR_MESSAGE);
          }

          const chunkDeleted = Array.isArray(res?.deleted_workflow_ids)
            ? res.deleted_workflow_ids
            : chunk;
          for (const rawId of chunkDeleted) {
            const cleanId = cleanWorkflowId(rawId);
            if (!cleanId || seenDeleted.has(cleanId)) continue;
            seenDeleted.add(cleanId);
            deletedWorkflowIds.push(cleanId);
          }

          totalCount +=
            typeof res?.count === "number" ? res.count : chunkDeleted.length;
          totalDeletedMedia +=
            typeof res?.deleted_media_count === "number" ? res.deleted_media_count : 0;

          if (Array.isArray(res?.storage_failures)) {
            arrayFailures.push(...res.storage_failures);
          } else if (typeof res?.storage_failures === "number") {
            hasNumericFailures = true;
            numericFailures += res.storage_failures;
          }

          completedChunks += 1;
        }
      } catch (err) {
        const normalized = normalizeTrashDeleteError(err);
        normalized.completedChunks = completedChunks;
        throw normalized;
      }

      return {
        ok: true,
        deleted_workflow_ids: deletedWorkflowIds,
        count: totalCount,
        deleted_media_count: totalDeletedMedia,
        storage_failures:
          arrayFailures.length > 0
            ? arrayFailures
            : hasNumericFailures
              ? numericFailures
              : [],
      };
    },

    onSuccess: (result, variables = {}) => {
      const projectId = variables?.projectId ?? variables?.project_id ?? null;

      if (projectId) {
        queryClient.setQueryData(queryKeys.projectData.byProject(projectId), (old) =>
          patchTrashedWorkflowsCache(old, {
            all: variables?.all === true,
            deletedWorkflowIds: result.deleted_workflow_ids,
          })
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.trash.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },

    onError: (err, variables = {}) => {
      const projectId = variables?.projectId ?? variables?.project_id ?? null;

      if (err?.isStaleOrInvalid || (err?.completedChunks || 0) > 0) {
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
      }

      const message = err?.message || FALLBACK_ERROR_MESSAGE;
      toast.error(message, { id: "trash-delete-error" });
      logger.error("trash_delete_failed", {
        message,
        status: err?.status ?? null,
        errorCode: err?.errorCode ?? null,
        projectId,
        all: variables?.all === true,
      });
    },
  });
}

export default useTrashDelete;
