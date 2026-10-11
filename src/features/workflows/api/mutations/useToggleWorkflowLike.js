// [FSD Layer: features/workflows/api/mutations] — Toggle workflow like (1 hook/file).
// Optimistically toggles metadata.favorited; rolls back on error.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchWorkflowId } from '@/shared/lib/optimistic/cacheOps';
import { workflowEntity } from '@/shared/lib/optimistic/entityKeys';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useToggleWorkflowLike() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId, workflowIds, favorited } = {}) => {
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

      if (!res.ok) throw new Error(res.message || "Failed to toggle workflow like");
      return normalizedIds;
    },

    getEntityKey: ({ workflowId, workflowIds }) => {
      const targetId = workflowId || (Array.isArray(workflowIds) ? workflowIds[0] : null);
      return targetId ? workflowEntity(targetId) : null;
    },

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { workflowId, workflowIds, favorited }) => {
      if (!oldData?.projectContents?.workflows) return oldData;
      const normalizedIds = Array.isArray(workflowIds)
        ? workflowIds.filter(Boolean)
        : [workflowId].filter(Boolean);

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: oldData.projectContents.workflows.map((wf) => {
            if (normalizedIds.some((id) => matchWorkflowId(wf, id))) {
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
    },

    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      queryKeys.library.all(),
    ],

    errorMessage: "Failed to update favorite status. Changes were reverted.",
  });
}

export default useToggleWorkflowLike;
