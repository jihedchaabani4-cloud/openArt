// [FSD Layer: features/characters/hooks] — Create character mutation (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useCreateCharacterMutation.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { characterService } from "../services/characterService";

/**
 * useCreateCharacterMutation
 * Creates a new character workflow container and initiates sheet generation.
 */
export function useCreateCharacterMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      return await characterService.createCharacter(payload);
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};
      const projectId = payload.projectId || payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-char-${Date.now()}`;
        const optimisticWorkflow = characterService.buildOptimisticWorkflow({
          id: optimisticId,
          name: payload.name,
          prompt: payload.prompt,
          projectId,
        });

        const optimisticMedia = characterService.buildOptimisticMedia({
          id: optimisticId,
          workflowId: optimisticId,
          projectId,
          prompt: payload.prompt,
        });

        const optimisticChar = characterService.buildOptimisticCharacter({
          id: optimisticId,
          workflowId: optimisticId,
          projectId,
          name: payload.name,
          prompt: payload.prompt,
        });

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])],
              characters: [optimisticChar, ...(old.projectContents?.characters || [])],
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Character creation failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === "function") onError(err);
    },
    onSuccess: (res, payload) => {
      const projectId = payload?.projectId || payload?.project_id || res?.project_id || res?.character?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        queryClient.refetchQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}
