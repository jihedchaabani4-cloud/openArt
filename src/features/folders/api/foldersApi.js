// [FSD Layer: features/folders] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { stripWorkflowPrefix, getFolderId, applyFolderIdPatch } from "@/features/workflows/lib/cacheHelpers";

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
      return res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
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
 * Update (rename/move) an existing folder/collection.
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, patch, projectId: _projectId }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.patch(`/folders/${folderId}`, patch);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to update collection");
      }
      return res?.data ?? res;
    },
    onMutate: async ({ folderId, patch, projectId }) => {
      if (!projectId) return {};
      const foldersKey = queryKeys.folders.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: foldersKey });
      const previousFolders = queryClient.getQueryData(foldersKey);

      if (previousFolders) {
        queryClient.setQueryData(foldersKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((f) => {
            const fId = getFolderId(f);
            if (fId === folderId) {
              return { ...f, ...patch };
            }
            return f;
          });
        });
      }

      return { previousFolders, foldersKey, projectId };
    },
    onError: (err, variables, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(context.foldersKey, context.previousFolders);
      }
    },
    onSettled: (res, err, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
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
    mutationFn: async ({ folderId, projectId: _projectId }) => {
      if (!folderId) throw new Error("Folder ID is required");
      const res = await api.delete(`/folders/${folderId}`);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to delete collection");
      }
      return folderId;
    },
    onMutate: async ({ folderId, projectId }) => {
      if (!projectId) return {};
      const foldersKey = queryKeys.folders.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: foldersKey });
      const previousFolders = queryClient.getQueryData(foldersKey);

      if (previousFolders) {
        queryClient.setQueryData(foldersKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((f) => {
            const fId = getFolderId(f);
            return fId !== folderId;
          });
        });
      }

      return { previousFolders, foldersKey, projectId };
    },
    onError: (err, variables, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(context.foldersKey, context.previousFolders);
      }
    },
    onSettled: (res, err, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}

/**
 * Move a workflow asset to a folder (or null for root).
 */
export function useMoveAssetToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, folderId = null, projectId: _projectId }) => {
      if (!assetId) throw new Error("Asset ID is required");
      const res = await api.patch(`/assets/${assetId}/folder`, {
        folderId: folderId || null,
      });
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to move asset");
      }
      return res?.data ?? res;
    },
    onMutate: async ({ assetId, folderId = null, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old?.projectContents?.workflows) return old;
          const normalizedFolderId = folderId || null;
          const cleanAssetId = stripWorkflowPrefix(assetId);
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: old.projectContents.workflows.map((wf) => {
                const wfRawId = String(wf.id || wf.name || wf.workflowId || '');
                const wfCleanId = stripWorkflowPrefix(wfRawId);
                const wfAltCleanId = stripWorkflowPrefix(wf.name || '');
                if (
                  wfRawId === assetId ||
                  wfCleanId === assetId ||
                  wfCleanId === cleanAssetId ||
                  wfAltCleanId === cleanAssetId
                ) {
                  return applyFolderIdPatch(wf, normalizedFolderId);
                }
                return wf;
              }),
            },
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
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}

