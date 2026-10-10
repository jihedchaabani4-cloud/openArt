// [FSD Layer: features/folders/mutations] — Delete folder mutation (1 hook / file).
// Body copied VERBATIM from features/folders/api/foldersApi.js useDeleteFolder.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Delete a folder/collection.
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, projectId: _projectId }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.delete(`/folders/${folderId}`);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to delete collection");
      }
      return folderId;
    },
    onSuccess: (_, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}
