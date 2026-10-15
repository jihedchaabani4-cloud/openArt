/**
 * Prompt Bar Platform — Pure Media Computation Helpers
 *
 * Slots derivation, limits, and capability inspection.
 * Zero React, zero Next.js, zero DOM, zero store imports.
 */

import { getModelReferenceCapability } from "./modelManagement.js";

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
