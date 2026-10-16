/**
 * [FSD Layer: features/workflows/model]
 * Pure cache selector for resolving media items from the Project Cache.
 * 
 * Rules:
 * - 100% pure selector: ZERO background network fetches (no N+1 queries).
 * - Reads from useProjectData(projectId).
 * - Returns { item: MediaItem | null, state: 'loading' | 'empty' | 'notFound' | 'processing' | 'failed' | 'ready' }.
 * - When mediaId is provided, resolves media item (supporting composite workflow scoping).
 * - When workflowId is provided, resolves the main media of that workflow.
 */

import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { resolveMediaRef } from "@/features/workflows/core/resolveMediaRef";
import { buildProjectMediaIndex } from "./mediaCacheIndex";

/**
 * Maps a resolved MediaItem to its lifecycle state.
 *
 * @param {MediaItem|null} item
 * @returns {'processing' | 'failed' | 'ready'}
 */
function itemToState(item) {
  if (!item) return "notFound";
  if (item.status === "failed") return "failed";
  if (item.status === "processing") return "processing";
  return "ready";
}

/**
 * useResolvedMedia selector hook.
 *
 * @param {Object} params
 * @param {string} [params.mediaId]
 * @param {string} [params.workflowId]
 * @param {string} params.projectId
 * @returns {{
 *   item: MediaItem | null,
 *   state: 'loading' | 'empty' | 'notFound' | 'processing' | 'failed' | 'ready'
 * }}
 */
export function useResolvedMedia({ mediaId, workflowId, projectId } = {}) {
  const { data: projectData, isLoading, isError } = useProjectData(projectId);

  const cleanMediaId = mediaId ? String(mediaId).trim() : null;
  const cleanWorkflowId = workflowId ? String(workflowId).trim() : null;

  const index = useMemo(() => {
    return buildProjectMediaIndex(projectData);
  }, [projectData]);

  return useMemo(() => {
    if (!projectId) {
      return { item: null, state: "notFound" };
    }

    if (isLoading) {
      return { item: null, state: "loading" };
    }

    if (isError) {
      return { item: null, state: "failed" };
    }

    // 1. Direct media resolution (mediaId takes precedence)
    if (cleanMediaId) {
      const resolved = resolveMediaRef(
        { mediaId: cleanMediaId, workflowId: cleanWorkflowId },
        index
      );

      if (resolved) {
        return { item: resolved, state: itemToState(resolved) };
      }
      return { item: null, state: "notFound" };
    }

    // 2. Workflow resolution (resolve main media for workflowId)
    if (cleanWorkflowId) {
      const wf = index.workflows.find(
        (w) => w.id === cleanWorkflowId || w.name === cleanWorkflowId
      );

      if (!wf) {
        return { item: null, state: "notFound" };
      }

      const items = index.byWorkflowId.get(cleanWorkflowId) || [];
      if (items.length === 0) {
        return { item: null, state: "empty" };
      }

      const mainItem = resolveMediaRef({ workflowId: cleanWorkflowId }, index);

      if (mainItem) {
        return { item: mainItem, state: itemToState(mainItem) };
      }
      return { item: null, state: "empty" };
    }

    return { item: null, state: "notFound" };
  }, [projectId, isLoading, isError, cleanMediaId, cleanWorkflowId, index]);
}

export default useResolvedMedia;
