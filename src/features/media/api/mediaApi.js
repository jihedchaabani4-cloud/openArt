// [FSD Layer: features/media] — Server State (React Query)
// Canonical location for useAssets — do NOT import or redeclare in workflowsApi.js
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api} from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { downloadBlob } from '@/shared/lib/utils';
import { intrinsicSizeToRatioLabel, setCachedImageDimensions } from '@/shared/lib/displayUtils';

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
        const ratio = intrinsicSizeToRatioLabel(w, h);
        cleanup({ width: w, height: h, ratio, size: `${w}x${h}` });
      };
      video.onerror = () => cleanup(null);
      video.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const ratio = intrinsicSizeToRatioLabel(w, h);
        cleanup({ width: w, height: h, ratio, size: `${w}x${h}` });
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

export function useLibraryWorkflowDetail(workflowId, { enabled = false, initialData } = {}) {
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
    mutationFn: async ({ files, projectId }) => {
      if (!projectId) throw new Error("Project ID required");
      
      const results = await Promise.all(files.map(async (file) => {
        // Since we already calculated metadata in onMutate, we can pass it here or re-calculate.
        // To keep it simple and parallel, we re-calculate if needed, or better, pass a metadata map.
        const metadata = await getMediaMetadata(file); 
        const formData = new FormData();
        formData.append("file", file);
        formData.append("project_id", projectId);
        formData.append("workflow_type", "UPLOAD");
        formData.append("workflowType", "UPLOAD");
        formData.append("type", "upload");
        formData.append("source", "upload");
        if (metadata?.width && metadata?.height) {
          formData.append("width", String(metadata.width));
          formData.append("height", String(metadata.height));
          formData.append("ratio", metadata.ratio || "");
        }
        const res = await api.postForm("/assets/upload", formData);
        if (res?.url && (res?.width || metadata?.width) && (res?.height || metadata?.height)) {
          setCachedImageDimensions(
            res.url,
            res.width || metadata.width,
            res.height || metadata.height
          );
        }
        return res;
      }));
      
      return results;
    },

    onMutate: async ({ files, projectId }) => {
      const generationsKey = queryKeys.generations.byProject(projectId);
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

        if (metadata?.width && metadata?.height) {
          setCachedImageDimensions(localUrl, metadata.width, metadata.height);
        }

        const resolvedRatio = metadata?.ratio || (isVideo ? "16:9" : "1:1");
        const resolvedWidth = metadata?.width || (isVideo ? 1280 : 1024);
        const resolvedHeight = metadata?.height || (isVideo ? 720 : 1024);

        // Timeline format
        optimisticEntries.push({
          feed_type:       'upload',
          id:              optimisticId,
          type:            isVideo ? 'video' : 'image',
          status:          'uploading',
          model:           null,
          model_label:     'Upload',
          model_icon_url:  null,
          params:          { prompt: isVideo ? 'Vidéo importée' : 'Image importée', ratio: resolvedRatio },
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
          workflow_type: 'UPLOAD',
          workflowType:  'UPLOAD',
          is_upload:     true,
          type:          'upload',
          metadata: {
            displayName:    isVideo ? 'Vidéo importée' : 'Image importée',
            createTime:     new Date().toISOString(),
            primaryMediaId: `${optimisticId}-item`,
            favorited:      false,
            source:         'upload',
            isUpload:       true,
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
          workflow_type:  'UPLOAD',
          workflowType:   'UPLOAD',
          is_upload:      true,
          type:           'upload',
          source:         'upload',
          width:          resolvedWidth,
          height:         resolvedHeight,
          ratio:          resolvedRatio,
          aspectRatio:    resolvedRatio,
          params: {
            ratio:        resolvedRatio,
            aspectRatio:  resolvedRatio,
            width:        resolvedWidth,
            height:       resolvedHeight,
          },
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: 'PRIVATE',
          },
          [isVideo ? 'video' : 'image']: {
            dimensions: { width: resolvedWidth, height: resolvedHeight },
            userUploadedImage: {
              aspectRatio: resolvedRatio,
            },
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
      // Delay blob URL revocation to avoid image flicker while real server data loads
      setTimeout(() => {
        context?.localUrls?.forEach(url => URL.revokeObjectURL(url));
      }, 2000);
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(variables.projectId) });
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
          const targetMedia = (old.projectContents?.media || []).find(m => m.id === assetId || m.name === assetId);
          const targetWfId = targetMedia?.workflowId || targetMedia?.workflow_id;

          const updatedMedia = (old.projectContents?.media || []).filter(
            m => m.id !== assetId && m.name !== assetId
          );

          const hasRemainingMedia = targetWfId 
            ? updatedMedia.some(m => (m.workflowId || m.workflow_id) === targetWfId) 
            : true;

          const updatedWorkflows = (old.projectContents?.workflows || []).filter(wf => {
            if (!targetWfId) return true;
            const wfId = wf.name || wf.id;
            return wfId !== targetWfId || hasRemainingMedia;
          });

          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              media: updatedMedia,
              workflows: updatedWorkflows,
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

/**
 * Downloads a single media item.
 * @param {string} url - The absolute URL of the media
 * @param {string} filename - The output filename
 */
export async function downloadMediaItem(url, filename) {
  try {
    const blob = await api.getBlob(url);
    downloadBlob(blob, filename);
  } catch (error) {
    console.error("❌ Download failed:", error);
    // Fallback: just open in new tab if blob fetch fails (e.g. CORS)
    window.open(url, "_blank");
  }
}

