// [FSD Layer: features/workflows/api/mutations] — Toggle media item like (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useToggleLike.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, projectId }) => {
      const res = await api.patch(`/workflows/items/${itemId}/like`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onMutate: async ({ itemId, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.media) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              media: old.projectContents.media.map((m) => {
                if (matchMediaId(m, itemId)) {
                  return {
                    ...m,
                    is_liked: !m.is_liked,
                    is_Like: !m.is_Like, // Support both naming conventions found in UI
                  };
                }
                return m;
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
    },
  });
}
