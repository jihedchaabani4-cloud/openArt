// [FSD Layer: features/workflows/api/mutations] — Set workflow primary media (1 hook/file).
// Optimistically updates primary media id in workflow.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchWorkflowId } from '@/shared/lib/optimistic/cacheOps';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';
import { workflowEntity } from '@/shared/lib/optimistic/entityKeys';

export function useSetPrimaryMedia() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId, mediaId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/primary-media`, { media_id: mediaId });
      if (!res.ok) throw new Error(res.message || 'Failed to set primary media');
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getEntityKey: ({ workflowId }) => workflowEntity(workflowId),
    applyOptimistic: (oldData, { workflowId, mediaId }) => {
      if (!oldData?.projectContents?.workflows) return oldData;
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: oldData.projectContents.workflows.map((wf) => {
            if (matchWorkflowId(wf, workflowId)) {
              return {
                ...wf,
                primary_media_id: mediaId,
                primaryMediaId: mediaId,
                metadata: {
                  ...(wf.metadata || {}),
                  primary_media_id: mediaId,
                  primaryMediaId: mediaId,
                },
              };
            }
            return wf;
          }),
        },
      };
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      ['workflows'],
    ],
    errorMessage: 'Failed to set cover photo. Changes were reverted.',
  });
}

export default useSetPrimaryMedia;
