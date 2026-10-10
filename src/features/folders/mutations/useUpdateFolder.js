// [FSD Layer: features/folders/mutations] — Update folder mutation (1 hook / file).
// Body copied VERBATIM from features/folders/api/foldersApi.js useUpdateFolder.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Update (rename/move) an existing folder/collection.
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, patch, projectId: _projectId }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.patch(`/folders/${folderId}`, patch);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to update collection");
      }
      return res?.data ?? res;
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
