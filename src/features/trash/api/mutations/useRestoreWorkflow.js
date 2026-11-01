// [FSD Layer: features/trash/api/mutations] — Restore trashed workflow mutation.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { matchWorkflowId } from "@/shared/lib/optimistic/cacheOps";
import { workflowEntity } from "@/shared/lib/optimistic/entityKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useRestoreWorkflow:
 * Restores a workflow from Trash with 0ms optimistic cache update and rollback on error.
 * Calls POST /api/trash/:workflowId/restore (via api.post(`/trash/${cleanId}/restore`)).
 */
export function useRestoreWorkflow() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId }) => {
      if (!workflowId) throw new Error("workflowId is required");
      const cleanId = String(workflowId).replace(/^workflows\//, "");
      const res = await api.post(`/trash/${cleanId}/restore`);
      if (res && res.ok === false) {
        throw new Error(res.message || "Failed to restore workflow");
      }
      return res;
    },

    getEntityKey: ({ workflowId }) => (workflowId ? workflowEntity(workflowId) : null),

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { workflowId }) => {
      if (!oldData?.projectContents) return oldData;
      const currentTrashed = oldData.projectContents?.trashedWorkflows || [];
      const currentWorkflows = oldData.projectContents?.workflows || [];

      const targetWf = currentTrashed.find((wf) => matchWorkflowId(wf, workflowId));

      const updatedTrashed = currentTrashed.filter((wf) => !matchWorkflowId(wf, workflowId));
      const restoredWf = targetWf
        ? {
            ...targetWf,
            deleted_at: null,
            deletedAt: null,
            metadata: {
              ...(targetWf.metadata || {}),
              deleted_at: null,
            },
          }
        : null;

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          trashedWorkflows: updatedTrashed,
          workflows: restoredWf
            ? [restoredWf, ...currentWorkflows.filter((wf) => !matchWorkflowId(wf, workflowId))]
            : currentWorkflows,
        },
      };
    },

    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      queryKeys.trash.all(),
      queryKeys.workflows.all(),
      queryKeys.library.all(),
    ],

    errorMessage: "Failed to restore workflow. Changes were reverted.",
  });
}

export default useRestoreWorkflow;
