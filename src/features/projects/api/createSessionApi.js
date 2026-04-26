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
    onMutate: async (sessionData) => {
      const projectKey = queryKeys.projectData.byProject(sessionData.project_id);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          const optimisticSession = {
            name: `optimistic-${Date.now()}`,
            projectId: sessionData.project_id,
            metadata: {
              displayName: sessionData.session_name || "Untitled",
              createTime: new Date().toISOString(),
            },
            status: 'creating'
          };
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              sessions: [optimisticSession, ...(old.projectContents?.sessions || [])]
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
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.project_id) });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, sessionData }) => {
      const res = await api.patch(`/sessions/${sessionId}`, sessionData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to update session');
      return res.data;
    },
    onMutate: async ({ sessionId, sessionData, projectId }) => {
      if (!projectId) return;
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => ({
          ...old,
          projectContents: {
            ...old.projectContents,
            sessions: old.projectContents.sessions.map(s => 
              s.name === sessionId 
                ? { ...s, metadata: { ...s.metadata, displayName: sessionData.session_name } }
                : s
            )
          }
        }));
      }
      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }) => {
      const res = await api.delete(`/sessions/${sessionId}`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to delete session');
      return sessionId;
    },
    onMutate: async ({ sessionId, projectId }) => {
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => ({
          ...old,
          projectContents: {
            ...old.projectContents,
            sessions: old.projectContents.sessions.filter(s => s.name !== sessionId)
          }
        }));
      }
      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
    },
  });
} 
