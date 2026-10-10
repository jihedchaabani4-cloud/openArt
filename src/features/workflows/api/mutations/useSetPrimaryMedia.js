// [FSD Layer: features/workflows/api/mutations] — Set workflow primary media (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useSetPrimaryMedia.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, mediaId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/primary-media`, { media_id: mediaId });
      if (!res.ok) throw new Error(res.message || 'Failed to set primary media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}
