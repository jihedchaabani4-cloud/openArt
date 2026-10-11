// [FSD Layer: features/projects] — Server State (React Query)
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthSession } from '@/shared/api/auth';
import { projectEntity } from '@/shared/lib/optimistic/entityKeys';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useProjects() {
  const { data: user, isLoading: authLoading } = useAuthSession();
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
    enabled: !authLoading && !!user, // ⛔ Block until auth resolves
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async (projectData) => {
      const res = await api.post('/projects', projectData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to create project');
      
      // Normalize ID for immediate navigation
      return {
        ...res.data,
        project_id: res.data.project_id ?? res.data.id,
      };
    },

    getCacheKeys: () => [queryKeys.projects.all()],

    onMutate: (variables) => {
      const tempId = `temp-project-${Date.now()}`;
      variables.tempId = tempId;
      return { tempId };
    },

    applyOptimistic: (oldData, variables) => {
      const currentList = Array.isArray(oldData) ? oldData : [];
      const title = variables?.project_name || variables?.name || "Untitled Project";
      const tempProject = {
        id: variables.tempId,
        project_id: variables.tempId,
        name: title,
        project_name: title,
        created_at: new Date().toISOString(),
        ...variables,
      };
      return [tempProject, ...currentList];
    },

    onSuccess: (data, variables) => {
      if (variables?.tempId && (data?.id || data?.project_id)) {
        const realId = data.project_id || data.id;
        queryClient.setQueryData(queryKeys.projects.all(), (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p) => {
            if (p.id === variables.tempId || p.project_id === variables.tempId) {
              return {
                ...p,
                ...data,
                id: realId,
                project_id: realId,
              };
            }
            return p;
          });
        });
      }
    },

    invalidateKeys: () => [queryKeys.projects.all()],

    errorMessage: "Failed to create project. Changes were reverted.",
  });
}

export function useDeleteProject() {
  return useOptimisticMutation({
    mutationFn: async (projectId) => {
      const res = await api.delete(`/projects/${projectId}`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to delete project');
      return projectId;
    },

    getEntityKey: (projectId) => projectEntity(projectId),

    getCacheKeys: () => [queryKeys.projects.all()],

    applyOptimistic: (oldData, projectId) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((p) => {
        const pId = p.id ?? p.project_id;
        return String(pId) !== String(projectId);
      });
    },

    invalidateKeys: () => [queryKeys.projects.all()],

    errorMessage: "Failed to delete project. Changes were reverted.",
  });
}

export function useUpdateProject() {
  return useOptimisticMutation({
    mutationFn: async ({ projectId, projectData }) => {
      const res = await api.patch(`/projects/${projectId}`, projectData);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to update project');
      return res.data;
    },

    getEntityKey: ({ projectId }) => projectEntity(projectId),

    getCacheKeys: () => [queryKeys.projects.all()],

    applyOptimistic: (oldData, { projectId, projectData }) => {
      if (!Array.isArray(oldData)) return oldData;
      const newName = projectData?.project_name ?? projectData?.name;
      return oldData.map((p) => {
        const pId = p.id ?? p.project_id;
        if (String(pId) === String(projectId)) {
          return {
            ...p,
            ...projectData,
            ...(newName ? { name: newName, project_name: newName } : {}),
          };
        }
        return p;
      });
    },

    invalidateKeys: () => [queryKeys.projects.all()],

    errorMessage: "Failed to update project. Changes were reverted.",
  });
}
