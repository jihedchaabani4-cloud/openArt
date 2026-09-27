/**
 * Prompt Bar Platform — Entity Service
 *
 * Pure business logic for managing feature-level entities (Elements & Characters).
 * Zero React, zero DOM, fully testable.
 */

import { cleanTagsForAsset } from "./tagsService.js";

/**
 * Normalizes an entity asset into a consistent canonical shape.
 *
 * @param {object|string} asset
 * @param {"element"|"character"} [defaultType="element"]
 * @returns {object|null}
 */
export function normalizeEntity(asset, defaultType = "element") {
  if (!asset) return null;
  if (typeof asset === "string") {
    return {
      id: asset,
      workflow_id: asset,
      displayName: defaultType === "character" ? "Character" : "Element",
      url: "",
      preview: "",
      type: defaultType,
      workflow_type: defaultType === "character" ? "CHARACTER_SHEET" : "ELEMENT_SHEET",
    };
  }

  const id = asset.workflow_id || asset.workflowId || asset.id || asset.asset_id;
  if (!id) return null;

  const isChar =
    asset.type === "character" ||
    asset.is_character ||
    String(asset.workflow_type || "").toUpperCase().includes("CHARACTER");
  const isElem =
    asset.type === "element" ||
    asset.is_element ||
    String(asset.workflow_type || "").toUpperCase().includes("ELEMENT");

  const resolvedType = isChar ? "character" : isElem ? "element" : defaultType;

  return {
    id,
    workflow_id: id,
    displayName:
      asset.displayName ||
      asset.display_name ||
      asset.name ||
      (resolvedType === "character" ? "Character" : "Element"),
    url: asset.url || asset.preview || asset.file_url || "",
    preview: asset.preview || asset.url || asset.file_url || "",
    type: resolvedType,
    workflow_type:
      asset.workflow_type ||
      (resolvedType === "character" ? "CHARACTER_SHEET" : "ELEMENT_SHEET"),
    image_count:
      typeof asset.image_count === "number" && asset.image_count > 0
        ? asset.image_count
        : typeof asset.images_count === "number" && asset.images_count > 0
        ? asset.images_count
        : Array.isArray(asset.items) && asset.items.length > 0
        ? asset.items.length
        : Array.isArray(asset.images) && asset.images.length > 0
        ? asset.images.length
        : 1,
  };
}

/**
 * Adds an entity to an existing list, preventing duplicates by id or workflow_id.
 *
 * @param {Array<object>} list - Current entities list
 * @param {object|string} entity - Entity to add
 * @param {"element"|"character"} [defaultType="element"]
 * @returns {Array<object>} New array with entity added if unique
 */
export function addEntity(list = [], entity, defaultType = "element") {
  const normalized = normalizeEntity(entity, defaultType);
  if (!normalized) return list;

  const exists = (list || []).some(
    (item) => item.id === normalized.id || item.workflow_id === normalized.workflow_id
  );
  if (exists) return list;

  return [...(list || []), normalized];
}

/**
 * Removes an entity by ID from a list.
 *
 * @param {Array<object>} list - Current entities list
 * @param {string} entityId - ID of entity to remove
 * @returns {Array<object>} Filtered array without the specified entity
 */
export function removeEntity(list = [], entityId) {
  if (!entityId) return list || [];
  return (list || []).filter(
    (item) => item.id !== entityId && item.workflow_id !== entityId
  );
}

/**
 * Extracts pure string IDs from an entity list for API payload submission.
 *
 * @param {Array<object|string>} list
 * @returns {string[]} Array of string IDs
 */
export function extractEntityIds(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      typeof item === "object" && item !== null
        ? item.workflow_id || item.id
        : item
    )
    .filter(Boolean);
}

/**
 * Removes entity and cleans prompt tags for that entity.
 *
 * @param {Array<object>} list
 * @param {string} entityId
 * @param {string} prompt
 * @returns {{ nextList: Array<object>, nextPrompt: string }}
 */
export function removeEntityWithPromptClean(list = [], entityId, prompt = "") {
  const nextList = removeEntity(list, entityId);
  const nextPrompt = cleanTagsForAsset(prompt, entityId);
  return { nextList, nextPrompt };
}

/**
 * Calculates the number of actual images represented by a reference/entity asset.
 *
 * Rules:
 * - Normal image / upload = 1 image
 * - Character / Element = count of its constituent images (e.g. 2 or 3)
 * - Minimum = 1
 *
 * @param {object|string} item
 * @returns {number}
 */
export function getEntityImageCount(item) {
  if (!item) return 0;
  if (typeof item === "string") return 1;
  if (typeof item.image_count === "number" && item.image_count > 0) return item.image_count;
  if (typeof item.images_count === "number" && item.images_count > 0) return item.images_count;
  if (typeof item.imageCount === "number" && item.imageCount > 0) return item.imageCount;
  if (Array.isArray(item.items) && item.items.length > 0) return item.items.length;
  if (Array.isArray(item.images) && item.images.length > 0) return item.images.length;
  if (Array.isArray(item.views) && item.views.length > 0) return item.views.length;
  if (Array.isArray(item.media) && item.media.length > 0) return item.media.length;
  if (Array.isArray(item.reference_images) && item.reference_images.length > 0) return item.reference_images.length;
  return 1;
}

/**
 * Calculates total actual consumed images across all active references.
 *
 * Guarantees:
 * - Sums the actual images represented by active references.
 * - Deduplicates by ID (same reference reused is counted ONCE).
 * - Tags NEVER increase image count.
 *
 * @param {Array<object>} references
 * @returns {number}
 */
export function calculateUsedImages(references = []) {
  if (!Array.isArray(references)) return 0;
  const seenIds = new Set();
  let total = 0;

  for (const ref of references) {
    if (!ref) continue;
    const id = ref.workflow_id || ref.id || ref.url;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    total += getEntityImageCount(ref);
  }

  return total;
}

/**
 * Checks if a candidate reference can be added without exceeding maxImages.
 *
 * @param {Array<object>} currentReferences - Current active references
 * @param {object|string} candidate - Reference to potentially add
 * @param {number} maxImages - Model maximum allowed images
 * @returns {{ canAdd: boolean, usedImages: number, remainingImages: number, candidateCount: number, reason?: string }}
 */
export function canAddReference(currentReferences = [], candidate, maxImages = 4) {
  const currentUsed = calculateUsedImages(currentReferences);
  const remaining = Math.max(0, maxImages - currentUsed);

  if (!candidate) {
    return { canAdd: remaining > 0, usedImages: currentUsed, remainingImages: remaining, candidateCount: 0 };
  }

  const candidateId = typeof candidate === "object" ? candidate.workflow_id || candidate.id : candidate;
  // If already present, adding again doesn't consume extra images
  const alreadyPresent = currentReferences.some((r) => (r.workflow_id || r.id) === candidateId);
  if (alreadyPresent) {
    return { canAdd: true, usedImages: currentUsed, remainingImages: remaining, candidateCount: 0 };
  }

  const candidateCount = getEntityImageCount(candidate);
  const fits = currentUsed + candidateCount <= maxImages;

  return {
    canAdd: fits,
    usedImages: currentUsed,
    remainingImages: remaining,
    candidateCount,
    reason: fits ? undefined : `Requires ${candidateCount} image slot${candidateCount > 1 ? "s" : ""}, but only ${remaining} left.`,
  };
}
