// [FSD Layer: features/workflows/api/mutations] — Detach media as standalone workflow (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useDetachMedia.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useDetachMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, projectId, displayName }) => {
      const res = await api.post(`/workflows/detach-media`, {
        media_id: mediaId,
        project_id: projectId,
        display_name: displayName,
      });
      if (!res.ok) throw new Error(res.message || 'Failed to detach media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}
