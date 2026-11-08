// [FSD Layer: features/folders/queries] — Folder list query hook (1 hook / file).
// Body copied VERBATIM from features/folders/api/foldersApi.js useProjectFolders.
import { useQuery } from "@tanstack/react-query";
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
      return res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}
