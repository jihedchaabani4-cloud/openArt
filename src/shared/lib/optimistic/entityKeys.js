// [FSD Layer: shared/lib/optimistic] Shared entity keys for optimistic concurrency.
// Owns: the ONE key format per entity type, so different hooks touching the same item
// (e.g. move folder + delete folder, rename workflow + move workflow) coordinate.
// Public: folderEntity(id) · workflowEntity(id) · mediaEntity(id)

import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";

/** @param {string} folderId */
export const folderEntity = (folderId) => ["folder", String(folderId ?? "")];

/** Workflow-like entities (workflows, characters, elements). "workflows/" prefix is stripped. */
export const workflowEntity = (workflowId) => ["workflow", stripWorkflowPrefix(String(workflowId ?? ""))];

/** @param {string} mediaId */
export const mediaEntity = (mediaId) => ["media", String(mediaId ?? "")];
