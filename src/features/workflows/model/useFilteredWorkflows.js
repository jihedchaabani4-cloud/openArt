import { useMemo } from "react";
import { useProjectData } from "../api/workflowsApi";
import { useWorkflowsStore } from "./useWorkflowsStore";
import { selectStudioWorkflows } from "./selectStudioWorkflows";

export { selectStudioWorkflows } from "./selectStudioWorkflows";

// ─────────────────────────────────────────────────────────────────────────────
// main hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [FSD Layer: features/workflows]
 *
 * Retrieves and filters project workflows for the primary studio timeline / assets view.
 * Consolidates filtering via the unified selectStudioWorkflows engine.
 */
export function useFilteredWorkflows(projectId) {
  // Always fetch the FULL project data (cached heavily)
  const queryResult = useProjectData(projectId);
  const filters = useWorkflowsStore((s) => s.filters || s._generationFilters);
  const showUploadedMedia = useWorkflowsStore((s) => s.showUploadedMedia);
  const showUploaded = showUploadedMedia !== false;

  const rawWorkflows = queryResult.data?.projectContents?.workflows ?? [];

  // ── filteredWorkflows (via unified selector) ──────────────────────────────
  const filteredWorkflows = useMemo(() => {
    return selectStudioWorkflows(queryResult.data?.projectContents, {
      domain: "assets",
      filters,
      showUploaded,
    });
  }, [queryResult.data?.projectContents, filters, showUploaded]);

  // ── availableModels ──────────────────────────────────────────────────────
  const availableModels = useMemo(() => {
    const rawBatches = queryResult.data?.projectContents?.batches ?? [];
    const models = rawBatches
      .map((b) => b.generationConfig?.model)
      .filter(Boolean);
    return [...new Set(models)];
  }, [queryResult.data?.projectContents?.batches]);

  // ─────────────────────────────────────────────────────────────────────────
  return {
    ...queryResult,
    availableModels,
    filteredCount: filteredWorkflows.length,
    total: rawWorkflows.filter((wf) => {
      const wType = String(wf.workflow_type || wf.workflowType || "").toUpperCase();
      return (
        wType !== "ELEMENT_SHEET" &&
        wType !== "ELEMENT" &&
        wType !== "CHARACTER" &&
        wType !== "CHARACTER_SHEET"
      );
    }).length,
    data: {
      ...queryResult.data,
      filteredWorkflows,
      availableModels,
    },
  };
}

// ── Alias for compatibility ──────────────────────────────────────────────────
export const useFilteredGenerations = useFilteredWorkflows;
