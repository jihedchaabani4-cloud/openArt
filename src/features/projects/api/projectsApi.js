// [FSD Layer: features/projects] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: async () => {
      const res = await api.get('/projects');
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch projects');
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 min — changes when user creates/renames/deletes
  });
}

export function useSessions(projectId) {
  return useQuery({
    queryKey: queryKeys.sessions.byProject(projectId),
    queryFn: async () => {
      const res = await api.get(`/sessions?project_id=${projectId}`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch sessions');
      return res.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min — sessions rarely change mid-session
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectData) => {
      const res = await api.post('/projects', projectData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to create project');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId) => {
      const res = await api.delete(`/projects/${projectId}`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to delete project');
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, projectData }) => {
      const res = await api.patch(`/projects/${projectId}`, projectData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to update project');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });
}
