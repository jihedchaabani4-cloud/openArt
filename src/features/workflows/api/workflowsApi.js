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
        const res = await api.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });
        console.log("DEBUG: Raw API Response from /project-data:", res);
        
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
    // 🎯 SaaS Settings - Fresh Realtime Sync
    staleTime: 0, 
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
  return rawSessions.map((s, idx) => ({
    session_id:   s.name,                                          // UUID stored in "name"
    session_name: s.metadata?.displayName || s.name || `Session ${idx + 1}`,
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
        // Small delay to ensure the placeholder row is visible in DB before refetch.
        // The backend responds with 202 immediately, but the DB write may lag slightly.
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        }, 500);
      }
    },
  });
}

export function useCreateElementSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      const type = (payload.type || payload.element_type || payload.elementType || "").toLowerCase();
      
      const endpoint = type === "character"
        ? `/characters/create`
        : `/v2/elements`;

      const res = await api.post(endpoint, payload);
      if (res.error) throw new Error(res.message || 'Element creation failed');
      return res;
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};
      
      const projectId = payload.projectId || payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-element-${Date.now()}`;
        
        const isCharacterType = payload.type === "character" || payload.element_type === "character" || payload.elementType === "character";
        const optimisticWorkflow = {
          name: optimisticId,
          projectId: projectId,
          workflow_type: isCharacterType ? 'CHARACTER' : 'ELEMENT_SHEET',
          metadata: {
            displayName: payload.name || payload.prompt || (payload.type === "character" || payload.element_type === "character" ? "Untitled Character" : "Untitled Element"),
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
    onSuccess: (res, inputData) => {
      const payload = inputData?.payload || inputData || {};
      const projectId = payload.projectId || payload.project_id || res?.workflow?.project_id || res?.element?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        queryClient.refetchQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

export function useCreateCharacterMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      const res = await api.post('/characters/create', payload);
      if (res.error) throw new Error(res.message || 'Character creation failed');
      return res;
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};
      const projectId = payload.projectId || payload.project_id;
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);
      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error('❌ Character creation failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, inputData) => {
      const payload = inputData?.payload || inputData || {};
      const projectId = payload.projectId || payload.project_id || res?.workflow?.project_id || res?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        queryClient.refetchQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

export const useCreateCharacterSheetMutation = useCreateCharacterMutation;

export function useGenerateCharacterDescriptionMutation() {
  return useMutation({
    mutationFn: async ({ concept, archetype, style }) => {
      const res = await api.post('/characters/generate-description', { concept, archetype, style });
      if (res.error) throw new Error(res.message || 'Failed to generate character description');
      return res;
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
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');
      console.log(`📡 [useUpdateWorkflow] Patching workflow "${cleanId}"`, workflowData);
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
        queryClient.setQueriesData({ queryKey: ['projectData'] }, (oldData) => {
          if (!oldData?.projectContents?.workflows) return oldData;
          const updatedWorkflows = oldData.projectContents.workflows.map((w) => {
            const wCleanId = String(w.id || w.name || '').replace(/^workflows\//, '');
            if (wCleanId === cleanId) {
              return {
                ...w,
                ...workflowData,
                display_name: newName || w.display_name,
                name: newName || w.name,
                metadata: {
                  ...w.metadata,
                  displayName: newName || w.metadata?.displayName,
                },
              };
            }
            return w;
          });
          return {
            ...oldData,
            projectContents: {
              ...oldData.projectContents,
              workflows: updatedWorkflows,
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
  const elements = data?.projectContents?.elements ?? [];
  const filters = useWorkflowsStore((s) => s._elementFilters);

  const elementMap = new Map();
  elements.forEach((e) => {
    if (e.workflow_id) elementMap.set(e.workflow_id, e);
    if (e.id) elementMap.set(e.id, e);
  });

  const allElements = workflows
    .filter((w) => {
      const type = String(w.workflow_type || "").toUpperCase();
      return type === "ELEMENT_SHEET" || type === "ELEMENT";
    })
    .map((w) => {
      const elem = elementMap.get(w.id) || elementMap.get(w.name) || w.element || {};
      const items = media.filter((m) => m.workflowId === w.name || m.workflowId === w.id);
      const status = items[0]?.status || w.status || (items[0]?.url ? "success" : "processing");
      return {
        ...w,
        element: elem,
        element_type: elem.element_type || "object",
        description: elem.description || "",
        keywords: elem.keywords || [],
        guidelines: elem.guidelines || [],
        items,
        status,
        isMultiMedia: items.length > 1,
      };
    });

  const filteredElements = allElements
    .filter((w) => {
      if (filters?.liked && !w.metadata?.favorited) return false;
      
      const config = w.items?.[0]?.generationConfig || {};
      const wPrompt = (config.prompt || '').toLowerCase();
      
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

export function useDeleteMediaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['projectData'] });
      }
    },
  });
}

export function useUpdateElementMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, projectId, guidelines, keywords, elementType, element_type }) => {
      const payload = {};
      if (guidelines !== undefined) payload.guidelines = guidelines;
      if (keywords !== undefined) payload.keywords = keywords;
      if (elementType !== undefined || element_type !== undefined) payload.element_type = elementType || element_type;

      const res = await api.patch(`/v2/elements/${workflowId}`, payload);
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
}

export function useAddImageToElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ elementId, imageUrl, projectId }) => {
      const res = await api.post(`/v2/elements/${elementId}/images`, { imageUrl, projectId });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
}

export function useAnalyzeElementVision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, workflowId, imageUrls, elementName, elementType }) => {
      const res = await api.post('/v2/elements/analyze', { projectId, workflowId, imageUrls, elementName, elementType });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
}

export function useCharacterWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];

  const characterWorkflows = workflows
    .filter((w) => {
      const type = String(w.workflow_type || "").toUpperCase();
      return type === "CHARACTER" || type === "CHARACTER_SHEET";
    })
    .map((w) => {
      const items = media.filter((m) => m.workflowId === w.name || m.workflowId === w.id || m.workflow_id === w.id);
      const firstUrl = items[0]?.url || items[0]?.file_url || w.main_media?.url || w.url;
      const rawStatus = w.status || items[0]?.status || "processing";
      const status = firstUrl ? (rawStatus === "failed" ? "failed" : "completed") : rawStatus;
      return { ...w, items, status, isMultiMedia: items.length > 1 };
    });

  return { workflows: characterWorkflows, isLoading, isError };
}

// ─── Character Media Mutations ────────────────────────────────────────────────

export function useAddMediaToCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, imageUrl, projectId }) => {
      const res = await api.post(`/characters/${characterId}/media`, { imageUrl, projectId });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
}

export function useRemoveMediaFromCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, mediaId }) => {
      const res = await api.delete(`/characters/${characterId}/media/${mediaId}`);
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['projectData'] });
      }
    },
  });
}
