// [FSD Layer: features/workflows/api/mutations] — Update workflow mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useUpdateWorkflow.
// Preserves the cascade update to workflows + characters + elements caches.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { stripWorkflowPrefix } from '@/features/workflows/lib/cacheHelpers';

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, workflowData }) => {
      const cleanId = stripWorkflowPrefix(workflowId);
      const res = await api.patch(`/workflows/workflows/${cleanId}`, workflowData);
      if (res && res.ok === false) throw new Error(res.message || "Failed to update workflow");
      return res;
    },
    onSuccess: (data, variables) => {
      const { workflowId, workflowData } = variables || {};
      const cleanId = stripWorkflowPrefix(workflowId);

      // 1. Immediately update query cache across all projectData queries
      if (cleanId && workflowData) {
        const newName = workflowData.display_name || workflowData.name;
        const newDesc = workflowData.description || workflowData.character_info;
        queryClient.setQueriesData({ queryKey: ['projectData'] }, (oldData) => {
          if (!oldData?.projectContents) return oldData;
          const updatedWorkflows = (oldData.projectContents.workflows || []).map((w) => {
            const wCleanId = stripWorkflowPrefix(w.id || w.name || '');
            if (wCleanId === cleanId) {
              return {
                ...w,
                ...workflowData,
                display_name: newName || w.display_name,
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

          const updatedCharacters = (oldData.projectContents.characters || []).map((c) => {
            const cId = stripWorkflowPrefix(c.id || '');
            const cWfId = stripWorkflowPrefix(c.workflow_id || '');
            if (cId === cleanId || cWfId === cleanId) {
              return {
                ...c,
                ...workflowData,
                description: newDesc !== undefined ? newDesc : c.description,
                character_info: newDesc !== undefined ? newDesc : c.character_info,
                name: newName || c.name,
                title: newName || c.title,
              };
            }
            return c;
          });

          const updatedElements = (oldData.projectContents.elements || []).map((el) => {
            const elId = stripWorkflowPrefix(el.id || '');
            const elWfId = stripWorkflowPrefix(el.workflow_id || '');
            if (elId === cleanId || elWfId === cleanId) {
              return {
                ...el,
                ...workflowData,
                name: newName || el.name,
              };
            }
            return el;
          });

          return {
            ...oldData,
            projectContents: {
              ...oldData.projectContents,
              workflows: updatedWorkflows,
              characters: updatedCharacters,
              elements: updatedElements,
            },
          };
        });
      }

      // 2. Invalidate queries for background refetch
      queryClient.invalidateQueries({ queryKey: ['projectData'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}
