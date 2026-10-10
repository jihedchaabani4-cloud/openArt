// [FSD Layer: features/media/api/mutations] — Multi-file upload mutation (1 hook / file).
// Body copied VERBATIM from features/media/api/mediaApi.js useBatchUploadAssets + getMediaMetadata helper.
// Optimistic blob URLs, cache snapshots, and delayed URL revocation are preserved byte-for-byte.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { intrinsicSizeToRatioLabel, setCachedImageDimensions } from '@/shared/lib/displayUtils';

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

export function useBatchUploadAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, projectId, folderId, collectionId }) => {
      if (!projectId) throw new Error("Project ID required");
      const effectiveFolderId = folderId || collectionId || null;

      const results = await Promise.all(files.map(async (file) => {
        // Since we already calculated metadata in onMutate, we can pass it here or re-calculate.
        // To keep it simple and parallel, we re-calculate if needed, or better, pass a metadata map.
        const metadata = await getMediaMetadata(file);
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("workflow_type", "UPLOAD");
        formData.append("workflowType", "UPLOAD");
        formData.append("type", "upload");
        formData.append("source", "upload");
        if (effectiveFolderId) {
          formData.append("folder_id", effectiveFolderId);
          formData.append("folderId", effectiveFolderId);
          formData.append("collection_id", effectiveFolderId);
          formData.append("collectionId", effectiveFolderId);
        }
        if (metadata?.width && metadata?.height) {
          formData.append("width", String(metadata.width));
          formData.append("height", String(metadata.height));
          formData.append("ratio", metadata.ratio || "");
        }
        formData.append("file", file);
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

    onMutate: async ({ files, projectId, folderId, collectionId }) => {
      const effectiveFolderId = folderId || collectionId || null;
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

        // ProjectData format — all 4 folder_id variants written so folder filtering works immediately
        optimisticWorkflows.push({
          name:          optimisticId,
          projectId:     projectId,
          folder_id:     effectiveFolderId,
          folderId:      effectiveFolderId,
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
            folder_id:      effectiveFolderId,
            folderId:       effectiveFolderId,
          },
        });

        optimisticMediaItems.push({
          id:             `${optimisticId}-item`,
          name:           `${optimisticId}-item`,
          url:            localUrl,
          status:         'uploading',
          projectId:      projectId,
          folder_id:      effectiveFolderId,
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
      if (variables?.folderId || variables?.collectionId) {
        queryClient.invalidateQueries({ queryKey: ["folders"] });
      }
    },
  });
}
