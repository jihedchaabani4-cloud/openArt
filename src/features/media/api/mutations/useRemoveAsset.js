// [FSD Layer: features/media/api/mutations] — Delete asset mutation (1 hook / file).
// Optimistically removes asset with workflow cascade; rolls back on error.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';
import { mediaEntity } from '@/shared/lib/optimistic/entityKeys';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useRemoveAsset() {
  return useOptimisticMutation({
    mutationFn: async ({ assetId }) => {
      const res = await api.delete(`/assets/${assetId}`);
      if (res.ok === false) throw new Error(res.error || 'Failed to delete asset');
      return res;
    },

    getEntityKey: ({ assetId }) => mediaEntity(assetId),

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { assetId }) => {
      if (!oldData?.projectContents) return oldData;
      const targetMedia = (oldData.projectContents?.media || []).find((m) => matchMediaId(m, assetId));
      const targetWfId = targetMedia?.workflowId || targetMedia?.workflow_id;

      const updatedMedia = (oldData.projectContents?.media || []).filter(
        (m) => !matchMediaId(m, assetId)
      );

      const hasRemainingMedia = targetWfId
        ? updatedMedia.some((m) => (m.workflowId || m.workflow_id) === targetWfId)
        : true;

      const updatedWorkflows = (oldData.projectContents?.workflows || []).filter((wf) => {
        if (!targetWfId) return true;
        const wfId = wf.name || wf.id;
        return wfId !== targetWfId || hasRemainingMedia;
      });

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          media: updatedMedia,
          workflows: updatedWorkflows,
        },
      };
    },

    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      queryKeys.assets.all(),
      queryKeys.generations.all(),
    ],

    errorMessage: 'Failed to delete asset. Changes were reverted.',
  });
}

export default useRemoveAsset;
