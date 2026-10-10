// [FSD Layer: features/workflows/api/mutations] — Toggle workflow like (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useToggleWorkflowLike.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useToggleWorkflowLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowIds, favorited, projectId } = {}) => {
      const normalizedIds = Array.isArray(workflowIds)
        ? workflowIds.filter(Boolean)
        : [workflowId].filter(Boolean);

      if (normalizedIds.length === 0) throw new Error("workflowId is required");

      const res = normalizedIds.length === 1
        ? await api.patch(`/workflows/workflows/${normalizedIds[0]}/like`)
        : await api.patch(`/workflows/workflows/like`, {
            workflow_ids: normalizedIds,
            ...(favorited !== undefined ? { favorited: !!favorited } : {}),
          });

      if (!res.ok) throw new Error(res.message);
      return normalizedIds;
    },
    onMutate: async ({ workflowId, workflowIds, favorited, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);
      const normalizedIds = Array.isArray(workflowIds)
        ? workflowIds.filter(Boolean)
        : [workflowId].filter(Boolean);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.workflows) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: old.projectContents.workflows.map((wf) => {
                if (normalizedIds.includes(wf.id) || normalizedIds.includes(wf.name)) {
                  return {
                    ...wf,
                    metadata: {
                      ...(wf.metadata || {}),
                      favorited: favorited !== undefined ? favorited : !wf.metadata?.favorited,
                    },
                  };
                }
                return wf;
              }),
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },
  });
}
