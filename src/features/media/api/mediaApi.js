// [FSD Layer: features/media] — Server State (React Query)
// Canonical location for useAssets — do NOT import or redeclare in generationsApi.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api} from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

const LIMIT = 30;

// ── Helper: extract width/height/ratio from file before upload ──────────────
function getMediaMetadata(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    const cleanup = (meta) => { URL.revokeObjectURL(url); resolve(meta); };

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const { videoWidth: w, videoHeight: h } = video;
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const d = gcd(w, h);
        cleanup({ width: w, height: h, ratio: `${w/d}:${h/d}`, size: `${w}x${h}` });
      };
      video.onerror = () => cleanup(null);
      video.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const d = gcd(w, h);
        cleanup({ width: w, height: h, ratio: `${w/d}:${h/d}`, size: `${w}x${h}` });
      };
      img.onerror = () => cleanup(null);
      img.src = url;
    }
  });
}

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

export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, projectId, sessionId, metadata }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId || "");
      formData.append("session_id", sessionId || "");
      if (metadata) formData.append("metadata", JSON.stringify(metadata));
      return await api.postForm("/assets/upload", formData);
    },

    // ── Optimistic Update: inject a 'uploading' entry into the timeline cache ──
    onMutate: async ({ file, projectId, sessionId }) => {
      const queryKey = queryKeys.generations.byProject(projectId, sessionId);

      // Extract real dimensions first for accurate aspect ratio preview
      const metadata = await getMediaMetadata(file);

      // Cancel any in-flight refetches so they don't overwrite our optimistic entry
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current data so we can roll back on error
      const previousData = queryClient.getQueryData(queryKey);

      // Build the synthetic optimistic entry
      const optimisticId = `optimistic-upload-${Date.now()}`;
      const isVideo = file?.type?.startsWith('video/');
      const localUrl = file ? URL.createObjectURL(file) : null;

      const optimisticEntry = {
        feed_type:       'upload',
        id:              optimisticId,
        type:            isVideo ? 'video' : 'image',
        status:          'uploading',
        model:           null,
        model_label:     'Upload',
        model_icon_url:  null,
        params:          { prompt: isVideo ? 'Vidéo importée' : 'Image importée' },
        session_id:      sessionId,
        created_at:      new Date().toISOString(),
        items: [{
          id:         `${optimisticId}-item`,
          index:      0,
          status:     'uploading',
          is_liked:   false,
          duration_ms: 0,
          asset: {
            id:         optimisticId,
            file_url:   localUrl,
            mime_type:  file?.type || 'image/jpeg',
            asset_type: 'uploaded',
            media_type: isVideo ? 'video' : 'image',
            meta_data: metadata,  // ← use DB column name for correct ratio in displayUtils
          }
        }]
      };

      // Inject it at the beginning of the cached list (newest first)
      queryClient.setQueryData(queryKey, (old) => {
        const list = Array.isArray(old) ? old : (old?.data ?? []);
        return [optimisticEntry, ...list];
      });

      return { previousData, queryKey, localUrl };
    },

    // ── Roll back on error ──────────────────────────────────────────────────────
    onError: (_err, _vars, context) => {
      if (context?.queryKey && context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      if (context?.localUrl) URL.revokeObjectURL(context.localUrl);
    },

    // ── Always refetch & clean up object URL after completion ──────────────────
    onSettled: (_data, _err, variables, context) => {
      if (context?.localUrl) URL.revokeObjectURL(context.localUrl);
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.generations.byProject(variables.projectId, variables.sessionId),
      });
    },
  });
}

export function useRemoveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId }) => {
      const res = await api.delete(`/assets/${assetId}`);
      if (res.ok === false) throw new Error(res.error || 'Failed to delete asset');
      return res;
    },

    onMutate: async ({ assetId }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.generations.all });

      // Snapshot current data for fallback
      const previousGenerations = queryClient.getQueriesData({ queryKey: queryKeys.generations.all });

      // Optimistically update the caches
      queryClient.setQueriesData({ queryKey: queryKeys.generations.all }, (old) => {
        const list = Array.isArray(old) ? old : (old?.data ?? []);
        return list.filter(item => item.id !== assetId);
      });

      return { previousGenerations };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousGenerations) {
        context.previousGenerations.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all });
    },
  });
}
