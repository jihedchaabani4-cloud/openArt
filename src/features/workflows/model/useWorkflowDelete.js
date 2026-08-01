"use client";

import { useState, useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * useWorkflowDelete Component/Hook
 * Centralized, unified service for deleting any workflow (Generations, Elements, Characters, etc.)
 * across the entire application.
 * 
 * Features:
 * - Instant 0ms Optimistic UI cache removal.
 * - Handles confirmation dialog state.
 * - Rollback on network failure.
 * - Refetches and syncs React Query project store.
 */
export function useWorkflowDelete() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mutation with instant Optimistic UI removal
  const deleteMutation = useMutation({
    mutationFn: async ({ workflowId }) => {
      const cleanId = String(workflowId || '').replace(/^workflows\//, '');
      return await api.delete(`/workflows/workflows/${cleanId}`);
    },

    onMutate: async ({ workflowId, projectId }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);

      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: (old.projectContents?.workflows || []).filter(
                (wf) => wf.id !== workflowId && wf.name !== workflowId
              ),
              media: (old.projectContents?.media || []).filter(
                (m) => m.workflowId !== workflowId
              ),
            },
          };
        });
      }

      return { previousData, projectKey };
    },

    onError: (err, variables, context) => {
      console.error("❌ Unified workflow delete failed, rolling back:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },

    onSuccess: (data, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(variables.projectId),
        });
      }
    },
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
  };
}

export default useWorkflowDelete;
