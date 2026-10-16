// [FSD Layer: features/characters/hooks] — Remove detail media from character (1 hook/file).
// Optimistically removes the media item from the cache; rolls back if API fails.
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";
import { mediaEntity } from "@/shared/lib/optimistic/entityKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useRemoveMediaFromCharacter
 * Removes a detail reference media item from the character.
 * Optimistically removes the item from the cache; rolls back on API failure.
 */
export function useRemoveMediaFromCharacter() {
  return useOptimisticMutation({
    mutationFn: async ({ characterId, mediaId }) => {
      const res = await characterService.removeDetailMedia({ characterId, mediaId });
      return res;
    },

    getEntityKey: ({ mediaId }) => mediaEntity(mediaId),

    getCacheKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [],

    applyOptimistic: (oldData, { mediaId, characterId }) => {
      if (!oldData?.projectContents?.media) return oldData;
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          media: oldData.projectContents.media.filter(
            (m) => !(m.id === mediaId && (!characterId || !m.workflow_id || m.workflow_id === characterId || m.workflowId === characterId))
          ),
        },
      };
    },

    invalidateKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [["projectData"]],

    errorMessage: "Failed to remove image from character. Changes were reverted.",
  });
}

export default useRemoveMediaFromCharacter;
