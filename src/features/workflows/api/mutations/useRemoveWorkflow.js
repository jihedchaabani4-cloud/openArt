// [FSD Layer: features/workflows/api/mutations] — Remove workflow mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useRemoveWorkflow.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useRemoveWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowIds, projectId }) => {
      const ids = workflowIds || (workflowId ? [workflowId] : []);
      if (ids.length === 0) throw new Error("workflowId is required");

      const res = ids.length === 1
        ? await api.delete(`/workflows/workflows/${ids[0]}`)
        : await api.delete(`/workflows/workflows`, {
            body: JSON.stringify({ workflow_ids: ids }),
          });

      if (!res.ok) throw new Error(res.message);
      return ids;
    },

    onMutate: async ({ workflowId, workflowIds, projectId }) => {
      if (!projectId) return {};
      const idsToRemove = workflowIds || (workflowId ? [workflowId] : []);
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: (old.projectContents?.workflows || []).filter(
                wf => !idsToRemove.includes(wf.id) && !idsToRemove.includes(wf.name)
              ),
              media: (old.projectContents?.media || []).filter(
                m => !idsToRemove.includes(m.workflowId)
              )
            }
          };
        });
      }

      return { previousData, projectKey, projectId };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },

    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },
  });
}
