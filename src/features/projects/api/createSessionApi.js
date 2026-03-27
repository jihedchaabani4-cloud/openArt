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
    onMutate: async (variables) => {
      const { sessionId, sessionData, projectId } = variables;
      const queryKey = projectId ? queryKeys.sessions.byProject(projectId) : null;
      
      let previousSessions = [];
      if (queryKey) {
        await queryClient.cancelQueries({ queryKey });
        previousSessions = queryClient.getQueryData(queryKey);
        
        if (previousSessions) {
          queryClient.setQueryData(queryKey, (old) => {
            if (!old) return old;
            return old.map(session => 
              session.session_id === sessionId 
                ? { ...session, ...sessionData } 
                : session
            );
          });
        }
      }
      return { previousSessions, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey && context?.previousSessions) {
        queryClient.setQueryData(context.queryKey, context.previousSessions);
      }
    },
    onSettled: (_, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
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
          queryKey: queryKeys.sessions.byProject(variables.projectId),
        });
      }
    },
  });
}
