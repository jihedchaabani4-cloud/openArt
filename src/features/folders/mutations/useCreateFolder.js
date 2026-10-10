// [FSD Layer: features/folders/mutations] — Create folder mutation (1 hook / file).
// Body copied VERBATIM from features/folders/api/foldersApi.js useCreateFolder.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

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
