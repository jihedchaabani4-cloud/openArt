// [FSD Layer: features/characters/hooks] — Regenerate character sheet mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useGenerateCharacterSheetMutation.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../services/characterService";

/**
 * useGenerateCharacterSheetMutation
 * Regenerates the 3-view turnaround sheet for an existing character.
 */
export function useGenerateCharacterSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, prompt, references, projectId }) => {
      return await characterService.generateSheet({ characterId, prompt, references, projectId });
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
    },
    onError: (err) => {
      console.error("❌ Sheet generation failed:", err);
      if (typeof onError === "function") onError(err);
    },
  });
}
