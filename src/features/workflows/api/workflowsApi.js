// [FSD Layer: features/workflows] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useWorkflowsStore } from '../model/useWorkflowsStore';
import { useAuthSession } from '@/shared/api/auth';

// ── Project Data (Unified Hook) ───────────────────────────────────────────────

/**
 * useProjectData:
 * The SINGLE source of truth for a project.
 * 
 * 🧠 Blueprint Layer: Pure Hook.
 * Logic is handled by the Layout (Control Layer).
 */
export function useProjectData(projectId, sessionId = null) {
  const { data: user, isLoading: authLoading } = useAuthSession();
  const queryKey = sessionId
    ? queryKeys.projectData.byProjectAndSession(projectId, sessionId)
    : queryKeys.projectData.byProject(projectId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      let url = `/workflows/project-data/${projectId}`;
      if (sessionId) url += `?session_id=${sessionId}`;
      
      try {
        const res = await api.get(url);
        console.log("DEBUG: Raw API Response from /project-data:", res);
        
        // Comprehensive check for all possible backend response structures
        const data = 
          res?.data?.data?.json || 
          res?.data?.json || 
          res?.result?.data?.json || 
          res?.json || 
          res?.data;

        if (data && (data.projectContents || data.projectName)) return data;
        throw new Error('Project data structure invalid or not found');
      } catch (err) {
        throw err;
      }
    },
    enabled: !authLoading && !!user && !!projectId, // ⛔ Block until auth resolves
    // 🎯 SaaS Settings
    staleTime: 60_000, 
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false, // Don't hang forever on bad IDs
    throwOnError: false, // Controlled handling
  });
}

/**
 * useProjectSessions:
 * Convenience hook — returns only the sessions list from the unified fetch.
 */
export function useProjectSessions(projectId) {
  const { data } = useProjectData(projectId);
  const rawSessions = data?.projectContents?.sessions ?? [];
  // Backend schema: { name: "uuid", metadata: { displayName: "human name" } }
  return rawSessions.map(s => ({
    session_id:   s.name,                                          // UUID stored in "name"
    session_name: s.metadata?.displayName || s.name || "Untitled Session",
  }));
}

export function useSessionCollections(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const collections = data?.projectContents?.collections ?? [];
  return collections.filter(c => c.parentCollectionId === sessionId);
}

export function useSessionMedia(projectId, _sessionId) {
  const { data } = useProjectData(projectId);
  return data?.projectContents?.media ?? [];
}

export function useSessionWorkflows(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  return workflows.filter(w => w.session_id === sessionId || w.metadata?.sessionId === sessionId);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useGenerateMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, isVideo, isCamera, isLighting, isUpscale }) => {
      let endpoint = isVideo ? '/video/generated' : '/images/generated';
      if (isCamera) {
          endpoint = '/camera/change-angles';
          if (isVideo) payload.media_type = "video";
      }
      if (isLighting) endpoint = '/lighting/change-lighting';
      if (isUpscale) endpoint = '/media/upscale';
      
      if (!isVideo && !isCamera && !isLighting && !isUpscale) {
        if (payload.edit_type === 'edit') endpoint = '/images/generated/edit/existing';
        else if (payload.edit_type === 'img2img') endpoint = '/images/generated/edit/new';
      } else if (isVideo && payload.edit_type === 'edit') {
        endpoint = '/video/edit';
      }
      
      if (payload.section === 'motion' || payload.edit_type === 'motion') {
         endpoint = '/video/motion';
      }
      
      const res = await api.post(endpoint, payload);
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
        const sessionId = payload.session_id;

        const optimisticWorkflow = {
          name: optimisticId,
          projectId: projectId,
          workflow_type: 'GENERATION',
          metadata: {
            displayName: payload.prompt || (isVideo ? "Video Generation" : "Image Generation"),
            createTime: new Date().toISOString(),
            sessionId: sessionId,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

export function useCreateElementSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload }) => {
      const { type } = payload;
      const endpoint = `/element-sheet/${type}`;
      const res = await api.post(endpoint, payload);
      if (!res.ok) throw new Error(res.message || 'Element sheet creation failed');
      return res;
    },
    onMutate: async ({ payload }) => {
      useWorkflowsStore.getState().fireScrollToTop();
      
      const projectId = payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-element-${Date.now()}`;
        
        const optimisticWorkflow = {
          name: optimisticId,
          projectId: projectId,
          workflow_type: 'ELEMENT_SHEET',
          metadata: {
            displayName: payload.prompt || "Element Sheet",
            createTime: new Date().toISOString(),
            sessionId: payload.session_id,
            favorited: false,
          }
        };

        const optimisticMedia = {
          id: `${optimisticId}-item`,
          name: `${optimisticId}-item`,
          url: null,
          status: 'pending',
          projectId: projectId,
          workflowId: optimisticId,
          workflowStepId: 'CAE',
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: 'PRIVATE',
          },
          generationConfig: {
            prompt: payload.prompt,
            model: payload.model_name || payload.model,
          },
          image: {
            dimensions: { width: 1024, height: 1024 },
            generatedImage: null,
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
      console.error('❌ Element sheet creation failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId } = payload || {};
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

export function useExtendVideoMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload }) => {
      const endpoint = '/video/extend';
      const res = await api.post(endpoint, payload);
      if (!res.ok) throw new Error(res.message || 'Video extension failed');
      return res;
    },
    onMutate: async () => {
      useWorkflowsStore.getState().fireScrollToTop();
      return {};
    },
    onError: (err) => {
      console.error('❌ Video extension failed:', err);
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId } = payload || {};
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

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
      const res = await api.patch(`/workflows/workflows/${workflowId}`, workflowData);
      if (!res.ok) throw new Error(res.message || "Failed to update workflow");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, sessionId, projectId, newsession = false, sessionName }) => {
      const body = {};
      if (newsession) {
        body.newsession = true;
        if (sessionName) body.session_name = sessionName;
      } else {
        if (!sessionId) throw new Error('sessionId is required when newsession is false');
        body.session_id = sessionId;
      }
      if (projectId) body.project_id = projectId;

      const res = await api.patch(`/workflows/workflows/${workflowId}/move`, body);
      if (!res.ok) throw new Error(res.message || 'Failed to move workflow');
      return res;
    },

    onMutate: async ({ workflowId, sessionId, projectId }) => {
      // 1. Cancel in-flight queries
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });

      // 2. Snapshot current state
      const previousData = queryClient.getQueryData(projectKey);

      // 3. Optimistically update
      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.workflows) return old;
          
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: old.projectContents.workflows.map(wf => {
                if (wf.id === workflowId || wf.name === workflowId) {
                  return {
                    ...wf,
                    session_id: sessionId,
                    metadata: {
                      ...(wf.metadata || {}),
                      sessionId: sessionId
                    }
                  };
                }
                return wf;
              })
            }
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
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
    },
  });
}

export function useDetachMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, projectId, sessionId, displayName }) => {
      const res = await api.post(`/workflows/detach-media`, {
        media_id: mediaId,
        project_id: projectId,
        session_id: sessionId,
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

/**
 * useElementSheetWorkflows: Consumers only logic
 */
export function useElementSheetWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];
  const filters = useWorkflowsStore((s) => s._elementFilters);

  const allElements = workflows
    .filter((w) => w.workflow_type === "ELEMENT_SHEET")
    .map((w) => {
      const items = media.filter((m) => m.workflowId === w.name);
      return { ...w, items, isMultiMedia: items.length > 1 };
    });

  const filteredElements = allElements
    .filter((w) => {
      if (filters?.liked && !w.metadata?.favorited) return false;
      
      const config = w.items?.[0]?.generationConfig || {};
      const wPrompt = (config.prompt || '').toLowerCase();
      
      // Element Type Filter
      if (filters?.elementTypes?.length > 0) {
        const dnaType = (config.dna?.type || '').toLowerCase();
        let elementType = 'character';
        if (dnaType === 'product') elementType = 'product';
        if (dnaType === 'location') elementType = 'location';
        if (!filters.elementTypes.includes(elementType)) return false;
      }

      // Gender Filter
      if (filters?.gender?.length > 0) {
        const isMale = wPrompt.includes('<trait: male>') || wPrompt.includes('<trait: boy>') || wPrompt.includes('<trait: man>') || wPrompt.includes('<trait: homme>');
        const isFemale = wPrompt.includes('<trait: female>') || wPrompt.includes('<trait: girl>') || wPrompt.includes('<trait: woman>') || wPrompt.includes('<trait: femme>');
        
        if (filters.gender.includes('male') && filters.gender.includes('female')) {
           // Both selected, show if it matches either
           if (!isMale && !isFemale) return false;
        } else if (filters.gender.includes('male')) {
           if (!isMale && isFemale) return false; 
        } else if (filters.gender.includes('female')) {
           if (!isFemale && isMale) return false;
        }
      }

      // Rendering Style Filter
      if (filters?.renderingStyles?.length > 0) {
        const hasMatchingStyle = filters.renderingStyles.some(style => wPrompt.includes(`<trait: ${style.toLowerCase()}>`) || wPrompt.includes(style.toLowerCase().replace('-', ' ')));
        if (!hasMatchingStyle) return false;
      }

      if (filters?.prompt?.trim()) {
        const q = filters.prompt.toLowerCase();
        if (!(w.name || '').toLowerCase().includes(q) && !(w.metadata?.displayName || '').toLowerCase().includes(q) && !wPrompt.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const tA = new Date(a.metadata?.createTime || 0).getTime();
      const tB = new Date(b.metadata?.createTime || 0).getTime();
      return filters?.sort === 'oldest' ? tA - tB : tB - tA;
    });

  return { workflows: filteredElements, isLoading, isError };
}
