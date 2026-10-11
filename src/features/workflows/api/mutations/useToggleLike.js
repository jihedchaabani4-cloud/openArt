// [FSD Layer: features/workflows/api/mutations] — Toggle media item like (1 hook/file).
// Optimistically toggles is_liked and is_Like; rolls back on error.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';
import { mediaEntity } from '@/shared/lib/optimistic/entityKeys';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useToggleLike() {
  return useOptimisticMutation({
    mutationFn: async ({ itemId }) => {
      const res = await api.patch(`/workflows/items/${itemId}/like`);
      if (!res.ok) throw new Error(res.message || "Failed to toggle like");
      return itemId;
    },

    getEntityKey: ({ itemId }) => mediaEntity(itemId),

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { itemId }) => {
      if (!oldData?.projectContents?.media) return oldData;
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          media: oldData.projectContents.media.map((m) => {
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
    },

    invalidateKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    errorMessage: "Failed to update like. Changes were reverted.",
  });
}

export default useToggleLike;
