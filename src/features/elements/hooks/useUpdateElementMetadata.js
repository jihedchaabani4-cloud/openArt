// [FSD Layer: features/elements/hooks] — Update element metadata mutation (1 hook/file).
// Body copied VERBATIM from features/elements/hooks/useElement.js useUpdateElementMetadata.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * useUpdateElementMetadata
 * Partial updates for name, description, guidelines, and element_type.
 * Supports 0ms optimistic cache mutation.
 */
export function useUpdateElementMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, projectId, name, description, guidelines, elementType, element_type }) => {
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (description !== undefined) payload.description = description;
      if (guidelines !== undefined) {
        payload.guidelines = typeof guidelines === "string" ? guidelines : String(guidelines || "");
      }
      if (elementType !== undefined || element_type !== undefined) {
        payload.element_type = elementType || element_type;
      }

      const res = await api.patch(`/v2/elements/${workflowId}`, payload);
      return res;
    },
    onMutate: async ({ workflowId, projectId, name, description, guidelines, elementType, element_type }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const nextType = elementType || element_type;
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;

          const updatedWorkflows = (old.projectContents?.workflows || []).map((wf) => {
            if (wf.id !== workflowId && wf.name !== workflowId) return wf;
            return {
              ...wf,
              ...(name !== undefined ? { display_name: name } : {}),
              metadata: {
                ...(wf.metadata || {}),
                ...(name !== undefined ? { displayName: name } : {}),
                ...(nextType !== undefined ? { elementType: nextType } : {}),
              },
              element: {
                ...(wf.element || {}),
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(guidelines !== undefined ? { guidelines } : {}),
                ...(nextType !== undefined ? { element_type: nextType } : {}),
              },
            };
          });

          const updatedElements = (old.projectContents?.elements || []).map((el) => {
            if (el.workflow_id !== workflowId && el.id !== workflowId) return el;
            return {
              ...el,
              ...(name !== undefined ? { name } : {}),
              ...(description !== undefined ? { description } : {}),
              ...(guidelines !== undefined ? { guidelines } : {}),
              ...(nextType !== undefined ? { element_type: nextType } : {}),
            };
          });

          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: updatedWorkflows,
              elements: updatedElements,
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Element metadata update failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
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
