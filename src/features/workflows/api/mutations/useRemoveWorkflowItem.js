// [FSD Layer: features/workflows/api/mutations] — Remove single workflow item (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useRemoveWorkflowItem.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useRemoveWorkflowItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId }) => {
      const res = await api.delete(`/workflows/items/${itemId}`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}
