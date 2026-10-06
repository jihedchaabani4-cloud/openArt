/**
 * Prompt Bar Platform — Tags Service
 *
 * Pure service for managing prompt tags and reference synchronization.
 * Zero DOM, zero React, fully testable in Node.
 *
 * Responsibilities:
 * 1. Bidirectional sync: cleanses prompt tags when a reference is deleted from a slot.
 * 2. Auto-assignment: finds available slot and assigns asset when tagged via @.
 * 3. Reference extraction: extracts active references from active slots and parameterValues.
 */

/**
 * Regex matching any media/entity tag in the prompt.
 * Matches: <MediaAsset:id>, <character:id>, <element:id>, <media:id>, <ref:id>, <reference:id>
 */
export const TAG_REGEX = /<(?:character|element|MediaAsset|media|ref|reference):\s*([^>]+)>/gi;

/**
 * Extracts canonical asset ID from any media asset object or string.
 *
 * @param {object|string} asset
 * @returns {string|null}
 */
export function getAssetId(asset) {
  if (!asset) return null;
  if (typeof asset === "string") return asset;
  return asset.workflow_id || asset.workflowId || asset.id || asset.asset_id || asset.ref_media_id || asset.url || null;
}

/**
 * Cleanses all tags associated with one or more asset IDs from the prompt.
 * Collapses resulting multiple spaces and cleans dangling punctuation.
 *
 * @param {string} prompt - Raw prompt text
 * @param {string|string[]} assetIds - One or more asset IDs to clean
 * @returns {string} Cleaned prompt
 */
export function cleanTagsForAsset(prompt = "", assetIds = []) {
  if (!prompt || typeof prompt !== "string") return "";
  const ids = Array.isArray(assetIds) ? assetIds.filter(Boolean) : [assetIds].filter(Boolean);
  if (ids.length === 0) return prompt;

  let cleaned = prompt;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`<(?:character|element|MediaAsset|media|ref|reference):\\s*${escaped}>`, "gi");
    cleaned = cleaned.replace(regex, "");
  }

  // Cleanup whitespace and dangling commas
  return cleaned
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/^[\s,;]+/g, "")
    .replace(/[\s,;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cleanses all media tags from the prompt.
 *
 * @param {string} prompt
 * @returns {string}
 */
export function cleanAllTags(prompt = "") {
  if (!prompt || typeof prompt !== "string") return "";
  return prompt
    .replace(TAG_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a specific asset ID is referenced in the prompt.
 *
 * @param {string} prompt
 * @param {string} assetId
 * @returns {boolean}
 */
export function isAssetReferencedInPrompt(prompt = "", assetId = "") {
  if (!prompt || !assetId) return false;
  const escaped = assetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<(?:character|element|MediaAsset|media|ref|reference):\\s*${escaped}>`, "i");
  return regex.test(prompt);
}

/**
 * Extracts active references from the currently active slots and parameterValues.
 *
 * @param {Array<object>} activeSlots - Active slot definitions [{ role, label, accepts }]
 * @param {Record<string, any>} paramValues - Current store parameter values
 * @param {object} [featureConfig] - Optional feature config for resolveParameterMapping
 * @param {object} [currentModel] - Currently selected model
 * @returns {Array<object>} List of active reference items
 */
export function getActiveReferences(activeSlots = [], paramValues = {}, featureConfig = null, currentModel = null) {
  if (!Array.isArray(activeSlots)) return [];

  const references = [];

  for (const slot of activeSlots) {
    const backendKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
      : slot.role;

    const val = paramValues[backendKey];
    if (!val) continue;

    const items = Array.isArray(val) ? val : [val];
    for (const item of items) {
      const assetId = getAssetId(item);
      if (!assetId) continue;

      const isElement = item.type === "element" || item.is_element || item.workflow_type === "ELEMENT_SHEET" || item.workflow_type === "ELEMENT";
      const isCharacter = item.type === "character" || item.is_character || item.workflow_type === "CHARACTER" || item.workflow_type === "CHARACTER_SHEET";
      const resolvedType = isCharacter ? "character" : isElement ? "element" : (item.type || (item.is_video ? "video" : "image"));

      references.push({
        role: slot.role,
        label: slot.label || slot.role,
        backendKey,
        assetId,
        workflow_id: assetId,
        id: assetId,
        asset_id: assetId,
        displayName: item.displayName || item.name || slot.label || "Reference",
        url: item.url || item.preview || item.file_url || "",
        type: resolvedType,
        workflow_type: item.workflow_type,
        is_upload: Boolean(item.is_upload || item.type === "upload" || item.workflow_type === "UPLOAD"),
        element_type: item.element_type || item.elementType || item.category,
        rawValue: item,
      });
    }
  }

  return references;
}

/**
 * Auto-assigns an asset to the first available empty slot if not already assigned.
 *
 * @param {object} options
 * @param {object} options.asset - Media asset to assign
 * @param {Array<object>} options.activeSlots - Current active slot definitions
 * @param {Record<string, any>} options.paramValues - Current store parameter values
 * @param {object} [options.featureConfig] - Feature config
 * @param {object} [options.currentModel] - Current selected model
 * @param {function} options.setParameter - Store setParameter action
 * @returns {{ assigned: boolean, alreadyAssigned?: boolean, full?: boolean, slotRole?: string, backendKey?: string, value?: object }}
 */
export function autoAssignReference({
  asset,
  activeSlots = [],
  paramValues = {},
  featureConfig = null,
  currentModel = null,
  setParameter,
}) {
  if (!asset || !setParameter) {
    return { assigned: false, reason: "Missing asset or setParameter function" };
  }

  const assetId = getAssetId(asset);
  if (!assetId) {
    return { assigned: false, reason: "Asset has no identifiable ID" };
  }

  // 1. Check if this asset is already assigned to any active slot
  const currentRefs = getActiveReferences(activeSlots, paramValues, featureConfig, currentModel);
  const existing = currentRefs.find((r) => r.assetId === assetId);
  if (existing) {
    return {
      assigned: false,
      alreadyAssigned: true,
      slotRole: existing.role,
      backendKey: existing.backendKey,
      value: existing.rawValue,
    };
  }

  // 2. Find the first available empty slot that can accept this asset
  const isVideo = Boolean(
    asset.is_video ||
      asset.type === "video" ||
      asset.url?.toLowerCase().endsWith(".mp4") ||
      asset.url?.toLowerCase().endsWith(".webm")
  );

  for (const slot of activeSlots) {
    const backendKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
      : slot.role;

    const currentVal = paramValues[backendKey];

    // Check MIME type acceptability if accepts specified
    if (slot.accepts && !slot.accepts.includes("*")) {
      if (isVideo && !slot.accepts.includes("video")) continue;
      if (!isVideo && !slot.accepts.includes("image")) continue;
    }

    const isElement = asset.type === "element" || asset.is_element || asset.workflow_type === "ELEMENT_SHEET" || asset.workflow_type === "ELEMENT";
    const isCharacter = asset.type === "character" || asset.is_character || asset.workflow_type === "CHARACTER" || asset.workflow_type === "CHARACTER_SHEET";
    const resolvedType = isCharacter ? "character" : isElement ? "element" : (isVideo ? "video" : "image");

    const count =
      typeof asset.image_count === "number" && asset.image_count > 0
        ? asset.image_count
        : Array.isArray(asset.items) && asset.items.length > 0
        ? asset.items.length
        : 1;

    const normalizedValue = {
      workflow_id: assetId,
      id: assetId,
      url: asset.url || asset.preview || asset.file_url || "",
      preview: asset.url || asset.preview || asset.file_url || "",
      displayName: asset.displayName || asset.name || slot.label || "Reference",
      type: resolvedType,
      workflow_type: asset.workflow_type,
      image_count: count,
    };

    if (currentVal !== undefined && currentVal !== null && currentVal !== "") {
      if (Array.isArray(currentVal)) {
        const max = currentModel?.parameters?.[backendKey]?.max || currentModel?.parameters?.[backendKey]?.max_count || 4;
        const used = currentVal.reduce((acc, c) => {
          const cCount = typeof c?.image_count === "number" ? c.image_count : (Array.isArray(c?.items) ? c.items.length : 1);
          return acc + cCount;
        }, 0);
        if (used + count <= max) {
          setParameter(backendKey, [...currentVal, normalizedValue]);
          return {
            assigned: true,
            slotRole: slot.role,
            backendKey,
            value: normalizedValue,
          };
        }
      }
      continue; // Slot already occupied or full
    }

    setParameter(backendKey, normalizedValue);

    return {
      assigned: true,
      slotRole: slot.role,
      backendKey,
      value: normalizedValue,
    };
  }

  return {
    assigned: false,
    full: true,
    reason: "No available empty reference slot to assign asset",
  };
}
