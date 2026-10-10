// [FSD Layer: features/elements/hooks] — Attach reference image to element (1 hook/file).
// Optimistically previews blob image with status "uploading", revokes URL on settled.
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useAddImageToElement
 * Attaches a reference image to an element.
 * When a file is provided, shows a blob preview (status:"uploading") immediately.
 */
export function useAddImageToElement() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
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

    getCacheKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [],

    onMutate: (variables) => {
      if (!variables.file) return {};
      const localUrl = URL.createObjectURL(variables.file);
      variables._localUrl = localUrl;
      return { localUrl };
    },

    applyOptimistic: (oldData, { elementId, _localUrl }) => {
      if (!oldData?.projectContents || !_localUrl) return oldData;
      const optimisticId = `optimistic-element-img-${Date.now()}`;
      const optimisticMedia = {
        id: optimisticId,
        file_url: _localUrl,
        status: "uploading",
        feed_type: "upload",
        workflowId: elementId,
        workflow_id: elementId,
        created_at: new Date().toISOString(),
      };
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          media: [optimisticMedia, ...(oldData.projectContents.media || [])],
        },
      };
    },

    invalidateKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [["projectData"]],

    onSettled: (_data, _err, variables, context) => {
      if (context?.localUrl) URL.revokeObjectURL(context.localUrl);
    },

    errorMessage: "Failed to add image to element. Changes were reverted.",
  });
}

export default useAddImageToElement;
