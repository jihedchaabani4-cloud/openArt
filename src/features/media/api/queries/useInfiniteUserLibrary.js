// [FSD Layer: features/media/api/queries] — Infinite-scroll user library query (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useInfiniteUserLibrary.
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useInfiniteUserLibrary({
  enabled = false,
  limit = 30,
  projectId,
} = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.library.user({
      limit,
      projectId: projectId || null,
      mode: "infinite",
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(pageParam),
      });

      if (projectId) params.set("project_id", projectId);

      const res = await api.get(`/workflows/library?${params.toString()}`);
      if (res.ok === false || res.success === false) {
        throw new Error(res.message || "Failed to fetch library");
      }

      const pageData = res.data ?? [];
      const hasMore = res.hasMore ?? pageData.length === limit;

      return {
        data: pageData,
        total: res.total ?? 0,
        hasMore,
        nextOffset: hasMore ? pageParam + limit : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled,
    staleTime: 60_000,
  });
}
