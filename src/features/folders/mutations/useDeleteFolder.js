// [FSD Layer: features/folders/mutations] — Delete folder mutation (1 hook / file).
// Optimistically removes folder from cache immediately, rolls back if FOLDER_NOT_EMPTY.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
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
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.folders.byProject(projectId)] : []),
    getMutationKey: ({ folderId }) => ["deleteFolder", folderId],
    applyOptimistic: (oldFolders, { folderId }) => {
      return removeById(oldFolders, folderId, matchFolderId);
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
