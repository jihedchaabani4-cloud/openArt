// [FSD Layer: features/elements/hooks] — Attach reference image to element (1 hook/file).
// Body copied VERBATIM from features/elements/hooks/useElement.js useAddImageToElement.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * useAddImageToElement
 * Attaches a reference image to an element.
 */
export function useAddImageToElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ elementId, imageUrl, file, mediaId, projectId }) => {
      let body;
      let headers = {};
      if (file) {
        body = new FormData();
        body.append("file", file);
        if (projectId) body.append("projectId", projectId);
      } else {
        body = { imageUrl, mediaId, projectId };
      }
      const res = await api.post(`/v2/elements/${elementId}/images`, body, { headers });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}
