// [FSD Layer: features/characters/hooks] — Attach detail media to character (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useAddMediaToCharacter.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";

/**
 * useAddMediaToCharacter
 * Attaches a detail reference media item to the character.
 */
export function useAddMediaToCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params) => {
      return await characterService.addDetailMedia(params);
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
    },
  });
}
