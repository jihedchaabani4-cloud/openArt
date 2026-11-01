// [FSD Layer: features/trash/api/mutations] — Restore all trashed workflows mutation.
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useRestoreAllWorkflows:
 * Restores all workflows in the project's Trash with 0ms optimistic cache update and rollback on error.
 * Calls POST /api/trash/restore-all with { projectId }.
 */
export function useRestoreAllWorkflows() {
  return useOptimisticMutation({
    mutationFn: async ({ projectId }) => {
      const res = await api.post("/trash/restore-all", { projectId });
      if (res && res.ok === false) {
        throw new Error(res.message || "Failed to restore all workflows");
      }
      return res;
    },

    getEntityKey: ({ projectId }) => (projectId ? `project-trash-${projectId}` : "project-trash"),

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData) => {
      if (!oldData?.projectContents) return oldData;
      const currentTrashed = oldData.projectContents?.trashedWorkflows || [];
      const currentWorkflows = oldData.projectContents?.workflows || [];

      if (currentTrashed.length === 0) return oldData;

      const restoredList = currentTrashed.map((targetWf) => ({
        ...targetWf,
        deleted_at: null,
        deletedAt: null,
        metadata: {
          ...(targetWf.metadata || {}),
          deleted_at: null,
        },
      }));

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          trashedWorkflows: [],
          workflows: [...restoredList, ...currentWorkflows],
        },
      };
    },

    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      queryKeys.trash.all(),
      queryKeys.workflows.all(),
      queryKeys.library.all(),
    ],

    errorMessage: "Failed to restore all workflows. Changes were reverted.",
  });
}

export default useRestoreAllWorkflows;
