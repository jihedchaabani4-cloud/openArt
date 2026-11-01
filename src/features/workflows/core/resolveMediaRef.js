/**
 * [FSD Layer: features/workflows/core]
 * Pure Media Reference & Primary Media Resolution Pipeline.
 *
 * Rules:
 * - Pure JavaScript: zero React, zero DOM.
 * - Single source of truth for per-type primary media resolution.
 * - Maps workflow types to explicit pickers without dynamic registry bloat.
 * - Element cover respects workflow.primary_media_id (abolishes hash modulo).
 * - Character explicit pin always wins; falls back to sheet -> non-detail -> first.
 */

import { toMediaItem } from "./toMediaItem";

/**
 * Normalizes any workflow type variant into canonical enum.
 *
 * @param {Object|null} workflow
 * @returns {'UPLOAD' | 'GENERATION' | 'ELEMENT' | 'CHARACTER'}
 */
export function normalizeWorkflowType(workflow) {
  if (!workflow) return "GENERATION";

  const rawType = String(
    workflow.workflow_type ||
    workflow.workflowType ||
    workflow.type ||
    ""
  ).trim().toUpperCase();

  if (
    rawType.includes("CHARACTER") ||
    Boolean(workflow.is_character) ||
    Boolean(workflow.character) ||
    Boolean(workflow.character_id)
  ) {
    return "CHARACTER";
  }

  if (
    rawType.includes("ELEMENT") ||
    Boolean(workflow.is_element) ||
    Boolean(workflow.element) ||
    Boolean(workflow.element_id)
  ) {
    return "ELEMENT";
  }

  if (rawType.includes("UPLOAD") || Boolean(workflow.is_upload)) {
    return "UPLOAD";
  }

  return "GENERATION";
}

/**
 * Extracts primary media pointer from workflow or attached sidecar.
 *
 * @param {Object|null} workflow
 * @returns {string|null}
 */
export function getWorkflowPrimaryMediaId(workflow) {
  if (!workflow || typeof workflow !== "object") return null;

  if (Array.isArray(workflow.items)) {
    const primaryItem = workflow.items.find((it) => it?.is_primary || it?.isPrimary);
    if (primaryItem) {
      const id = primaryItem.id || primaryItem.media_id || primaryItem.name;
      if (id) return String(id).trim();
    }
  }

  const id =
    workflow.primary_media_id ??
    workflow.primaryMediaId ??
    workflow.metadata?.primaryMediaId ??
    workflow.character?.primary_media_id ??
    workflow.character?.primaryMediaId ??
    null;

  return id ? String(id).trim() : null;
}

/**
 * Matches an item's identity against a target ID.
 *
 * @param {Object} item
 * @param {string} targetId
 * @returns {boolean}
 */
function matchesId(item, targetId) {
  if (!item || !targetId) return false;
  const target = String(targetId).trim();
  if (item.id && String(item.id).trim() === target) return true;
  if (item.name && String(item.name).trim() === target) return true;
  if (item.raw?.id && String(item.raw.id).trim() === target) return true;
  if (item.raw?.name && String(item.raw.name).trim() === target) return true;
  if (item.raw?.asset_id && String(item.raw.asset_id).trim() === target) return true;
  return false;
}

/**
 * Checks if an item represents a character turnaround body sheet.
 *
 * @param {Object} item
 * @returns {boolean}
 */
function isSheetMedia(item) {
  if (!item) return false;
  if (item.role === "sheet" || item.role === "turnaround") return true;
  if (item.role && item.role !== "sheet" && item.role !== "turnaround") return false;
  const explicitRawRole = String(item.raw?.role || item.raw?.mediaRole || "").trim().toLowerCase();
  if (explicitRawRole === "sheet" || explicitRawRole === "turnaround") return true;
  if (explicitRawRole) return false;

  // Legacy fallback when no canonical role exists
  const legacyStep = String(item.raw?.workflowStepId || item.raw?.step_id || "").trim().toLowerCase();
  return legacyStep === "character_sheet" || legacyStep === "cae";
}

/**
 * Checks if an item represents a character detail / reference image.
 *
 * @param {Object} item
 * @returns {boolean}
 */
function isDetailMedia(item) {
  if (!item) return false;
  if (item.role === "detail" || item.role === "reference") return true;
  if (item.role && item.role !== "detail" && item.role !== "reference") return false;
  const explicitRawRole = String(item.raw?.role || item.raw?.mediaRole || "").trim().toLowerCase();
  if (explicitRawRole === "detail" || explicitRawRole === "reference") return true;
  if (explicitRawRole) return false;

  // Legacy fallback when no canonical role exists
  const legacyStep = String(item.raw?.workflowStepId || item.raw?.step_id || "").trim().toLowerCase();
  return legacyStep === "character_detail";
}

/**
 * Stably orders candidate MediaItems by created_at / create_time ascending when timestamps exist.
 *
 * @param {Array<MediaItem>} items
 * @returns {Array<MediaItem>}
 */
function orderByCreatedAtAsc(items = []) {
  if (!Array.isArray(items) || items.length <= 1) return items;

  const withIndex = items.map((item, index) => {
    const rawTs =
      item?.raw?.created_at ??
      item?.raw?.create_time ??
      item?.raw?.createdAt ??
      item?.createdAt ??
      null;
    const ts = rawTs ? Date.parse(rawTs) : NaN;
    return { item, index, ts: Number.isFinite(ts) ? ts : null };
  });

  if (!withIndex.some((entry) => entry.ts !== null)) {
    return items;
  }

  return withIndex
    .sort((a, b) => {
      if (a.ts !== null && b.ts !== null && a.ts !== b.ts) {
        return a.ts - b.ts;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * UPLOAD primary media picker:
 * Rule: primary_media_id -> first item with valid URL -> items[0].
 *
 * @param {Object} workflow
 * @param {Array<MediaItem>} items
 * @returns {MediaItem|null}
 */
export function pickUploadPrimaryMedia(workflow, items = []) {
  if (!items || items.length === 0) return null;

  const primaryId = getWorkflowPrimaryMediaId(workflow);
  if (primaryId) {
    const match = items.find((i) => matchesId(i, primaryId));
    if (match) return match;
  }

  return items.find((i) => Boolean(i.url)) || items[0] || null;
}

/**
 * GENERATION primary media picker:
 * Rule: primary_media_id -> earliest non-detail ready item with valid URL -> first ready item -> items[0].
 *
 * @param {Object} workflow
 * @param {Array<MediaItem>} items
 * @returns {MediaItem|null}
 */
export function pickGenerationPrimaryMedia(workflow, items = []) {
  if (!items || items.length === 0) return null;

  const primaryId = getWorkflowPrimaryMediaId(workflow);
  if (primaryId) {
    const match = items.find((i) => matchesId(i, primaryId));
    if (match) return match;
  }

  const ordered = orderByCreatedAtAsc(items);
  const nonDetailItems = ordered.filter((i) => !isDetailMedia(i));
  const pool = nonDetailItems.length > 0 ? nonDetailItems : ordered;

  const readyItemWithUrl = pool.find((i) => i.status === "ready" && Boolean(i.url));
  if (readyItemWithUrl) return readyItemWithUrl;

  const readyItem = pool.find((i) => i.status === "ready");
  if (readyItem) return readyItem;

  return pool.find((i) => Boolean(i.url)) || pool[0] || items[0] || null;
}

/**
 * ELEMENT primary media picker:
 * Rule: primary_media_id -> sheet/non-detail item with valid URL -> first item with valid URL -> items[0].
 * Hash modulo is completely abolished.
 *
 * @param {Object} workflow
 * @param {Array<MediaItem>} items
 * @returns {MediaItem|null}
 */
export function pickElementPrimaryMedia(workflow, items = []) {
  if (!items || items.length === 0) return null;

  const primaryId = getWorkflowPrimaryMediaId(workflow);
  if (primaryId) {
    const match = items.find((i) => matchesId(i, primaryId));
    if (match) return match;
  }

  const ordered = orderByCreatedAtAsc(items);
  const sheetWithUrl = ordered.find((i) => isSheetMedia(i) && Boolean(i.url));
  if (sheetWithUrl) return sheetWithUrl;

  const nonDetailWithUrl = ordered.find((i) => !isDetailMedia(i) && Boolean(i.url));
  if (nonDetailWithUrl) return nonDetailWithUrl;

  return ordered.find((i) => Boolean(i.url)) || ordered[0] || null;
}

/**
 * CHARACTER primary media picker:
 * Rule:
 * 1. Explicit primary_media_id pin always wins (even for detail images).
 * 2. First turnaround sheet media (role: 'sheet' | 'turnaround').
 * 3. First non-detail media (role !== 'detail').
 * 4. Fallback to items[0].
 *
 * @param {Object} workflow
 * @param {Array<MediaItem>} items
 * @returns {MediaItem|null}
 */
export function pickCharacterPrimaryMedia(workflow, items = []) {
  if (!items || items.length === 0) return null;

  const primaryId = getWorkflowPrimaryMediaId(workflow);
  if (primaryId) {
    const match = items.find((i) => matchesId(i, primaryId));
    if (match) return match;
  }

  // First turnaround sheet
  const sheetWithUrl = items.find((i) => isSheetMedia(i) && Boolean(i.url));
  if (sheetWithUrl) return sheetWithUrl;
  const anySheet = items.find((i) => isSheetMedia(i));
  if (anySheet) return anySheet;

  // First non-detail image
  const nonDetailWithUrl = items.find((i) => !isDetailMedia(i) && Boolean(i.url));
  if (nonDetailWithUrl) return nonDetailWithUrl;
  const anyNonDetail = items.find((i) => !isDetailMedia(i));
  if (anyNonDetail) return anyNonDetail;

  return items.find((i) => Boolean(i.url)) || items[0] || null;
}

/**
 * Plain lookup map of per-type pickers.
 */
export const PICKERS = Object.freeze({
  UPLOAD: pickUploadPrimaryMedia,
  GENERATION: pickGenerationPrimaryMedia,
  ELEMENT: pickElementPrimaryMedia,
  CHARACTER: pickCharacterPrimaryMedia,
});

/**
 * Resolves the main media item for a given workflow.
 *
 * @param {Object} workflow
 * @param {Array<Object|MediaItem>} [items]
 * @returns {MediaItem|null}
 */
export function resolveMainMedia(workflow, items = null) {
  if (!workflow && (!items || items.length === 0)) return null;

  const candidateItems =
    items ??
    workflow?.items ??
    workflow?.media ??
    workflow?.images ??
    workflow?.reference_images ??
    workflow?.element?.images ??
    [];
  const normalizedItems = candidateItems
    .map((item) =>
      item && item.kind && item.status
        ? item
        : toMediaItem(item, { workflowId: workflow?.id })
    )
    .filter(Boolean);

  if (normalizedItems.length === 0) return null;

  const type = normalizeWorkflowType(workflow);
  const picker = PICKERS[type] || PICKERS.GENERATION;
  return picker(workflow, normalizedItems);
}

/**
 * Resolves a media reference from an indexed cache or context.
 *
 * Precedence rule:
 * - If both mediaId and workflowId are provided, mediaId wins (resolves that media item).
 * - If only mediaId is provided, resolves that media item.
 * - If only workflowId is provided, resolves the main media of the workflow via its type picker.
 *
 * @param {Object|string|null} ref
 * @param {string} [ref.mediaId]
 * @param {string} [ref.workflowId]
 * @param {Object} context
 * @returns {MediaItem|null}
 */
export function resolveMediaRef(ref, context) {
  if (!ref || !context) return null;

  const cleanMediaId = ref.mediaId ?? ref.media_id ?? (typeof ref === "string" ? ref : null);
  const cleanWorkflowId = ref.workflowId ?? ref.workflow_id ?? null;

  // 1. If mediaId is provided, mediaId wins!
  if (cleanMediaId) {
    const targetId = String(cleanMediaId).trim();

    // Check composite index if workflowId is specified
    if (cleanWorkflowId && context.byCompositeKey) {
      const compositeMatch = context.byCompositeKey.get(`${cleanWorkflowId}:${targetId}`);
      if (compositeMatch) return compositeMatch;
    }

    // Check direct mediaId index
    if (context.byMediaId) {
      const mediaMatch = context.byMediaId.get(targetId);
      if (mediaMatch) return mediaMatch;
    }

    // Check context.items or context array
    const candidateList = Array.isArray(context) ? context : context.items;
    if (Array.isArray(candidateList)) {
      const itemMatch = candidateList.find((i) => matchesId(i, targetId));
      if (itemMatch) {
        return itemMatch.kind && itemMatch.status
          ? itemMatch
          : toMediaItem(itemMatch, { workflowId: cleanWorkflowId });
      }
    }

    return null;
  }

  // 2. Workflow resolution
  if (cleanWorkflowId) {
    const targetWfId = String(cleanWorkflowId).trim();
    const wf =
      context.workflows?.find((w) => w.id === targetWfId || w.name === targetWfId) ||
      context.workflow ||
      (context.id === targetWfId ? context : null) ||
      { id: targetWfId };

    const items =
      context.byWorkflowId?.get(targetWfId) ||
      context.items ||
      wf?.items ||
      wf?.media ||
      [];

    return resolveMainMedia(wf, items);
  }

  return null;
}

export default resolveMediaRef;
