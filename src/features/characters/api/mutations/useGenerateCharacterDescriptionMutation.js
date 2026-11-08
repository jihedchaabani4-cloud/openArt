// [FSD Layer: features/characters/hooks] — Generate AI character description mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useGenerateCharacterDescriptionMutation.
import { useMutation } from "@tanstack/react-query";
import { characterService } from "../characterService";

/**
 * useGenerateCharacterDescriptionMutation
 * Generates an evocative character prompt using the AI Art Director.
 */
export function useGenerateCharacterDescriptionMutation() {
  return useMutation({
    mutationFn: async ({ concept, archetype, style }) => {
      return await characterService.generateDescription({ concept, archetype, style });
    },
  });
}
