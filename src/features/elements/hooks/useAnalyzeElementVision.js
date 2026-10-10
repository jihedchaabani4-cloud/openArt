// [FSD Layer: features/elements/hooks] — AI multimodal vision analyze (1 hook/file).
// Body copied VERBATIM from features/elements/hooks/useElement.js useAnalyzeElementVision.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * useAnalyzeElementVision
 * Performs AI multimodal vision analysis on element reference images.
 */
export function useAnalyzeElementVision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, workflowId, imageUrls, elementName, elementType }) => {
      const res = await api.post("/v2/elements/analyze", {
        projectId,
        workflowId,
        imageUrls,
        elementName,
        elementType,
      });
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
