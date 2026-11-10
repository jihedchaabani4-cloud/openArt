// [FSD Layer: features/folders/mutations] — Delete folder mutation (1 hook / file).
// Optimistically removes folder from cache immediately, rolls back if FOLDER_NOT_EMPTY.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import { folderEntity } from "@/shared/lib/optimistic/entityKeys";
import { matchFolderId, removeById } from "@/shared/lib/optimistic/cacheOps";

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
        throw new Error(res?.message || res?.error || "Failed to delete collection");
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
        const currentCols = oldData.projectContents.collections || oldData.projectContents.folders || [];
        const updated = removeById(currentCols, folderId, matchFolderId);
        return {
          ...oldData,
          projectContents: {
            ...oldData.projectContents,
            collections: updated,
            folders: updated,
          },
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
    errorMessage: (err) =>
      err?.message === "FOLDER_NOT_EMPTY"
        ? "Cannot delete collection: it contains items or sub-collections."
        : "Failed to delete collection. Changes were reverted.",
  });
}

export default useDeleteFolder;
