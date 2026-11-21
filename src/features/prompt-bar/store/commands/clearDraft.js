/**
 * Prompt Bar Platform — clearDraft Command
 *
 * Pure atomic command clearing the prompt text and all attached media slots
 * while preserving non-media model settings (aspect_ratio, resolution, duration, etc.).
 * Zero React, zero DOM, zero store mutation.
 */

import { ok } from "../../core/commandResult.js";
import { isMediaParamKey } from "../../core/parameterKeys.js";

/**
 * Pure clearDraft command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} [deps] - { template, modelsMap }
 * @returns {import("../../core/commandResult.js").CommandResult}
 */
export function clearDraft(state, deps = {}) {
  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;
  const definitions = currentModel?.parameters || template?.parameters || {};

  const mediaKeys = new Set();

  for (const [key, def] of Object.entries(definitions)) {
    if (isMediaParamKey(key, def)) {
      mediaKeys.add(key);
    }
  }

  const effectiveSubMode = state.activeMode === "video" ? (state.activeSubMode || "frames") : state.activeSubMode;
  let activeSlots = [];
  if (typeof template?.getSlots === "function") {
    activeSlots = template.getSlots(state.activeMode, effectiveSubMode, currentModel) || [];
  } else if (template?.COMPOSITION_REQUIREMENTS) {
    const modeSlots = template.COMPOSITION_REQUIREMENTS[state.activeMode];
    activeSlots = Array.isArray(modeSlots) ? modeSlots : (modeSlots?.[effectiveSubMode] || []);
  }

  for (const slot of activeSlots) {
    const mapped = template?.resolveParameterMapping
      ? template.resolveParameterMapping(currentModel, slot.role)
      : slot.role;
    if (mapped) mediaKeys.add(mapped);
  }

  const nextParameterValues = { ...(state.parameterValues || {}) };
  for (const key of Object.keys(nextParameterValues)) {
    if (mediaKeys.has(key) || isMediaParamKey(key, definitions[key])) {
      delete nextParameterValues[key];
    }
  }

  return ok({
    prompt: "",
    parameterValues: nextParameterValues,
  });
}
