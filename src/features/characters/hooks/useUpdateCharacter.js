// [FSD Layer: features/characters/hooks] — Update character mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useUpdateCharacter.
// Bidirectional cache patch across `workflows` and `characters` entries.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { characterService } from "../services/characterService";
import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";

/**
 * useUpdateCharacter
 * Updates character properties (name, title, description, character_info, etc.)
 * with instant bidirectional cache update across both `workflows` and `characters`.
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, characterData }) => {
      return await characterService.updateCharacter(characterId, characterData);
    },
    onSuccess: (data, variables) => {
      const { characterId, characterData } = variables || {};
      const cleanId = stripWorkflowPrefix(characterId);

      if (cleanId && characterData) {
        const newName = characterData.name || characterData.title || characterData.display_name;
        const newDesc = characterData.description || characterData.character_info;

        queryClient.setQueriesData({ queryKey: ["projectData"] }, (oldData) => {
          if (!oldData?.projectContents) return oldData;

          const updatedCharacters = (oldData.projectContents.characters || []).map((c) => {
            const cId = stripWorkflowPrefix(c.id || "");
            const cWfId = stripWorkflowPrefix(c.workflow_id || "");
            if (cId === cleanId || cWfId === cleanId) {
              return {
                ...c,
                ...characterData,
                description: newDesc !== undefined ? newDesc : c.description,
                character_info: newDesc !== undefined ? newDesc : c.character_info,
                name: newName || c.name,
                title: newName || c.title,
              };
            }
            return c;
          });

          const updatedWorkflows = (oldData.projectContents.workflows || []).map((w) => {
            const wCleanId = stripWorkflowPrefix(w.id || w.name || "");
            if (wCleanId === cleanId) {
              return {
                ...w,
                display_name: newName || w.display_name,
                name: newName || w.name,
                description: newDesc !== undefined ? newDesc : w.description,
                character_info: newDesc !== undefined ? newDesc : w.character_info,
                metadata: {
                  ...w.metadata,
                  displayName: newName || w.metadata?.displayName,
                },
              };
            }
            return w;
          });

          return {
            ...oldData,
            projectContents: {
              ...oldData.projectContents,
              workflows: updatedWorkflows,
              characters: updatedCharacters,
            },
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["projectData"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
