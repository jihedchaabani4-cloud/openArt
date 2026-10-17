// [FSD Layer: features/characters/hooks] — Character domain queries (1 hook/file).
// Body copied VERBATIM from features/characters/hooks/useCharacter.js useCharacterWorkflows.
import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";

/**
 * useCharacterWorkflows
 * Retrieves all character workflows for a given project, decorated with their
 * media items, primary turnaround sheet media, and visual generation status.
 */
export function useCharacterWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const projectContents = data?.projectContents;

  const characterWorkflows = useMemo(() => {
    const workflows = projectContents?.workflows || [];
    const media = projectContents?.media || [];

    return workflows
      .filter((w) => {
        const type = String(w.workflow_type || "").toUpperCase();
        return type === "CHARACTER" || type === "CHARACTER_SHEET";
      })
      .map((w) => {
        const wId = w.name || w.id;
        const items = media.filter((m) => m.workflowId === wId || m.workflow_id === wId);

        // Canonical main turnaround sheet / cover media resolution
        const characterWf = {
          ...w,
          workflow_type: "CHARACTER",
        };
        const resolved = resolveMainMedia(characterWf, items);
        const mainMedia = resolved?.raw || resolved || null;

        let status = "processing";
        if (resolved) {
          if (resolved.status === "failed") {
            status = "failed";
          } else if (resolved.status === "processing") {
            status = "processing";
          } else if (resolved.status === "ready" || resolved.status === "completed" || Boolean(resolved.url)) {
            status = "completed";
          }
        }

        const primaryUrl = resolved?.url || mainMedia?.url || mainMedia?.file_url || w.url || null;

        return {
          ...w,
          items,
          mainMedia,
          primary_media_url: primaryUrl,
          status,
          isMultiMedia: items.length > 1,
        };
      });
  }, [projectContents]);

  return { workflows: characterWorkflows, isLoading, isError };
}
