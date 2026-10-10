// [FSD Layer: features/media/api/mutations] — Delete asset mutation (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useRemoveAsset.
// Includes the cascade-workflow-removal optimistic patching (no media left = workflow removed).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';

export function useRemoveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, projectId }) => {
      const res = await api.delete(`/assets/${assetId}`);
      if (res.ok === false) throw new Error(res.error || 'Failed to delete asset');
      return res;
    },

    onMutate: async ({ assetId, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          const targetMedia = (old.projectContents?.media || []).find(m => matchMediaId(m, assetId));
          const targetWfId = targetMedia?.workflowId || targetMedia?.workflow_id;

          const updatedMedia = (old.projectContents?.media || []).filter(
            m => !matchMediaId(m, assetId)
          );

          const hasRemainingMedia = targetWfId
            ? updatedMedia.some(m => (m.workflowId || m.workflow_id) === targetWfId)
            : true;

          const updatedWorkflows = (old.projectContents?.workflows || []).filter(wf => {
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
            }
          };
        });
      }

      return { previousData, projectKey };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },

    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
    },
  });
}
