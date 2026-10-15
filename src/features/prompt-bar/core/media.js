/**
 * Prompt Bar Platform — Pure Media Computation Helpers
 *
 * Slots derivation, limits, quota tracking, allowed types, and attachment eligibility.
 * Zero React, zero Next.js, zero DOM, zero store imports.
 */

import { getModelReferenceCapability } from "./modelManagement.js";
import { getAssetId, sameAsset } from "./mediaRef.js";
import { getEntityImageCount } from "./entityService.js";
import { ok, fail, REASONS } from "./commandResult.js";
import { PARAM } from "./parameterKeys.js";

export { getModelReferenceCapability };

/** Derives active composition slots based on template/config, active mode, and model capability. */
export function getActiveSlots({
  template,
  featureConfig,
  mode,
  subMode,
  model,
  referenceSlots = [],
  hasModes = true,
} = {}) {
  const config = template || featureConfig;
  if (!config || !hasModes) return referenceSlots;

  let slots = [];
  if (typeof config.getSlots === "function") {
    slots = config.getSlots(mode, subMode, model);
  } else if (config.COMPOSITION_REQUIREMENTS) {
    const req = config.COMPOSITION_REQUIREMENTS;
    const modeSlots = req?.[mode];
    if (!modeSlots) return [];
    slots = Array.isArray(modeSlots) ? modeSlots : (modeSlots[subMode] ?? []);
  } else {
    return referenceSlots;
  }

  if (model) {
    const resolveMapping = config.resolveParameterMapping;
    return slots.filter((slot) => {
      if (slot.role === "reference") {
        const cap = getModelReferenceCapability(model);
        return cap.supports;
      }
      if (resolveMapping) {
        const key = resolveMapping(model, slot.role);
        return Boolean(key);
      }
      return true;
    });
  }

  return slots;
}

/** Computes the maximum allowed references for a specific composition slot and model. */
export function getSlotMaxRefs({
  slot,
  model,
  parameterDef,
  template,
  featureConfig,
} = {}) {
  if (!slot || !model) return 0;

  const config = template || featureConfig;
  const resolveMapping = config?.resolveParameterMapping;
  const backendKey = resolveMapping
    ? resolveMapping(model, slot.role) || slot.role
    : slot.role;

  const paramDef = parameterDef || model.parameters?.[backendKey];
  if (paramDef) {
    if (typeof paramDef.max === "number" && paramDef.max > 0) return paramDef.max;
    if (typeof paramDef.max_count === "number" && paramDef.max_count > 0) return paramDef.max_count;
    if (typeof paramDef.maxCount === "number" && paramDef.maxCount > 0) return paramDef.maxCount;
    if (paramDef.type === "image[]" || paramDef.type === "array") return 4;
  }

  if (slot.role === "reference") {
    const cap = getModelReferenceCapability(model);
    return cap.maxRefs || 4;
  }

  if (paramDef && paramDef.type === "image") return 1;

  return 1;
}

/** Calculates total used image reference count across parameter values and entity references. */
export function countUsedRefs(parameterValues = {}, slots = [], entities = []) {
  const entityList = Array.isArray(entities)
    ? entities
    : [...(entities?.elements || []), ...(entities?.characters || [])];

  const seenIds = new Set();
  const allItems = [];

  const inspectedKeys = new Set();
  if (Array.isArray(slots) && slots.length > 0) {
    for (const slot of slots) {
      if (slot.backendKey) inspectedKeys.add(slot.backendKey);
    }
  }
  if (inspectedKeys.size === 0) {
    inspectedKeys.add(PARAM.IMAGES);
    inspectedKeys.add(PARAM.REFERENCE_IMAGES);
  }

  for (const key of inspectedKeys) {
    const rawVal = parameterValues[key];
    if (Array.isArray(rawVal)) {
      allItems.push(...rawVal);
    } else if (rawVal && typeof rawVal === "object") {
      allItems.push(rawVal);
    }
  }

  for (const entity of entityList) {
    if (entity) allItems.push(entity);
  }

  let count = 0;
  for (const item of allItems) {
    if (!item) continue;
    const id = getAssetId(item) || item.url;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    count += getEntityImageCount(item);
  }

  return count;
}

/** Calculates remaining reference quota for a model and active slot. */
export function remainingQuota({
  model,
  used = 0,
  slot,
  template,
  featureConfig,
} = {}) {
  const targetSlot = slot || { role: "reference" };
  const maxRefs = getSlotMaxRefs({
    slot: targetSlot,
    model,
    template,
    featureConfig,
  });
  return Math.max(0, maxRefs - used);
}

/** Resolves the allowed media or entity types for a specific composition slot. */
export function allowedTypeForSlot({ mode, slot, fallback = "all" } = {}) {
  if (!slot) return "all";
  if (slot.role === "start" || slot.role === "end") return "image";
  if (slot.role === "reference") {
    if (mode === "video") return "image";
    return ["image", "character", "element"];
  }
  const accepts = slot.accepts;
  if (typeof accepts === "string") {
    if (accepts.includes("video") && !accepts.includes("image")) return "video";
    if (accepts.includes("image") && !accepts.includes("video")) return "image";
  }
  if (slot.role === "character") return "character";
  if (slot.role === "element") return "element";
  return fallback;
}

/** Checks whether a candidate media item can be attached to the given slot. */
export function canAttach({
  model,
  slot,
  value,
  used = 0,
  existing = [],
  template,
  featureConfig,
} = {}) {
  if (!value) {
    return fail(REASONS.INVALID_ARGUMENT, { message: "No media provided" });
  }

  // 1. Type validation
  const allowed = allowedTypeForSlot({ mode: model?.domain, slot });
  const isVideoValue =
    value.type === "video" ||
    (typeof value.url === "string" && value.url.includes(".mp4")) ||
    (typeof value === "string" && value.includes(".mp4"));

  if (allowed === "image" && isVideoValue) {
    return fail(REASONS.TYPE_NOT_ALLOWED, { allowed, received: "video" });
  }
  if (Array.isArray(allowed) && !allowed.includes("video") && isVideoValue) {
    return fail(REASONS.TYPE_NOT_ALLOWED, { allowed, received: "video" });
  }

  // 2. Duplicate detection (multi-reference slot)
  if (Array.isArray(existing) && existing.length > 0) {
    const isDup = existing.some((item) => sameAsset(item, value));
    if (isDup) {
      return fail(REASONS.DUPLICATE_MEDIA, { assetId: getAssetId(value) });
    }
  }

  // 3. Quota check
  const candidateCount = getEntityImageCount(value);
  const maxQuota = getSlotMaxRefs({
    slot: slot || { role: "reference" },
    model,
    template,
    featureConfig,
  });

  if (used + candidateCount > maxQuota) {
    return fail(REASONS.MAX_MEDIA_REACHED, {
      max: maxQuota,
      used,
      requested: candidateCount,
    });
  }

  return ok({ value });
}
