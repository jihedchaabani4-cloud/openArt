// [FSD Layer: features/characters/hooks] — Set primary character sheet media mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useSetCharacterSheetMedia.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";

/**
 * useSetCharacterSheetMedia
 * Replaces or uploads the primary turnaround sheet media for the character.
 */
export function useSetCharacterSheetMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params) => {
      return await characterService.setSheetMedia(params);
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
