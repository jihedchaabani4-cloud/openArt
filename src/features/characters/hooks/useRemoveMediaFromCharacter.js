// [FSD Layer: features/characters/hooks] — Remove detail media from character (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useRemoveMediaFromCharacter.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";

/**
 * useRemoveMediaFromCharacter
 * Removes a detail reference media item from the character.
 */
export function useRemoveMediaFromCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, mediaId, projectId }) => {
      const res = await characterService.removeDetailMedia({ characterId, mediaId });
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
