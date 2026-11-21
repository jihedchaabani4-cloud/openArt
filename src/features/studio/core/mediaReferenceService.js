/**
 * Studio Media Reference Helpers
 *
 * Pure read-only helpers for entity capability checks and media asset normalization.
 * All prompt bar mutations go directly through `promptBarService` from `@/features/prompt-bar`.
 */

import { getEntityImageCount, getModelReferenceCapability } from "@/features/prompt-bar";
/**
 * Determines whether at least one model in the catalog can accept this entity.
 * Checks image domain and model capacity (maxRefs >= requiredCount).
 *
 * @param {object} entity - Character or Element entity/workflow
 * @param {Array<object>} models - Available model catalog
 * @returns {boolean}
 */
export function canAnyModelAcceptEntity(entity, models = []) {
  if (!entity) return true;
  const list = Array.isArray(models) ? models : Object.values(models || {});
  if (list.length === 0) return true;

  const count = getEntityImageCount(entity);
  return list.some((m) => {
    if (m.domain !== "image") return false;
    const cap = getModelReferenceCapability(m);
    return cap.supports && (cap.maxRefs || 0) >= count;
  });
}

/**
 * Normalizes any workflow, media item, or asset into the canonical shape expected
 * by PromptBarPlatform and its active run serialization.
 *
 * @param {object} media - Raw media object from workflow or item
 * @param {string} [defaultRole="reference"] - Default slot role
 * @returns {object|null}
 */
export function normalizeMediaAsset(media, defaultRole = "reference") {
  if (!media) return null;

  const workflowId =
    media.workflow_id || media.workflowId || media.id || media.asset_id || media.assetId || null;

  const rawWorkflowType = String(media.workflow_type || media.workflowType || "").toUpperCase();
  const isElement =
    media.type === "element" ||
    Boolean(media.is_element) ||
    Boolean(media.elementId) ||
    Boolean(media.element) ||
    rawWorkflowType === "ELEMENT" ||
    rawWorkflowType === "ELEMENT_SHEET";

  const isCharacter =
    media.type === "character" ||
    Boolean(media.is_character) ||
    Boolean(media.characterId) ||
    Boolean(media.character) ||
    rawWorkflowType === "CHARACTER" ||
    rawWorkflowType === "CHARACTER_SHEET";

  const isVideo = Boolean(
    media.is_video ||
      media.type === "video" ||
      media.url?.toLowerCase().endsWith(".mp4") ||
      media.url?.toLowerCase().endsWith(".webm") ||
      media.file_url?.toLowerCase().endsWith(".mp4")
  );

  const resolvedType = isCharacter
    ? "character"
    : isElement
    ? "element"
    : isVideo
    ? "video"
    : "image";

  let url =
    media.url ||
    media.preview ||
    media.file_url ||
    media.src ||
    media.image?.url ||
    media.video?.url ||
    "";

  if (!url && isCharacter) {
    const sheetItem =
      (media.items || []).find(
        (i) => (i.step_id === "character_sheet" || i.stepId === "character_sheet") && Boolean(i.url || i.file_url)
      ) ||
      (media.items || []).find((i) => i.step_id !== "character_detail" && Boolean(i.url || i.file_url)) ||
      media.items?.[0];
    url = sheetItem?.url || sheetItem?.file_url || "";
  } else if (!url && isElement) {
    const elemItem =
      (media.items || []).find((i) => Boolean(i.url || i.file_url)) || media.items?.[0];
    url = elemItem?.url || elemItem?.file_url || "";
  }

  const displayName =
    media.displayName ||
    media.display_name ||
    media.name ||
    media.title ||
    media.character?.name ||
    media.element?.name ||
    (isCharacter ? "Character" : isElement ? "Element" : "Reference");

  return {
    workflow_id: workflowId,
    id: workflowId,
    asset_id: workflowId,
    url,
    preview: url,
    displayName,
    type: resolvedType,
    workflow_type:
      media.workflow_type ||
      (isCharacter ? "CHARACTER_SHEET" : isElement ? "ELEMENT_SHEET" : undefined),
    image_count: media.image_count || (Array.isArray(media.items) ? media.items.length : 1),
    role: defaultRole,
  };
}
