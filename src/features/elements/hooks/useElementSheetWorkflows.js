// [FSD Layer: features/elements/hooks] — Element workflows list decorator (1 hook/file).
import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { selectStudioWorkflows } from "@/features/workflows/model/selectStudioWorkflows";

/**
 * useElementSheetWorkflows
 * Retrieves and filters all element workflows for a given project via the unified selector engine.
 */
export function useElementSheetWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const filters = useWorkflowsStore((s) => s.filters || s._elementFilters);

  const workflows = useMemo(() => {
    return selectStudioWorkflows(data?.projectContents, {
      type: "element",
      filters,
    });
  }, [data?.projectContents, filters]);

  return { workflows, isLoading, isError };
}
