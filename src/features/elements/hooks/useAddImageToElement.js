// [FSD Layer: features/elements/hooks] — Attach reference image to element (1 hook/file).
// Optimistically adds element reference image with status "processing" and transitions to "success" on return.
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useAddImageToElement
 * Attaches a reference image to an element.
 * Immediately adds optimistic item with status "processing" to projectContents.media,
 * and updates it to "success" upon backend completion.
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
        body = { imageUrl, mediaId, workflowId: mediaId, projectId };
      }
      const res = await api.post(`/v2/elements/${elementId}/images`, body, { headers });
      return res;
    },

    getCacheKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [],

    onMutate: (variables) => {
      let localUrl = null;
      let isBlob = false;
      if (variables.file) {
        localUrl = URL.createObjectURL(variables.file);
        isBlob = true;
      } else if (variables.imageUrl) {
        localUrl = variables.imageUrl;
      }
      const tempId = `optimistic-element-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      variables._localUrl = localUrl;
      variables._tempId = tempId;
      variables._isBlob = isBlob;
      return { localUrl, tempId, isBlob };
    },

    applyOptimistic: (oldData, { elementId, _localUrl, _tempId }) => {
      if (!oldData?.projectContents || !_localUrl) return oldData;
      const optimisticId = _tempId || `optimistic-element-img-${Date.now()}`;
      const optimisticMedia = {
        id: optimisticId,
        url: _localUrl,
        file_url: _localUrl,
        status: "processing",
        step_id: "element_reference",
        role: "detail",
        mediaRole: "detail",
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

    onSuccess: (data, variables, context) => {
      const media = data?.media || data?.data;
      if (media && variables.projectId) {
        const queryKey = queryKeys.projectData.byProject(variables.projectId);
        queryClient.setQueryData(queryKey, (old) => {
          if (!old?.projectContents?.media) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              media: old.projectContents.media.map((m) =>
                m.id === context?.tempId || m.id === variables._tempId
                  ? {
                      ...m,
                      ...media,
                      id: media.id || m.id,
                      url: media.url || m.url,
                      file_url: media.url || m.file_url,
                      status: "success",
                      role: "detail",
                      mediaRole: "detail",
                      workflowId: variables.elementId,
                      workflow_id: variables.elementId,
                    }
                  : m
              ),
            },
          };
        });
      }
    },

    invalidateKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [["projectData"]],

    onSettled: (_data, _err, _variables, context) => {
      if (context?.isBlob && context?.localUrl) {
        URL.revokeObjectURL(context.localUrl);
      }
    },

    errorMessage: "Failed to add image to element. Changes were reverted.",
  });
}

export default useAddImageToElement;
