// [FSD Layer: features/folders/mutations] — Update folder mutation (1 hook / file).
// Optimistically updates folder name and/or parentId in cache.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import { matchFolderId, patchFolderName, patchFolderParent } from "@/shared/lib/optimistic/cacheOps";

/**
 * Update (rename/move) an existing folder/collection.
 * Optimistically updates folders query with name and/or parentId.
 */
export function useUpdateFolder() {
  return useOptimisticMutation({
    mutationFn: async ({ folderId, patch }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.patch(`/folders/${folderId}`, patch);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to update collection");
      }
      return res?.data ?? res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.folders.byProject(projectId)] : []),
    getMutationKey: ({ folderId }) => ["updateFolder", folderId],
    applyOptimistic: (oldFolders, { folderId, patch }) => {
      if (!Array.isArray(oldFolders)) return oldFolders;
      return oldFolders.map((f) => {
        if (matchFolderId(f, folderId)) {
          let updated = f;
          if (patch?.name !== undefined) {
            updated = patchFolderName(updated, patch.name);
          }
          if (patch?.parentId !== undefined || patch?.parent_id !== undefined) {
            const pId = patch.parentId !== undefined ? patch.parentId : patch.parent_id;
            updated = patchFolderParent(updated, pId);
          }
          return { ...updated, ...patch };
        }
        return f;
      });
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId
        ? [queryKeys.folders.byProject(projectId), queryKeys.projectData.byProject(projectId)]
        : []),
      queryKeys.folders.all(),
    ],
    errorMessage: (err) =>
      err?.message === "FOLDER_CYCLE"
        ? "Cannot move a collection inside itself or its children."
        : "Failed to update collection. Changes were reverted.",
  });
}

export default useUpdateFolder;
