// [FSD Layer: features/media/api/queries] — User library query (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useUserLibrary.
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useUserLibrary({
  enabled = false,
  limit = 30,
  offset = 0,
  projectId,
} = {}) {
  return useQuery({
    queryKey: queryKeys.library.user({ limit, offset, projectId: projectId || null }),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (projectId) params.set("project_id", projectId);

      const res = await api.get(`/workflows/library?${params.toString()}`);
      if (res.ok === false || res.success === false) {
        throw new Error(res.message || "Failed to fetch library");
      }

      return {
        data: res.data ?? [],
        total: res.total ?? 0,
        hasMore: res.hasMore ?? false,
      };
    },
    enabled,
    staleTime: 60_000,
  });
}
