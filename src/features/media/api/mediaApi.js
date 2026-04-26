// [FSD Layer: features/media] — Server State (React Query)
// Canonical location for useAssets — do NOT import or redeclare in workflowsApi.js
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useUserLibrary({
  enabled = false,
  limit = 30,
  offset = 0,
  projectId,
  sessionId,
} = {}) {
  return useQuery({
    queryKey: queryKeys.library.user({ limit, offset, projectId: projectId || null, sessionId: sessionId || null }),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (projectId) params.set("project_id", projectId);
      if (sessionId) params.set("session_id", sessionId);

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

export function useInfiniteUserLibrary({
  enabled = false,
  limit = 30,
  projectId,
  sessionId,
} = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.library.user({
      limit,
      projectId: projectId || null,
      sessionId: sessionId || null,
      mode: "infinite",
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(pageParam),
      });

      if (projectId) params.set("project_id", projectId);
      if (sessionId) params.set("session_id", sessionId);

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


export function useBatchUploadAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, projectId, sessionId }) => {
      if (!projectId) throw new Error("Project ID required");
      
      const results = await Promise.all(files.map(async (file) => {
        // Since we already calculated metadata in onMutate, we can pass it here or re-calculate.
        // To keep it simple and parallel, we re-calculate if needed, or better, pass a metadata map.
        const metadata = await getMediaMetadata(file); 
        const formData = new FormData();
        formData.append("file", file);
        formData.append("project_id", projectId);
        formData.append("session_id", sessionId || "");
        if (metadata) formData.append("metadata", JSON.stringify(metadata));
        return api.postForm("/assets/upload", formData);
      }));
      
      return results;
    },

    onMutate: async ({ files, projectId, sessionId }) => {
      const generationsKey = queryKeys.generations.byProject(projectId, sessionId);
      const projectDataKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: generationsKey });
      await queryClient.cancelQueries({ queryKey: projectDataKey });

      const previousGenerations = queryClient.getQueryData(generationsKey);
      const previousProjectData  = queryClient.getQueryData(projectDataKey);

      const optimisticWorkflows = [];
      const optimisticMediaItems = [];
      const optimisticEntries = [];
      const localUrls = [];

      // Parallelize metadata extraction
      const metadatas = await Promise.all(files.map(f => getMediaMetadata(f)));

      files.forEach((file, idx) => {
        const metadata = metadatas[idx];
        const optimisticId = `optimistic-upload-${Date.now()}-${idx}`;
        const isVideo = file.type.startsWith('video/');
        const localUrl = URL.createObjectURL(file);
        localUrls.push(localUrl);

        // Timeline format
        optimisticEntries.push({
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
              mime_type:  file.type || 'image/jpeg',
              asset_type: 'uploaded',
              media_type: isVideo ? 'video' : 'image',
              meta_data: metadata,
            }
          }]
        });

        // ProjectData format
        optimisticWorkflows.push({
          name:          optimisticId,
          projectId:     projectId,
          workflow_type: 'GENERATION',
          metadata: {
            displayName:    isVideo ? 'Vidéo importée' : 'Image importée',
            createTime:     new Date().toISOString(),
            primaryMediaId: `${optimisticId}-item`,
            sessionId:      sessionId,
            favorited:      false,
          },
        });

        optimisticMediaItems.push({
          id:             `${optimisticId}-item`,
          name:           `${optimisticId}-item`,
          url:            localUrl,
          status:         'uploading',
          projectId:      projectId,
          workflowId:     optimisticId,
          workflowStepId: 'upload',
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: 'PRIVATE',
          },
          [isVideo ? 'video' : 'image']: {
            dimensions: metadata ? { width: metadata.width, height: metadata.height } : { width: 1024, height: 1024 },
            [isVideo ? 'generatedVideo' : 'generatedImage']: null,
          }
        });
      });

      // Apply Updates to all matching queries
      queryClient.setQueriesData({ queryKey: queryKeys.generations.all() }, (old) => {
        const list = Array.isArray(old) ? old : (old?.data ?? []);
        return [...optimisticEntries, ...list];
      });

      queryClient.setQueriesData({ queryKey: ["projectData", projectId] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          projectContents: {
            ...old.projectContents,
            workflows: [...optimisticWorkflows,  ...(old.projectContents?.workflows || [])],
            media:     [...optimisticMediaItems, ...(old.projectContents?.media     || [])],
          }
        };
      });

      return { previousGenerations, previousProjectData, generationsKey, projectDataKey, localUrls };
    },

    onError: (_err, _vars, context) => {
      if (context?.generationsKey && context?.previousGenerations !== undefined) {
        queryClient.setQueryData(context.generationsKey, context.previousGenerations);
      }
      if (context?.projectDataKey && context?.previousProjectData !== undefined) {
        queryClient.setQueryData(context.projectDataKey, context.previousProjectData);
      }
      context?.localUrls?.forEach(url => URL.revokeObjectURL(url));
    },

    onSettled: (_data, _err, variables, context) => {
      context?.localUrls?.forEach(url => URL.revokeObjectURL(url));
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(variables.projectId, variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
    },
  });
}

export function useRemoveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, projectId }) => {
      const res = await api.delete(`/assets/${assetId}`);
      if (res.ok === false) throw new Error(res.error || 'Failed to delete asset');
      return res;
    },

    onMutate: async ({ assetId, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              media: (old.projectContents?.media || []).filter(
                m => m.id !== assetId && m.name !== assetId
              )
            }
          };
        });
      }

      return { previousData, projectKey };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },

    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
    },
  });
}
