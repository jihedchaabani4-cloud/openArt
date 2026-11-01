// [FSD Layer: features/workflows/api/mutations] — Remove workflow mutation (1 hook/file).
// Optimistically removes workflow and associated media; rolls back on error.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchWorkflowId } from '@/shared/lib/optimistic/cacheOps';
import { workflowEntity } from '@/shared/lib/optimistic/entityKeys';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';

export function useRemoveWorkflow() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId, workflowIds }) => {
      const ids = workflowIds || (workflowId ? [workflowId] : []);
      if (ids.length === 0) throw new Error("workflowId is required");
      const cleanIds = ids.map((id) => String(id || '').replace(/^workflows\//, ''));

      const res = cleanIds.length === 1
        ? await api.delete(`/workflows/workflows/${cleanIds[0]}`)
        : await api.delete(`/workflows/workflows`, {
            body: JSON.stringify({ workflow_ids: cleanIds }),
          });

      if (!res.ok) throw new Error(res.message || "Failed to remove workflow");
      return ids;
    },

    getEntityKey: ({ workflowId, workflowIds }) => {
      const targetId = workflowId || (Array.isArray(workflowIds) ? workflowIds[0] : null);
      return targetId ? workflowEntity(targetId) : null;
    },

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { workflowId, workflowIds }) => {
      if (!oldData?.projectContents) return oldData;
      const idsToRemove = workflowIds || (workflowId ? [workflowId] : []);
      const cleanIds = idsToRemove.map((id) => String(id || '').replace(/^workflows\//, ''));

      const currentWorkflows = oldData.projectContents?.workflows || [];
      const currentTrashed = oldData.projectContents?.trashedWorkflows || [];
      const currentCharacters = oldData.projectContents?.characters || [];
      const currentElements = oldData.projectContents?.elements || [];
      const currentMedia = oldData.projectContents?.media || [];

      // Check if target is already in trash (permanent delete) or active (move to trash)
      const targetId = idsToRemove[0];
      const isAlreadyTrashed = currentTrashed.some((wf) => matchWorkflowId(wf, targetId));

      if (isAlreadyTrashed) {
        return {
          ...oldData,
          projectContents: {
            ...oldData.projectContents,
            workflows: currentWorkflows.filter((wf) => !idsToRemove.some((id) => matchWorkflowId(wf, id))),
            trashedWorkflows: currentTrashed.filter((wf) => !idsToRemove.some((id) => matchWorkflowId(wf, id))),
            characters: currentCharacters.filter((c) => !idsToRemove.some((id) => matchWorkflowId(c, id))),
            elements: currentElements.filter((el) => !idsToRemove.some((id) => matchWorkflowId(el, id))),
            media: currentMedia.filter((m) => {
              const mWf = String(m.workflowId || m.workflow_id || '').replace(/^workflows\//, '');
              return !cleanIds.includes(mWf);
            }),
          },
        };
      }

      // Move to trash: find active workflow and move it to trashedWorkflows
      const targetWf = currentWorkflows.find((wf) => matchWorkflowId(wf, targetId))
        || currentCharacters.find((c) => matchWorkflowId(c, targetId))
        || currentElements.find((el) => matchWorkflowId(el, targetId));

      const nowIso = new Date().toISOString();
      const trashedEntry = targetWf
        ? {
            ...targetWf,
            deleted_at: nowIso,
            deletedAt: nowIso,
            metadata: {
              ...(targetWf.metadata || {}),
              deleted_at: nowIso,
            },
          }
        : {
            id: cleanIds[0],
            name: cleanIds[0],
            deleted_at: nowIso,
            deletedAt: nowIso,
          };

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: currentWorkflows.filter((wf) => !idsToRemove.some((id) => matchWorkflowId(wf, id))),
          trashedWorkflows: [
            trashedEntry,
            ...currentTrashed.filter((wf) => !idsToRemove.some((id) => matchWorkflowId(wf, id))),
          ],
          characters: currentCharacters.filter((c) => !idsToRemove.some((id) => matchWorkflowId(c, id))),
          elements: currentElements.filter((el) => !idsToRemove.some((id) => matchWorkflowId(el, id))),
          media: currentMedia.filter((m) => {
            const mWf = String(m.workflowId || m.workflow_id || '').replace(/^workflows\//, '');
            return !cleanIds.includes(mWf);
          }),
        },
      };
    },

    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      queryKeys.trash.all(),
      queryKeys.library.all(),
    ],

    errorMessage: "Failed to remove workflow. Changes were reverted.",
  });
}

export default useRemoveWorkflow;
