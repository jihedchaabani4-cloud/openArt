import { useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { selectStudioWorkflows } from "./selectStudioWorkflows";

/**
 * [FSD Layer: features/workflows]
 * Unified hook to fetch, filter, search, and sort Cinema Studio workflows.
 * Consumes single project-data source of truth and applies centralized filtering.
 *
 * @param {string} projectId
 * @param {Object} [options]
 * @param {string} [options.type='all'] - 'all' | 'generation' | 'upload' | 'element' | 'character'
 * @param {string} [options.lifecycle='active'] - 'active' | 'trash'
 * @param {string} [options.search=''] - Search query
 * @param {boolean} [options.liked=false] - Favorite items only
 * @param {string} [options.sort='newest'] - 'newest' | 'oldest'
 */
export function useStudioWorkflows(projectId, options = {}) {
  const queryResult = useProjectData(projectId);

  const { type, domain, lifecycle, search, liked, sort, showUploaded, filters } = options;

  const workflows = useMemo(() => {
    return selectStudioWorkflows(queryResult.data?.projectContents, {
      type,
      domain,
      lifecycle,
      search,
      liked,
      sort,
      showUploaded,
      filters,
    });
  }, [
    queryResult.data?.projectContents,
    type,
    domain,
    lifecycle,
    search,
    liked,
    sort,
    showUploaded,
    filters,
  ]);

  return {
    ...queryResult,
    workflows,
    data: {
      ...queryResult.data,
      filteredWorkflows: workflows,
    },
  };
}

export default useStudioWorkflows;
