// [FSD Layer: features/media/api/queries] — Paginated assets query (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useAssets + LIMIT constant.
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

const LIMIT = 30;

/**
 * Lazy, paginated assets hook.
 * @param {string}  projectId
 * @param {object}  opts
 * @param {boolean} opts.enabled  - Set to true only when dialog opens
 * @param {number}  opts.offset   - Pagination offset (0, 30, 60…)
 */
export function useAssets(projectId, { enabled = false, offset = 0, type, mediaType } = {}) {
  return useQuery({
    queryKey: queryKeys.assets.byProject(projectId, offset, type, mediaType),
    queryFn: async () => {
      let url = `/generations/assets/${projectId}?limit=${LIMIT}&offset=${offset}`;
      if (type)      url += `&type=${type}`;
      if (mediaType) url += `&media_type=${mediaType}`;

      const res = await api.get(url);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch assets');
      return { data: res.data ?? [], hasMore: res.hasMore ?? false };
    },
    enabled: !!projectId && enabled, // lazy: only fetch when dialog is open
    staleTime: 60_000, // 60s — assets rarely change mid-session
  });
}
