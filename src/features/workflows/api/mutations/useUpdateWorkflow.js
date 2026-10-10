// [FSD Layer: features/workflows/api/mutations] — Update workflow mutation (1 hook/file).
// Optimistically updates workflow, character, and element in projectData cache.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { stripWorkflowPrefix } from '@/features/workflows/lib/cacheHelpers';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';
import { workflowEntity } from '@/shared/lib/optimistic/entityKeys';

export function useUpdateWorkflow() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId, workflowData }) => {
      const cleanId = stripWorkflowPrefix(workflowId);
      const res = await api.patch(`/workflows/workflows/${cleanId}`, workflowData);
      if (res && res.ok === false) throw new Error(res.message || "Failed to update workflow");
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getEntityKey: ({ workflowId }) => workflowEntity(workflowId),
    applyOptimistic: (oldData, { workflowId, workflowData }) => {
      if (!oldData?.projectContents) return oldData;
      const cleanId = stripWorkflowPrefix(workflowId);
      if (!cleanId || !workflowData) return oldData;

      const newName = workflowData.display_name || workflowData.name;
      const newDesc = workflowData.description || workflowData.character_info;

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
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      ['workflows'],
    ],
    errorMessage: "Failed to update workflow. Changes were reverted.",
  });
}

export default useUpdateWorkflow;
