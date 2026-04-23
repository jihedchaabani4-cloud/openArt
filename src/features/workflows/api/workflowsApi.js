// [FSD Layer: features/workflows] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useWorkflowsStore } from '../model/useWorkflowsStore';

// ── Project Data (Unified Hook) ───────────────────────────────────────────────

/**
 * useProjectData:
 * The SINGLE source of truth for a project.
 * 
 * 🧠 Blueprint Layer: Pure Hook.
 * Logic is handled by the Layout (Control Layer).
 */
export function useProjectData(projectId, sessionId = null) {
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
        if (res?.result?.data?.json) return res.result.data.json;
        throw new Error('Project not found');
      } catch (err) {
        throw err;
      }
    },
    enabled: !!projectId,
    // 🎯 SaaS Settings
    staleTime: 60_000, 
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1, // Don't hang forever on bad IDs
    throwOnError: false, // Controlled handling
  });
}

/**
 * useProjectSessions:
 * Convenience hook — returns only the sessions list from the unified fetch.
 */
export function useProjectSessions(projectId) {
  const { data } = useProjectData(projectId);
  const sessions = data?.projectContents?.sessions ?? [];
  return sessions.map(s => ({
    ...s,
    session_id: s.name,
    session_name: s.metadata?.displayName || "Untitled Session"
  }));
}

export function useSessionCollections(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const collections = data?.projectContents?.collections ?? [];
  return collections.filter(c => c.parentCollectionId === sessionId);
}

export function useSessionMedia(projectId, sessionId) {
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
    onMutate: async () => {
      useWorkflowsStore.getState().fireScrollToTop();
      return {};
    },
    onError: (err) => {
      console.error('❌ Workflow execution failed:', err);
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId } = payload || {};
      if (projectId) {
        // 🔥 Invalidate for instant update
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
    onMutate: () => {
      useWorkflowsStore.getState().fireScrollToTop();
      return {};
    },
    onError: (err) => {
      console.error('❌ Character sheet creation failed:', err);
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
    mutationFn: async (workflowId) => {
      const res = await api.delete(`/workflows/workflows/${workflowId}`);
      if (!res.ok) throw new Error(res.message);
      return workflowId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
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
    mutationFn: async ({ itemId }) => {
      const res = await api.patch(`/workflows/items/${itemId}/like`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}

export function useToggleWorkflowLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/like`);
      if (!res.ok) throw new Error(res.message);
      return workflowId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
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
      const wPrompt = (w.items?.[0]?.generationConfig?.prompt || '').toLowerCase();
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
