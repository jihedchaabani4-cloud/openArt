// [FSD Layer: features/characters/hooks] — Attach detail media to character (1 hook/file).
// Optimistically adds detail media with status "processing" and transitions to "success" on return.
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useAddMediaToCharacter
 * Attaches a detail reference media item to the character.
 * Immediately adds optimistic item with status "processing" to projectContents.media,
 * and updates it to "success" upon backend completion.
 */
export function useAddMediaToCharacter() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async (params) => {
      return await characterService.addDetailMedia(params);
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
      const tempId = `optimistic-char-media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      variables._localUrl = localUrl;
      variables._tempId = tempId;
      variables._isBlob = isBlob;
      return { localUrl, tempId, isBlob };
    },

    applyOptimistic: (oldData, { characterId, _localUrl, _tempId }) => {
      if (!oldData?.projectContents || !_localUrl) return oldData;
      const optimisticId = _tempId || `optimistic-char-media-${Date.now()}`;
      const optimisticMedia = {
        id: optimisticId,
        url: _localUrl,
        file_url: _localUrl,
        status: "processing",
        step_id: "character_detail",
        role: "detail",
        feed_type: "upload",
        workflowId: characterId,
        workflow_id: characterId,
        characterId,
        character_id: characterId,
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

    errorMessage: "Failed to add media to character. Changes were reverted.",
  });
}

export default useAddMediaToCharacter;
