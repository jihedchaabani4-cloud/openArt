// [FSD Layer: features/workflows/api/mutations] — Extend video mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useExtendVideoMutation.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useWorkflowsStore } from '@/features/workflows/model/useWorkflowsStore';

export function useExtendVideoMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload }) => {
      const endpoint = '/video/extend';
      const res = await api.post(endpoint, payload, { timeout: 15000 });
      if (!res.ok) throw new Error(res.message || 'Video extension failed');
      return res;
    },
    onMutate: async () => {
      useWorkflowsStore.getState().fireScrollToTop();
    },
    onError: (err) => {
      console.error('❌ Video extend error:', err);
      onError?.(err);
    },
  });
}
