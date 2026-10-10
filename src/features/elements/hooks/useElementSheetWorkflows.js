// [FSD Layer: features/elements/hooks] — Element workflows list decorator (1 hook/file).
// Body copied VERBATIM from features/elements/hooks/useElement.js useElementSheetWorkflows.
import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";

/**
 * useElementSheetWorkflows
 * Retrieves and filters all element workflows for a given project.
 */
export function useElementSheetWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];
  const elements = data?.projectContents?.elements ?? [];
  const filters = useWorkflowsStore((s) => s._elementFilters);

  const elementMap = useMemo(() => {
    const map = new Map();
    elements.forEach((e) => {
      if (e.workflow_id) map.set(e.workflow_id, e);
      if (e.id) map.set(e.id, e);
    });
    return map;
  }, [elements]);

  const allElements = useMemo(() => {
    return workflows
      .filter((w) => {
        const type = String(w.workflow_type || "").toUpperCase();
        return type === "ELEMENT_SHEET" || type === "ELEMENT";
      })
      .map((w) => {
        const elem = elementMap.get(w.id) || elementMap.get(w.name) || w.element || {};
        const items = media.filter((m) => m.workflowId === w.name || m.workflowId === w.id);
        const status = items[0]?.status || w.status || (items[0]?.url ? "success" : "processing");

        const rawGuidelines = elem.guidelines ?? w.guidelines ?? w.metadata?.guidelines ?? "";
        const cleanGuidelines = Array.isArray(rawGuidelines)
          ? rawGuidelines.join("\n")
          : String(rawGuidelines || "");

        return {
          ...w,
          element: elem,
          element_type: elem.element_type || "object",
          description: elem.description || "",
          guidelines: cleanGuidelines,
          items,
          status,
          isMultiMedia: items.length > 1,
        };
      });
  }, [workflows, media, elementMap]);

  const filteredElements = useMemo(() => {
    return allElements
      .filter((w) => {
        if (filters?.liked && !w.metadata?.favorited) return false;

        const config = w.items?.[0]?.generationConfig || {};
        const wPrompt = (config.prompt || "").toLowerCase();

        if (filters?.prompt?.trim()) {
          const q = filters.prompt.toLowerCase();
          if (
            !(w.name || "").toLowerCase().includes(q) &&
            !(w.metadata?.displayName || "").toLowerCase().includes(q) &&
            !wPrompt.includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.metadata?.createTime || 0).getTime();
        const tB = new Date(b.metadata?.createTime || 0).getTime();
        return filters?.sort === "oldest" ? tA - tB : tB - tA;
      });
  }, [allElements, filters]);

  return { workflows: filteredElements, isLoading, isError };
}
