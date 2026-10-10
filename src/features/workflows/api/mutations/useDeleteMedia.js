// [FSD Layer: features/workflows/api/mutations] — Delete media mutation (1 hook/file).
// Optimistically removes media from projectData cache with workflow cascade cleanup.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';
import { mediaEntity } from '@/shared/lib/optimistic/entityKeys';

export function useDeleteMedia() {
  return useOptimisticMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      if (!res.ok) throw new Error(res.message || 'Failed to delete media');
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getEntityKey: ({ mediaId }) => mediaEntity(mediaId),
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
    errorMessage: 'Failed to delete media. Changes were reverted.',
  });
}

export default useDeleteMedia;
