// [FSD Layer: features/workflows] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useWorkflowsStore } from '../model/useWorkflowsStore';

// ── Project Data (Unified Hook) ───────────────────────────────────────────────

/**
 * useProjectData:
 * The SINGLE source of truth for a project.
 * Fetches: sessions (as parent collections), collections, workflows, and media.
 * 
 * If sessionId is provided, media and collections are filtered by that session.
 * Otherwise returns the full project structure with all sessions.
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
      const res = await api.get(url);
      if (res?.result?.data?.json) return res.result.data.json;
      throw new Error('Failed to fetch project data');
    },
    enabled: !!projectId,
    staleTime: 30_000, // 30s
  });
}

/**
 * useProjectSessions:
 * Convenience hook — returns only the sessions list from the unified fetch.
 */
export function useProjectSessions(projectId) {
  const { data } = useProjectData(projectId);
  const sessions = data?.projectContents?.sessions ?? [];
  // Map to legacy layout structure so UI components don't break
  return sessions.map(s => ({
    ...s,
    session_id: s.name,
    session_name: s.metadata?.displayName || "Untitled Session"
  }));
}

/**
 * useSessionCollections:
 * Returns only collections belonging to a specific session.
 */
export function useSessionCollections(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const collections = data?.projectContents?.collections ?? [];
  return collections.filter(c => c.parentCollectionId === sessionId);
}

/**
 * useSessionMedia:
 * Returns the media list for a given session.
 */
export function useSessionMedia(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const media = data?.projectContents?.media ?? [];
  // Since media isn't directly tagged with session_id, we infer it from workflow 
  // (though often we just rely on useFilteredWorkflows anyway)
  return media; // Note: filtering media by session is complex without joining, UI relies on workflows.
}

/**
 * useSessionWorkflows:
 * Returns the workflows list for a given session/project.
 */
export function useSessionWorkflows(projectId, sessionId) {
  const { data } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  return workflows.filter(w => w.session_id === sessionId || w.metadata?.sessionId === sessionId);
}

// ── BACKWARD COMPAT: Old useGenerations mapped to new hook ────────────────────
export function useWorkflows(projectId, sessionId) {
  return useProjectData(projectId, sessionId);
}

export function useGenerations(projectId, sessionId) {
  return useProjectData(projectId, sessionId);
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
      
      // Separate Edit Endpoints
      if (!isVideo && !isCamera && !isLighting && !isUpscale) {
        if (payload.edit_type === 'edit') {
          endpoint = '/images/generated/edit/existing';
        } else if (payload.edit_type === 'img2img') {
          endpoint = '/images/generated/edit/new';
        }
      } else if (isVideo && payload.edit_type === 'edit') {
        // Dedicated endpoint for video editing
        endpoint = '/video/edit';
      }
      
      const res = await api.post(endpoint, payload);
      if (!res.ok) throw new Error(res.message || 'Workflow execution failed');
      return res;
    },
    onMutate: async ({ payload }) => {
      useWorkflowsStore.getState().fireScrollToTop();
      return {};
    },
    onError: (err) => {
      console.error('❌ Workflow execution failed:', err);
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId, session_id: sessionId } = payload || {};
      // Invalidate the unified project data cache to trigger a refetch
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
      }
    },
  });
}

/**
 * mutation for creating structured element sheets
 */
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
      const { project_id: projectId, session_id: sessionId } = payload || {};
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
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
      const { project_id: projectId, session_id: sessionId } = payload || {};
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
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
    onSettled: () => {
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
    onSettled: () => {
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
    onSettled: () => {
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
    },
  });
}

// ── Alias for compatibility ──────────────────────────────────────────────────
export const useRemoveGeneration = useRemoveWorkflow;
export const useRemoveGenerationItem = useRemoveWorkflowItem;

export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, mediaId, projectId, sessionId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/primary-media`, { media_id: mediaId });
      if (!res.ok) throw new Error(res.message || 'Failed to set primary media');
      return res;
    },
    onSuccess: (_, { projectId, sessionId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
      }
    },
  });
}

/**
 * useMoveWorkflow
 * Moves a workflow to a different session (or creates a new session automatically).
 *
 * Usage — move to existing session:
 *   moveWorkflow({ workflowId, sessionId, projectId })
 *
 * Usage — create new session and move:
 *   moveWorkflow({ workflowId, newsession: true, sessionName: "My Session", projectId })
 */
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
    onSuccess: (res, { projectId, sessionId }) => {
      // Invalidate the source project/session
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
      }
      // Also invalidate the destination session if different
      const newSessionId = res?.workflow?.session_id;
      const newProjectId = res?.workflow?.project_id;
      if (newProjectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(newProjectId) });
        if (newSessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(newProjectId, newSessionId),
          });
        }
      }
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
    onSuccess: (_, { projectId, sessionId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectData.byProjectAndSession(projectId, sessionId),
          });
        }
      }
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
