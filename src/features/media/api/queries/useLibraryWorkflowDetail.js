// [FSD Layer: features/media/api/queries] — Single library workflow detail query (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useLibraryWorkflowDetail.
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useLibraryWorkflowDetail(workflowId, { enabled = true, initialData } = {}) {
  return useQuery({
    queryKey: queryKeys.library.detail(workflowId),
    queryFn: async () => {
      const res = await api.get(`/workflows/library/${workflowId}`);
      if (res.ok === false || res.success === false) {
        throw new Error(res.message || "Failed to fetch workflow details");
      }

      return res.data ?? null;
    },
    enabled: !!workflowId && enabled,
    staleTime: 60_000,
    initialData,
  });
}
