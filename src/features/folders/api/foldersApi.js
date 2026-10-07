// [FSD Layer: features/folders] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Fetch project folders/collections.
 */
export function useProjectFolders(projectId) {
  return useQuery({
    queryKey: queryKeys.folders.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get(`/projects/${projectId}/folders`);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || "Failed to fetch folders");
      }
      return res?.data ?? res ?? [];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

/**
 * Create a new folder/collection in the project.
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, name, parentId = null }) => {
      if (!projectId) throw new Error("Project ID is required");
      if (!name || !name.trim()) throw new Error("Collection name is required");

      const res = await api.post(`/projects/${projectId}/folders`, {
        name: name.trim(),
        parentId: parentId || null,
      });

      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to create collection");
      }

      return res?.data ?? res;
    },
    onSuccess: (createdFolder, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
    },
  });
}

/**
 * Update a folder/collection (e.g. rename).
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, projectId, name }) => {
      const res = await api.patch(`/folders/${folderId}`, { name });
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || "Failed to update collection");
      }
      return res?.data ?? res;
    },
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}

/**
 * Delete a folder/collection.
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, projectId }) => {
      const res = await api.delete(`/folders/${folderId}`);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || "Failed to delete collection");
      }
      return folderId;
    },
    onSuccess: (_, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}
