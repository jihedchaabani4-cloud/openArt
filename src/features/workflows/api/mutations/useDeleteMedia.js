// [FSD Layer: features/workflows/api/mutations] — Delete media mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useDeleteMedia.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      if (!res.ok) throw new Error(res.message || 'Failed to delete media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}
