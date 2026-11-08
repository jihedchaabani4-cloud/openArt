// [FSD Layer: features/folders/mutations] — Create folder mutation (1 hook / file).
// Optimistically adds folder with temp id and replaces it with real server id on success.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Create a new folder/collection in the project.
 * Optimistically appends folder with temporary id, smoothly replaced on success.
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async ({ projectId, name, parentId = null }) => {
      if (!projectId) throw new Error("Project ID is required");

      const resolvedName = (name && typeof name === "string" && name.trim())
        ? name.trim()
        : "Untitled collection";

      const res = await api.post(`/projects/${projectId}/folders`, {
        name: resolvedName,
        parentId: parentId || null,
      });

      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || res?.error || "Failed to create collection");
      }

      return res?.data ?? res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.folders.byProject(projectId)] : []),
    applyOptimistic: (oldFolders, { name, parentId, projectId, tempId }) => {
      const resolvedName = (name && typeof name === "string" && name.trim())
        ? name.trim()
        : "Untitled collection";
      const folderTemp = {
        id: tempId,
        name: resolvedName,
        parentId: parentId || null,
        parent_id: parentId || null,
        projectId,
        createTime: new Date().toISOString(),
      };
      return [folderTemp, ...(Array.isArray(oldFolders) ? oldFolders : [])];
    },
    onMutate: (variables) => {
      const tempId = `temp-folder-${Date.now()}`;
      variables.tempId = tempId;
      return { tempId };
    },
    onSuccess: (createdFolder, variables, context) => {
      const tempId = context?.tempId || variables?.tempId;
      if (tempId && variables?.projectId) {
        const fKey = queryKeys.folders.byProject(variables.projectId);
        queryClient.setQueryData(fKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((f) => (f.id === tempId ? { ...f, ...createdFolder } : f));
        });
      }
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId
        ? [queryKeys.folders.byProject(projectId), queryKeys.projectData.byProject(projectId)]
        : []),
      queryKeys.folders.all(),
    ],
    errorMessage: "Failed to create collection. Changes were reverted.",
  });
}

export default useCreateFolder;
