// [FSD Layer: features/elements/hooks] — Delete element media item (1 hook/file).
// Optimistically removes media item from projectData cache.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { matchMediaId } from "@/features/workflows/lib/cacheHelpers";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useDeleteMediaItem
 * Deletes a media item from an element/workflow.
 */
export function useDeleteMediaItem() {
  return useOptimisticMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getMutationKey: ({ mediaId }) => ['deleteElementMedia', mediaId],
    applyOptimistic: (old, { mediaId }) => {
      if (!old?.projectContents?.media) return old;
      const targetMedia = (old.projectContents.media || []).find((m) => matchMediaId(m, mediaId));
      const targetWfId = targetMedia?.workflowId || targetMedia?.workflow_id;

      const updatedMedia = (old.projectContents.media || []).filter((m) => !matchMediaId(m, mediaId));

      const hasRemainingMedia = targetWfId
        ? updatedMedia.some((m) => (m.workflowId || m.workflow_id) === targetWfId)
        : true;

      const updatedWorkflows = (old.projectContents.workflows || []).filter((wf) => {
        if (!targetWfId) return true;
        const wfId = wf.name || wf.id;
        return wfId !== targetWfId || hasRemainingMedia;
      });

      return {
        ...old,
        projectContents: {
          ...old.projectContents,
          media: updatedMedia,
          workflows: updatedWorkflows,
        },
      };
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      ['workflows'],
    ],
    errorMessage: "Failed to delete element media. Changes were reverted.",
  });
}

export default useDeleteMediaItem;
