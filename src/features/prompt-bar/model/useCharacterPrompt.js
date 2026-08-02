import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCharacterMutation } from "@/features/workflows/api/workflowsApi";
import { characterService } from "@/features/characters/services/characterService";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { queryKeys } from "@/shared/api/queryKeys";
import { usePromptBar } from "./usePromptBar";
import { useElementStore } from "./useElementStore";

/**
 * [Prompt Bar Feature - Character Domain Hook]
 * Dedicated prompt bar hook for Character Creation.
 * Inherits base prompt bar behavior (textarea, paperclip, popovers)
 * while delegating creation strictly to characterService.
 */
export function useCharacterPrompt() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const s = usePromptBar({ isNewProject: false });

  const { selectedProjectId: storeProjectId } = useWorkflowsStore();
  const projectId = params?.projectId || storeProjectId;

  const { mutateAsync: createCharacter, isPending: isCreating } = useCreateCharacterMutation();
  const { prompts, setPrompt, references, clearReferences, elementMode, setElementMode } = useElementStore();

  const prompt = prompts.character || s.prompt || "";
  const referenceImages = references.character || [];

  const handleGenerateCharacter = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isCreating || s.generating) return;

    try {
      const payload = characterService.buildCreatePayload({
        name: prompt.slice(0, 45),
        prompt,
        references: referenceImages.map((r) => (typeof r === "string" ? r : r.url || r.src)).filter(Boolean),
        projectId,
      });

      const res = await createCharacter({ payload });

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        router.push(`/cinema-studio/${projectId}/characters`);
      }

      setPrompt("");
      clearReferences();
      return res;
    } catch (err) {
      console.error("Failed to create character via prompt bar:", err);
      throw err;
    }
  };

  return {
    ...s,
    prompt,
    setPrompt: (val) => setPrompt(val),
    referenceImages,
    elementMode: "character",
    setElementMode,
    isCreating,
    handleGenerate: handleGenerateCharacter,
  };
}

export default useCharacterPrompt;
