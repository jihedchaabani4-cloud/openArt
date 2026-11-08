// [FSD Layer: features/characters/hooks] — Regenerate character sheet mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useGenerateCharacterSheetMutation.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../characterService";
import { logger } from "@/shared/lib/logger";

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
      logger.error("character_sheet_generation_failed", { error: err });
      if (typeof onError === "function") onError(err);
    },
  });
}
