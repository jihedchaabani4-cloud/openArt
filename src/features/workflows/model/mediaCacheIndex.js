/**
 * [FSD Layer: features/workflows/model]
 * Pure memoized index for project media items.
 *
 * Rules:
 * - Pure JavaScript: zero React, zero DOM.
 * - Indexes by composite key (`${workflowId}:${mediaId}`), mediaId, and workflowId.
 * - Primary workflow ownership (`media.workflow_id`) wins for byMediaId lookups.
 * - Structural sharing via WeakMap over projectContents identity.
 */

import { toMediaItem } from "@/features/workflows/core/toMediaItem";

const INDEX_CACHE = new WeakMap();

const EMPTY_INDEX = Object.freeze({
  byCompositeKey: new Map(),
  byMediaId: new Map(),
  byWorkflowId: new Map(),
  workflows: [],
});

/**
 * Builds or retrieves the memoized index for a projectData payload.
 *
 * @param {Object|null|undefined} projectData
 * @returns {{
 *   byCompositeKey: Map<string, MediaItem>,
 *   byMediaId: Map<string, MediaItem>,
 *   byWorkflowId: Map<string, MediaItem[]>,
 *   workflows: Array<Object>,
 * }}
 */
export function buildProjectMediaIndex(projectData) {
  const contents = projectData?.projectContents;
  if (!contents || typeof contents !== "object") {
    return EMPTY_INDEX;
  }

  if (INDEX_CACHE.has(contents)) {
    return INDEX_CACHE.get(contents);
  }

  const byCompositeKey = new Map();
  const byMediaId = new Map();
  const byWorkflowId = new Map();

  const rawWorkflows = Array.isArray(contents.workflows) ? contents.workflows : [];
  const rawMedia = Array.isArray(contents.media) ? contents.media : [];

  for (const m of rawMedia) {
    if (!m || typeof m !== "object") continue;

    const rawId = String(m.id || m.name || m.asset_id || "");
    if (!rawId) continue;

    const rawWorkflowId = String(m.workflowId || m.workflow_id || "");

    const normalized = toMediaItem(m, {
      workflowId: rawWorkflowId,
      role: m.role || m.mediaRole,
    });

    // 1. Composite lookup
    if (rawWorkflowId) {
      const compKey = `${rawWorkflowId}:${rawId}`;
      byCompositeKey.set(compKey, normalized);
    }

    // 2. MediaId lookup: primary home workflow entry (first seen) wins;
    // subsequent secondary linked relations cannot overwrite it.
    if (!byMediaId.has(rawId)) {
      byMediaId.set(rawId, normalized);
    }

    // 3. Workflow media list
    if (rawWorkflowId) {
      let wfList = byWorkflowId.get(rawWorkflowId);
      if (!wfList) {
        wfList = [];
        byWorkflowId.set(rawWorkflowId, wfList);
      }
      wfList.push(normalized);
    }
  }

  const index = {
    byCompositeKey,
    byMediaId,
    byWorkflowId,
    workflows: rawWorkflows,
  };

  INDEX_CACHE.set(contents, index);
  return index;
}

export default buildProjectMediaIndex;
