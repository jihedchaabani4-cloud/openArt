// [FSD Layer: features/elements/hooks] — Create element sheet mutation (1 hook/file).
// Body copied VERBATIM from features/elements/hooks/useElement.js useCreateElementSheetMutation.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";

/**
 * useCreateElementSheetMutation
 * Creates a new element sheet workflow with optimistic insertion.
 */
export function useCreateElementSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      const type = (payload.type || payload.element_type || payload.elementType || "").toLowerCase();

      const pId = payload.projectId || payload.project_id || useWorkflowsStore.getState().selectedProjectId;
      const finalPayload = {
        ...payload,
        projectId: pId,
        project_id: pId,
      };

      const endpoint = type === "character" ? "/characters/create" : "/v2/elements";
      const res = await api.post(endpoint, finalPayload);
      if (res.error) throw new Error(res.message || "Element creation failed");
      return res;
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};

      const projectId = payload.projectId || payload.project_id || useWorkflowsStore.getState().selectedProjectId;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-element-${Date.now()}`;
        const isCharacterType =
          payload.type === "character" ||
          payload.element_type === "character" ||
          payload.elementType === "character";

        const optimisticWorkflow = {
          id: optimisticId,
          name: optimisticId,
          projectId,
          workflow_type: isCharacterType ? "CHARACTER" : "ELEMENT_SHEET",
          metadata: {
            displayName:
              payload.name ||
              payload.prompt ||
              (isCharacterType ? "Untitled Character" : "Untitled Element"),
            createTime: new Date().toISOString(),
            favorited: false,
          },
        };

        const optimisticMedia = {
          id: `${optimisticId}-item`,
          name: `${optimisticId}-item`,
          url: null,
          status: "pending",
          projectId,
          workflowId: optimisticId,
          workflowStepId: "CAE",
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: "PRIVATE",
          },
          generationConfig: {
            prompt: payload.prompt,
            model: payload.model_name || payload.model,
          },
          image: {
            dimensions: { width: 1024, height: 1024 },
            generatedImage: null,
          },
        };

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])],
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Element sheet creation failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === "function") onError(err);
    },
    onSuccess: (res, inputData) => {
      const payload = inputData?.payload || inputData || {};
      const projectId =
        payload.projectId || payload.project_id || res?.workflow?.project_id || res?.element?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}
