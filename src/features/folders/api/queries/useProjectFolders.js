// [FSD Layer: features/folders/queries] — Folder list query hook (1 hook / file).
// Sourced from centralized GET /api/workflows/project-data/:projectId.
// Standalone GET /api/projects/:projectId/folders has been permanently removed.
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Fetch project folders/collections.
 * Sourced directly from centralized project data (GET /api/workflows/project-data/:projectId).
 */
export function useProjectFolders(projectId) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.folders.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];

      // 1. Check if projectData is already in TanStack Query cache
      const cachedProject = queryClient.getQueryData(queryKeys.projectData.byProject(projectId));
      const cachedCols =
        cachedProject?.projectContents?.collections ||
        cachedProject?.collections ||
        cachedProject?.projectContents?.folders ||
        cachedProject?.folders;

      if (Array.isArray(cachedCols)) {
        return cachedCols;
      }

      // 2. Fetch centralized project-data endpoint (single network request)
      const res = await api.get(`/workflows/project-data/${projectId}`);
      if (res?.ok === false || res?.success === false) {
        throw new Error(res?.message || "Failed to fetch project data");
      }

      const data =
        res?.data?.data?.json ||
        res?.data?.json ||
        res?.result?.data?.json ||
        res?.json ||
        res?.data;

      // Seed projectData cache if fetched
      if (data && (data.projectContents || data.projectName)) {
        queryClient.setQueryData(queryKeys.projectData.byProject(projectId), data);
      }

      const collections =
        data?.projectContents?.collections ||
        data?.collections ||
        data?.projectContents?.folders ||
        data?.folders;

      return Array.isArray(collections) ? collections : [];
    },
    initialData: () => {
      if (!projectId) return undefined;
      const cachedProject = queryClient.getQueryData(queryKeys.projectData.byProject(projectId));
      const cols =
        cachedProject?.projectContents?.collections ||
        cachedProject?.collections ||
        cachedProject?.projectContents?.folders ||
        cachedProject?.folders;
      return Array.isArray(cols) ? cols : undefined;
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}
