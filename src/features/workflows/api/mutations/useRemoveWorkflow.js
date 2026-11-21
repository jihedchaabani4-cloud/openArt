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
      const idsToRemove = (Array.isArray(workflowIds) ? workflowIds : workflowId ? [workflowId] : []).filter(Boolean);
      if (idsToRemove.length === 0) return oldData;

      const cleanIds = idsToRemove.map((id) => String(id).replace(/^workflows\//, ''));
      const cleanIdSet = new Set(cleanIds);

      const currentWorkflows = oldData.projectContents?.workflows || [];
      const currentTrashed = oldData.projectContents?.trashedWorkflows || [];
      const currentCharacters = oldData.projectContents?.characters || [];
      const currentElements = oldData.projectContents?.elements || [];
      const currentMedia = oldData.projectContents?.media || [];

      const nowIso = new Date().toISOString();
      const newlyTrashedEntries = [];
      const seenTrashedCleanIds = new Set();

      for (let i = 0; i < idsToRemove.length; i++) {
        const id = idsToRemove[i];
        const cleanId = cleanIds[i];
        if (!cleanId || seenTrashedCleanIds.has(cleanId)) continue;

        // Already in trash -> permanent delete (omit from trashedWorkflows)
        if (currentTrashed.some((wf) => matchWorkflowId(wf, id))) continue;

        seenTrashedCleanIds.add(cleanId);
        const targetWf =
          currentWorkflows.find((wf) => matchWorkflowId(wf, id)) ||
          currentCharacters.find((c) => matchWorkflowId(c, id)) ||
          currentElements.find((el) => matchWorkflowId(el, id));

        newlyTrashedEntries.push(
          targetWf
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
                id: cleanId,
                name: cleanId,
                deleted_at: nowIso,
                deletedAt: nowIso,
              }
        );
      }

      const matchesAnyTarget = (entity) => idsToRemove.some((id) => matchWorkflowId(entity, id));

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: currentWorkflows.filter((wf) => !matchesAnyTarget(wf)),
          trashedWorkflows: [
            ...newlyTrashedEntries,
            ...currentTrashed.filter((wf) => !matchesAnyTarget(wf)),
          ],
          characters: currentCharacters.filter((c) => !matchesAnyTarget(c)),
          elements: currentElements.filter((el) => !matchesAnyTarget(el)),
          media: currentMedia.filter((m) => {
            const mWf = String(m.workflowId || m.workflow_id || '').replace(/^workflows\//, '');
            return !cleanIdSet.has(mWf);
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
