// [FSD Layer: features/workflows] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useWorkflowsStore } from '../model/useWorkflowsStore';
import { normalizeProjectData } from '../model/domainNormalizer';
import { useAuthSession } from '@/shared/api/auth';

// ── Project Data (Unified Hook) ───────────────────────────────────────────────

/**
 * useProjectData:
 * The SINGLE source of truth for a project.
 * 
 * 🧠 Blueprint Layer: Pure Hook.
 * Logic is handled by the Layout (Control Layer).
 */
export function useProjectData(projectId) {
  const { data: user, isLoading: authLoading } = useAuthSession();
  const queryKey = queryKeys.projectData.byProject(projectId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `/workflows/project-data/${projectId}`;
      
      try {
        const res = await api.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });

        
        // Comprehensive check for all possible backend response structures
        const data = 
          res?.data?.data?.json || 
          res?.data?.json || 
          res?.result?.data?.json || 
          res?.json || 
          res?.data;

        if (data && (data.projectContents || data.projectName)) {
          if (data.projectContents?.workflows) {
            data.projectContents.workflows = data.projectContents.workflows.map(wf => {
              const isUploadWf = wf.workflow_type === 'UPLOAD' || wf.workflowType === 'UPLOAD' || wf.type === 'upload' || Boolean(wf.is_upload);
              return isUploadWf ? { ...wf, workflow_type: 'UPLOAD', workflowType: 'UPLOAD', is_upload: true, type: 'upload' } : wf;
            });
          }
          return data;
        }
        throw new Error('Project data structure invalid or not found');
      } catch (err) {
        throw err;
      }
    },
    enabled: !authLoading && !!user && !!projectId, // ⛔ Block until auth resolves
    // 🎯 SaaS Settings - 144Hz Instant Tab Switching & Cache
    staleTime: 30000, 
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const media = query.state.data?.projectContents?.media || [];
      const now = Date.now();
      const MAX_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes hard timeout failsafe

      const hasPending = media.some((m) => {
        const isProcessing = m.status === 'processing' || m.status === 'pending';
        if (!isProcessing) return false;

        const rawDate = m.create_time || m.createTime || m.created_at || m.mediaMetadata?.createTime || m.mediaMetadata?.create_time;
        if (!rawDate) return false;

        const createdMs = new Date(rawDate).getTime();
        if (!createdMs || isNaN(createdMs)) return false;

        // If elapsed time >= 10 minutes, stop polling (failsafe for stuck/abandoned backend jobs)
        if ((now - createdMs) >= MAX_PROCESSING_MS) {
          return false;
        }

        return true;
      });

      // 30s polling during generation; completely stops (false) when idle/finished
      return hasPending ? 30000 : false;
    },
    retry: false, // Don't hang forever on bad IDs
    throwOnError: false, // Controlled handling

  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useGenerateMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // ⛔ NEVER retry generation calls — prevent double-billing on network hiccups
    mutationFn: async ({ payload, isVideo }) => {
      // Explicit domain routing: Generated Image vs Generated Video
      const endpoint = isVideo ? '/video/generated' : '/images/generated';
      const res = await api.post(endpoint, payload, { timeout: 15000 }); // 15s timeout
      if (!res.ok) throw new Error(res.message || 'Workflow execution failed');
      return res;
    },

    onMutate: async ({ payload, isVideo }) => {
      useWorkflowsStore.getState().fireScrollToTop();
      
      const projectId = payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-gen-${Date.now()}`;

        const optimisticWorkflow = {
          name: optimisticId,
          projectId: projectId,
          workflow_type: 'GENERATION',
          metadata: {
            displayName: payload.prompt || (isVideo ? "Video Generation" : "Image Generation"),
            createTime: new Date().toISOString(),
            favorited: false,
          }
        };

        const optimisticMedia = {
          id: `${optimisticId}-item`,
          name: `${optimisticId}-item`,
          url: null, // Placeholder
          status: 'pending',
          projectId: projectId,
          workflowId: optimisticId,
          workflowStepId: 'GEN',
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: 'PRIVATE',
          },
          generationConfig: {
            prompt: payload.prompt,
            model: payload.model_name || payload.model,
            ratio: payload.aspect_ratio || payload.ratio,
          },
          [isVideo ? 'video' : 'image']: {
            dimensions: { width: 1024, height: 1024 },
            [isVideo ? 'generatedVideo' : 'generatedImage']: null,
          }
        };

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])]
            }
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error('❌ Workflow execution failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId } = payload || {};
      if (projectId) {
        // Small delay to ensure the placeholder row is visible in DB before refetch.
        // The backend responds with 202 immediately, but the DB write may lag slightly.
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        }, 500);
      }
    },
  });
}

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

// Note: Character & Element domain mutations are exported from their dedicated domain modules at the bottom of this file.

export function useRemoveWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowIds, projectId }) => {
      const ids = workflowIds || (workflowId ? [workflowId] : []);
      if (ids.length === 0) throw new Error("workflowId is required");

      const res = ids.length === 1
        ? await api.delete(`/workflows/workflows/${ids[0]}`)
        : await api.delete(`/workflows/workflows`, {
            body: JSON.stringify({ workflow_ids: ids }),
          });

      if (!res.ok) throw new Error(res.message);
      return ids;
    },

    onMutate: async ({ workflowId, workflowIds, projectId }) => {
      if (!projectId) return {};
      const idsToRemove = workflowIds || (workflowId ? [workflowId] : []);
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
              workflows: (old.projectContents?.workflows || []).filter(
                wf => !idsToRemove.includes(wf.id) && !idsToRemove.includes(wf.name)
              ),
              media: (old.projectContents?.media || []).filter(
                m => !idsToRemove.includes(m.workflowId)
              )
            }
          };
        });
      }

      return { previousData, projectKey, projectId };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },

    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },
  });
}

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

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, projectId }) => {
      const res = await api.patch(`/workflows/items/${itemId}/like`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onMutate: async ({ itemId, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.media) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              media: old.projectContents.media.map((m) => {
                if (m.id === itemId || m.name === itemId) {
                  return {
                    ...m,
                    is_liked: !m.is_liked,
                    is_Like: !m.is_Like, // Support both naming conventions found in UI
                  };
                }
                return m;
              }),
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
      }
    },
  });
}

export function useToggleWorkflowLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowIds, favorited, projectId } = {}) => {
      const normalizedIds = Array.isArray(workflowIds)
        ? workflowIds.filter(Boolean)
        : [workflowId].filter(Boolean);

      if (normalizedIds.length === 0) throw new Error("workflowId is required");

      const res = normalizedIds.length === 1
        ? await api.patch(`/workflows/workflows/${normalizedIds[0]}/like`)
        : await api.patch(`/workflows/workflows/like`, {
            workflow_ids: normalizedIds,
            ...(favorited !== undefined ? { favorited: !!favorited } : {}),
          });

      if (!res.ok) throw new Error(res.message);
      return normalizedIds;
    },
    onMutate: async ({ workflowId, workflowIds, favorited, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);
      const normalizedIds = Array.isArray(workflowIds)
        ? workflowIds.filter(Boolean)
        : [workflowId].filter(Boolean);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.workflows) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: old.projectContents.workflows.map((wf) => {
                if (normalizedIds.includes(wf.id) || normalizedIds.includes(wf.name)) {
                  return {
                    ...wf,
                    metadata: {
                      ...(wf.metadata || {}),
                      favorited: favorited !== undefined ? favorited : !wf.metadata?.favorited,
                    },
                  };
                }
                return wf;
              }),
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSettled: (res, err, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowData }) => {
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');
      const res = await api.patch(`/workflows/workflows/${cleanId}`, workflowData);
      if (res && res.ok === false) throw new Error(res.message || "Failed to update workflow");
      return res;
    },
    onSuccess: (data, variables) => {
      const { workflowId, workflowData } = variables || {};
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');

      // 1. Immediately update query cache across all projectData queries
      if (cleanId && workflowData) {
        const newName = workflowData.display_name || workflowData.name;
        const newDesc = workflowData.description || workflowData.character_info;
        queryClient.setQueriesData({ queryKey: ['projectData'] }, (oldData) => {
          if (!oldData?.projectContents) return oldData;
          const updatedWorkflows = (oldData.projectContents.workflows || []).map((w) => {
            const wCleanId = String(w.id || w.name || '').replace(/^workflows\//, '');
            if (wCleanId === cleanId) {
              return {
                ...w,
                ...workflowData,
                display_name: newName || w.display_name,
                description: newDesc !== undefined ? newDesc : w.description,
                character_info: newDesc !== undefined ? newDesc : w.character_info,
                metadata: {
                  ...w.metadata,
                  displayName: newName || w.metadata?.displayName,
                },
              };
            }
            return w;
          });

          const updatedCharacters = (oldData.projectContents.characters || []).map((c) => {
            const cId = String(c.id || '').replace(/^workflows\//, '');
            const cWfId = String(c.workflow_id || '').replace(/^workflows\//, '');
            if (cId === cleanId || cWfId === cleanId) {
              return {
                ...c,
                ...workflowData,
                description: newDesc !== undefined ? newDesc : c.description,
                character_info: newDesc !== undefined ? newDesc : c.character_info,
                name: newName || c.name,
                title: newName || c.title,
              };
            }
            return c;
          });

          const updatedElements = (oldData.projectContents.elements || []).map((el) => {
            const elId = String(el.id || '').replace(/^workflows\//, '');
            const elWfId = String(el.workflow_id || '').replace(/^workflows\//, '');
            if (elId === cleanId || elWfId === cleanId) {
              return {
                ...el,
                ...workflowData,
                name: newName || el.name,
              };
            }
            return el;
          });

          return {
            ...oldData,
            projectContents: {
              ...oldData.projectContents,
              workflows: updatedWorkflows,
              characters: updatedCharacters,
              elements: updatedElements,
            },
          };
        });
      }

      // 2. Invalidate queries for background refetch
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}



export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, mediaId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/primary-media`, { media_id: mediaId });
      if (!res.ok) throw new Error(res.message || 'Failed to set primary media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}

export function useMoveWorkflow() {
  return useMutation({
    mutationFn: async () => ({ ok: true }),
  });
}

export function useDetachMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, projectId, displayName }) => {
      const res = await api.post(`/workflows/detach-media`, {
        media_id: mediaId,
        project_id: projectId,
        display_name: displayName,
      });
      if (!res.ok) throw new Error(res.message || 'Failed to detach media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      if (!res.ok) throw new Error(res.message || 'Failed to delete media');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}

// ─── Character & Element Domain Re-exports (Single Source of Truth) ───────────
export {
  useCharacter,
  useCharacterWorkflows,
  useCreateCharacterMutation,
  useUpdateCharacter,
  useGenerateCharacterSheetMutation,
  useGenerateCharacterDescriptionMutation,
  useAddMediaToCharacter,
  useRemoveMediaFromCharacter,
  useSetCharacterSheetMedia,
} from '@/features/characters';

export {
  useElement,
  useElementSheetWorkflows,
  useCreateElementSheetMutation,
  useUpdateElementMetadata,
  useAddImageToElement,
  useDeleteMediaItem,
  useAnalyzeElementVision,
} from '@/features/elements';


