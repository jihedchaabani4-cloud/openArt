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
    // Normalize new schema (id) → old shape (project_id) for all consumers
    select: (data) => (data || []).map(p => ({
      ...p,
      project_id: p.project_id ?? p.id,
    })),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}


export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectData) => {
      const res = await api.post('/projects', projectData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to create project');
      
      // Normalize ID for immediate navigation
      return {
        ...res.data,
        project_id: res.data.project_id ?? res.data.id
      };
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
