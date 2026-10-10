// [FSD Layer: features/folders/mutations] — Move asset to folder mutation (1 hook / file).
// Optimistically updates projectData cache across all 4 folder_id variants.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import { matchWorkflowId, patchWorkflowFolder } from "@/shared/lib/optimistic/cacheOps";

/**
 * Move a workflow asset to a folder (or null for root).
 * Optimistically updates projectData workflows with all 4 folder_id variants.
 */
export function useMoveAssetToFolder() {
  return useOptimisticMutation({
    mutationFn: async ({ assetId, folderId = null }) => {
      if (!assetId) throw new Error("Asset ID is required");
      const res = await api.patch(`/assets/${assetId}/folder`, {
        folderId: folderId || null,
      });
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to move asset");
      }
      return res?.data ?? res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getMutationKey: ({ assetId }) => ["moveAsset", assetId],
    applyOptimistic: (oldData, { assetId, folderId }) => {
      if (!oldData?.projectContents?.workflows) return oldData;
      const normalizedFolderId = folderId || null;
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: oldData.projectContents.workflows.map((wf) => {
            if (matchWorkflowId(wf, assetId)) {
              return patchWorkflowFolder(wf, normalizedFolderId);
            }
            return wf;
          }),
        },
      };
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId
        ? [queryKeys.projectData.byProject(projectId), queryKeys.folders.byProject(projectId)]
        : []),
      queryKeys.folders.all(),
    ],
    errorMessage: "Failed to move item to folder. Changes were reverted.",
  });
}

export default useMoveAssetToFolder;
