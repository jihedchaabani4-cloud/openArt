// [FSD Layer: features/folders/mutations] — Delete folder mutation (1 hook / file).
// Optimistically removes folder from cache immediately, moves non-failed folder workflows to Trash
// while excluding failed-only workflows from Trash, and rolls back on FOLDER_NOT_EMPTY or 409 MEDIA_PROCESSING.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import { folderEntity } from "@/shared/lib/optimistic/entityKeys";
import {
  matchFolderId,
  patchWorkflowFolder,
  removeById,
} from "@/shared/lib/optimistic/cacheOps";
import {
  areAllWorkflowMediaFailed,
  isMediaProcessingConflictError,
  getMediaProcessingConflictMessage,
} from "@/features/workflows/lib/mediaStatusHelpers";

function cleanWorkflowId(id) {
  return String(id || "")
    .trim()
    .replace(/^workflows\//, "");
}

function isWorkflowInFolder(wf, targetFolderId) {
  if (!wf || !targetFolderId) return false;
  const target = String(targetFolderId);
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
  return candidates.some((c) => c != null && String(c) === target);
}

/**
 * Delete a folder/collection.
 * Optimistically removes folder from query cache.
 */
export function useDeleteFolder() {
  return useOptimisticMutation({
    mutationFn: async ({ folderId }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.delete(`/folders/${folderId}`);
      if (res?.ok === false || res?.success === false) {
        const err = new Error(res?.message || res?.error || "Failed to delete collection");
        if (res?.status || res?.statusCode) err.status = res.status || res.statusCode;
        if (res?.errorCode || res?.code) err.errorCode = res.errorCode || res.code;
        throw err;
      }
      return folderId;
    },
    getCacheKeys: ({ projectId }) =>
      projectId
        ? [queryKeys.folders.byProject(projectId), queryKeys.projectData.byProject(projectId)]
        : [],
    getEntityKey: ({ folderId }) => folderEntity(folderId),
    applyOptimistic: (oldData, { folderId }) => {
      if (Array.isArray(oldData)) {
        return removeById(oldData, folderId, matchFolderId);
      }

      if (oldData?.projectContents) {
        const pc = oldData.projectContents;
        const currentCols = pc.collections || pc.folders || [];
        const updated = removeById(currentCols, folderId, matchFolderId);

        const nextProjectContents = {
          ...pc,
          collections: updated,
          folders: updated,
        };

        if (Array.isArray(pc.workflows)) {
          const currentMedia = Array.isArray(pc.media) ? pc.media : [];
          const currentTrashed = Array.isArray(pc.trashedWorkflows)
            ? pc.trashedWorkflows
            : [];
          const existingTrashedIds = new Set(
            currentTrashed
              .map((w) => cleanWorkflowId(w?.id || w?.name))
              .filter(Boolean)
          );
          const nowIso = new Date().toISOString();
          const newlyTrashed = [];
          const removedWfIds = new Set();
          const nextWorkflows = [];

          for (const wf of pc.workflows) {
            if (!isWorkflowInFolder(wf, folderId)) {
              nextWorkflows.push(wf);
              continue;
            }

            const cleanId = cleanWorkflowId(wf?.id || wf?.name);
            if (cleanId) removedWfIds.add(cleanId);

            const wfMedia = currentMedia.filter(
              (m) =>
                cleanWorkflowId(
                  m?.workflowId || m?.workflow_id || m?.workflowName
                ) === cleanId
            );

            // Failed-only workflows skip Trash
            if (areAllWorkflowMediaFailed(wf, wfMedia)) {
              continue;
            }

            if (cleanId && !existingTrashedIds.has(cleanId)) {
              existingTrashedIds.add(cleanId);
              const cleared = patchWorkflowFolder(wf, null);
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
          }

          nextProjectContents.workflows = nextWorkflows;
          if (Array.isArray(pc.trashedWorkflows) || newlyTrashed.length > 0) {
            nextProjectContents.trashedWorkflows = [
              ...newlyTrashed,
              ...currentTrashed,
            ];
          }
          if (Array.isArray(pc.media) && removedWfIds.size > 0) {
            nextProjectContents.media = currentMedia.filter((m) => {
              const mWf = cleanWorkflowId(
                m?.workflowId || m?.workflow_id || m?.workflowName
              );
              return !mWf || !removedWfIds.has(mWf);
            });
          }
        }

        return {
          ...oldData,
          projectContents: nextProjectContents,
        };
      }

      return oldData;
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId
        ? [queryKeys.folders.byProject(projectId), queryKeys.projectData.byProject(projectId)]
        : []),
      queryKeys.folders.all(),
    ],
    errorMessage: (err) => {
      if (isMediaProcessingConflictError(err)) {
        return getMediaProcessingConflictMessage(err);
      }
      return err?.message === "FOLDER_NOT_EMPTY"
        ? "Cannot delete collection: it contains items or sub-collections."
        : "Failed to delete collection. Changes were reverted.";
    },
  });
}

export default useDeleteFolder;
