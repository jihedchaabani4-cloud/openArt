// [FSD Layer: features/characters/hooks] — Character domain queries (1 hook/file).
import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { selectStudioWorkflows } from "@/features/workflows/model/selectStudioWorkflows";

/**
 * useCharacterWorkflows
 * Retrieves all character workflows for a given project via the unified selector engine,
 * decorated with their media items, primary turnaround sheet media, and visual generation status.
 */
export function useCharacterWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const filters = useWorkflowsStore((s) => s.filters);

  const characterWorkflows = useMemo(() => {
    return selectStudioWorkflows(data?.projectContents, {
      type: "character",
      filters,
    });
  }, [data?.projectContents, filters]);

  const rawWorkflows = data?.projectContents?.workflows ?? [];
  const rawCharacters = data?.projectContents?.characters ?? [];
  const totalCharacters = useMemo(() => {
    return (
      rawWorkflows.filter((w) => {
        const t = String(w.workflow_type || w.workflowType || "").toUpperCase();
        return t === "CHARACTER" || t === "CHARACTER_SHEET";
      }).length || rawCharacters.length
    );
  }, [rawWorkflows, rawCharacters]);

  return { workflows: characterWorkflows, totalCharacters, isLoading, isError };
}
