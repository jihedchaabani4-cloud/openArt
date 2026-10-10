// [FSD Layer: features/folders/mutations] — Move asset to folder mutation (1 hook / file).
// Body copied VERBATIM from features/folders/api/foldersApi.js useMoveAssetToFolder.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Move a workflow asset to a folder (or null for root).
 */
export function useMoveAssetToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, folderId = null, projectId: _projectId }) => {
      if (!assetId) throw new Error("Asset ID is required");
      const res = await api.patch(`/assets/${assetId}/folder`, {
        folderId: folderId || null,
      });
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to move asset");
      }
      return res?.data ?? res;
    },
    onSuccess: (_, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}
