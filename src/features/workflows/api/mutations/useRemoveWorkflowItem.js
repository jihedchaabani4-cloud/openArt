// [FSD Layer: features/workflows/api/mutations] — Remove single workflow item (1 hook/file).
// Optimistically removes item from projectData cache with cascade cleanup.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useRemoveWorkflowItem() {
  return useOptimisticMutation({
    mutationFn: async ({ itemId }) => {
      const res = await api.delete(`/workflows/items/${itemId}`);
      if (!res.ok) throw new Error(res.message || 'Failed to remove item');
      return itemId;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getMutationKey: ({ itemId }) => ['removeWorkflowItem', itemId],
    applyOptimistic: (old, { itemId }) => {
      if (!old?.projectContents?.media) return old;
      const targetMedia = (old.projectContents.media || []).find((m) => matchMediaId(m, itemId));
      const targetWfId = targetMedia?.workflowId || targetMedia?.workflow_id;

      const updatedMedia = (old.projectContents.media || []).filter((m) => !matchMediaId(m, itemId));

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
    errorMessage: 'Failed to remove workflow item. Changes were reverted.',
  });
}

export default useRemoveWorkflowItem;
