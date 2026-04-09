// [FSD Layer: features/projects] — mutation helpers
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionData) => {
      const res = await api.post('/sessions', sessionData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to create session');
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectData.byProject(variables.project_id),
      });
      // Fallback legacy invalidation just in case
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.byProject(variables.project_id),
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, sessionData }) => {
      // Backend uses PATCH /sessions/:id
      const res = await api.patch(`/sessions/${sessionId}`, sessionData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to update session');
      return res.data;
    },
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.byProject(variables.projectId),
        });
      }
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, projectId }) => {
      const res = await api.delete(`/sessions/${sessionId}`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to delete session');
      return sessionId;
    },
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.byProject(variables.projectId),
        });
      }
    },
  });
} 
