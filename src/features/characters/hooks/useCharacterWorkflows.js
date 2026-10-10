// [FSD Layer: features/characters/hooks] — Character domain queries (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useCharacterWorkflows.
import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { matchMediaId } from "@/features/workflows/lib/cacheHelpers";

/**
 * useCharacterWorkflows
 * Retrieves all character workflows for a given project, decorated with their
 * media items, primary turnaround sheet media, and visual generation status.
 */
export function useCharacterWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];

  const characterWorkflows = useMemo(() => {
    return workflows
      .filter((w) => {
        const type = String(w.workflow_type || "").toUpperCase();
        return type === "CHARACTER" || type === "CHARACTER_SHEET";
      })
      .map((w) => {
        const wId = w.name || w.id;
        const items = media.filter((m) => m.workflowId === wId || m.workflow_id === wId);

        // Locate main turnaround sheet media
        const primaryId = w.primary_media_id || w.primaryMediaId || w.metadata?.primaryMediaId;
        const validItems = items.filter(m => m.step_id !== "character_detail" && Boolean(m.url || m.file_url));
        const mainMedia =
          (primaryId && validItems.find((m) => matchMediaId(m, primaryId))) ||
          validItems.find((m) => m.step_id === "character_sheet" || m.stepId === "character_sheet") ||
          validItems.find((m) => m.step_id === "CAE") ||
          validItems[0] ||
          (primaryId && items.find((m) => matchMediaId(m, primaryId) && m.step_id !== "character_detail")) ||
          items.find((m) => m.step_id === "character_sheet" || m.stepId === "character_sheet") ||
          items.find((m) => m.step_id === "CAE") ||
          items.find((m) => m.step_id !== "character_detail") ||
          items[0] ||
          w.main_media ||
          null;

        let status = "processing";
        if (mainMedia) {
          if (mainMedia.status === "failed" || mainMedia.status === "error") {
            status = "failed";
          } else if (mainMedia.status === "success" || mainMedia.status === "completed" || Boolean(mainMedia.url)) {
            status = "completed";
          } else if (mainMedia.status === "processing" || mainMedia.status === "pending") {
            status = "processing";
          }
        }

        const primaryUrl = mainMedia?.url || mainMedia?.file_url || w.url || null;

        return {
          ...w,
          items,
          mainMedia,
          primary_media_url: primaryUrl,
          status,
          isMultiMedia: items.length > 1,
        };
      });
  }, [workflows, media]);

  return { workflows: characterWorkflows, isLoading, isError };
}
