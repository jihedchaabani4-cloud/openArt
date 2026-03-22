// [FSD Layer: features/media] — Server State (React Query)
// Canonical location for useAssets — do NOT import or redeclare in generationsApi.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

export function useAssets(projectId, sessionId) {
  return useQuery({
    queryKey: queryKeys.assets.byProject(projectId, sessionId),
    queryFn: async () => {
      let url = `/generations/assets/${projectId}`;
      if (sessionId) url += `?session_id=${sessionId}`;
      const res = await api.get(url);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch assets');
      return res.data ?? [];
    },
    enabled: !!projectId,
    staleTime: 15_000, // 15s — asset list changes after every generation or upload
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, projectId, sessionId }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId || "");
      formData.append("session_id", sessionId || "");

      // Use native fetch instead of generic api.post because of FormData
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.byProject(variables.projectId, variables.sessionId),
      });
    },
  });
}
