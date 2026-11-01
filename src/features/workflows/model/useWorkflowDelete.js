"use client";

import { useState, useCallback } from "react";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { matchWorkflowId } from "@/shared/lib/optimistic/cacheOps";
import { workflowEntity } from "@/shared/lib/optimistic/entityKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useWorkflowDelete Component/Hook
 * Centralized, unified service for deleting any workflow (Generations, Elements, Characters, etc.)
 * across the entire application.
 * 
 * Features:
 * - Instant 0ms Optimistic UI cache removal.
 * - Coordinated with entityTracker (workflowEntity).
 * - Handles confirmation dialog state.
 * - Standardized rollback & toast on network failure.
 */
export function useWorkflowDelete() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mutation with instant Optimistic UI removal and tracker coordination
  const deleteMutation = useOptimisticMutation({
    mutationFn: async ({ workflowId, workflowType }) => {
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');
      const type = String(workflowType || '').toUpperCase();
      if (type === "CHARACTER" || type === "CHARACTER_SHEET") {
        return await api.delete(`/characters/${cleanId}`);
      }
      if (type === "ELEMENT_SHEET" || type === "ELEMENT") {
        return await api.delete(`/v2/elements/${cleanId}`);
      }
      return await api.delete(`/workflows/workflows/${cleanId}`);
    },

    getEntityKey: ({ workflowId }) => workflowEntity(workflowId),

    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    applyOptimistic: (oldData, { workflowId }) => {
      if (!oldData?.projectContents) return oldData;
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: (oldData.projectContents?.workflows || []).filter(
            (wf) => !matchWorkflowId(wf, workflowId)
          ),
          trashedWorkflows: (oldData.projectContents?.trashedWorkflows || []).filter(
            (wf) => !matchWorkflowId(wf, workflowId)
          ),
          characters: (oldData.projectContents?.characters || []).filter(
            (c) => !matchWorkflowId(c, workflowId)
          ),
          elements: (oldData.projectContents?.elements || []).filter(
            (el) => !matchWorkflowId(el, workflowId)
          ),
          media: (oldData.projectContents?.media || []).filter(
            (m) => String(m.workflowId || m.workflow_id || '').replace(/^workflows\//, '') !== cleanId
          ),
        },
      };
    },

    invalidateKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),

    errorMessage: "Failed to delete item. Changes were reverted.",
  });

  // Prompt confirmation dialog
  const promptDelete = useCallback((target) => {
    if (typeof target === "string") {
      setDeleteTarget({ id: target });
    } else {
      setDeleteTarget(target);
    }
    setIsDeleteDialogOpen(true);
  }, []);

  // Execute deletion with instant 0ms dialog close
  const confirmDelete = useCallback(
    (overrideProjectId) => {
      if (!deleteTarget) return;

      const workflowId = deleteTarget.id || deleteTarget.name;
      const projectId = deleteTarget.projectId || overrideProjectId;
      const workflowType = deleteTarget.workflow_type || deleteTarget.workflowType;

      // Close dialog instantly
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);

      // Mutate in background
      deleteMutation.mutate({ workflowId, projectId, workflowType });
    },
    [deleteTarget, deleteMutation]
  );

  return {
    deleteTarget,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    promptDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
    deleteMutation,
  };
}

export default useWorkflowDelete;
