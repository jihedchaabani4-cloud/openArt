/**
 * Prompt Bar Platform — attachMedia Command
 *
 * Pure command executing media attachment per PB-D-03.
 * Single source of truth: normalizes every attached item via normalizeEntity
 * and stores it ONLY in parameterValues[targetKey].
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { canAttach, countUsedRefs, getSlotMaxRefs } from "../../core/media.js";
import { normalizeEntity } from "../../core/entityService.js";

/**
 * Pure attachMedia command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { role, value }
 * @param {string} args.role - Slot role ("start", "end", "reference", etc.)
 * @param {object|string} args.value - Media item or asset to attach
 * @param {object} [deps] - { template, modelsMap }
 * @returns {import("../../core/commandResult.js").CommandResult}
 */
export function attachMedia(state, { role, value } = {}, deps = {}) {
  if (!role || !value) {
    return fail(REASONS.INVALID_ARGUMENT, { role, value });
  }

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;

  const effectiveMode = state.activeMode || "image";
  const effectiveSubMode = effectiveMode === "video" ? (state.activeSubMode || "frames") : (state.activeSubMode || "frames");

  // 1. Resolve slots for activeMode and effectiveSubMode
  let activeSlots = [];
  if (typeof template?.getSlots === "function") {
    activeSlots = template.getSlots(effectiveMode, effectiveSubMode, currentModel) || [];
  } else if (template?.COMPOSITION_REQUIREMENTS) {
    const req = template.COMPOSITION_REQUIREMENTS;
    const modeSlots = req[effectiveMode];
    activeSlots = Array.isArray(modeSlots) ? modeSlots : (modeSlots?.[effectiveSubMode] || []);
  }

  const slot = (activeSlots || []).find((s) => s.role === role);
  if (!slot) {
    return fail(REASONS.NO_SLOT_FOR_ROLE, { role, mode: effectiveMode, subMode: effectiveSubMode });
  }

  // 2. Resolve parameter key for this slot.
  // If the template defines resolveParameterMapping and returns falsy, the active model
  // does NOT support this slot role — reject instead of writing to a dead key.
  const resolveMapping = template?.resolveParameterMapping;
  const targetKey = resolveMapping ? resolveMapping(currentModel, role) : role;
  if (!targetKey) {
    return fail(REASONS.NO_SLOT_FOR_ROLE, {
      role,
      mode: effectiveMode,
      subMode: effectiveSubMode,
      modelId: state.selectedModelId,
    });
  }

  const paramDef = currentModel?.parameters?.[targetKey] || template?.parameters?.[targetKey];
  const isList = paramDef?.type === "image[]" || paramDef?.type === "video[]" || role === "reference";

  // 3. Existing values and validation
  // Single-value slots (e.g. "start", "end") replace their value directly and do not share multi-reference list quota
  const currentRaw = state.parameterValues?.[targetKey];
  const existing = isList
    ? (Array.isArray(currentRaw) ? currentRaw : (currentRaw ? [currentRaw] : []))
    : [];
  const used = isList
    ? countUsedRefs(state.parameterValues, activeSlots, [], {
        model: currentModel,
        template,
      })
    : 0;

  // 4. Normalize value via single canonical entity normalizer
  const normalized = normalizeEntity(value, null);
  if (!normalized) {
    return fail(REASONS.INVALID_ARGUMENT, { role, value });
  }

  const check = canAttach({
    model: currentModel,
    mode: effectiveMode,
    slot,
    value: normalized,
    used,
    existing,
    template,
  });

  if (!check.ok) {
    return check;
  }

  const nextParameterValues = { ...(state.parameterValues || {}) };

  if (isList) {
    const maxRefs = getSlotMaxRefs({ slot, model: currentModel, template });
    const nextList = [...existing, normalized];
    nextParameterValues[targetKey] = maxRefs === 1 ? nextList[0] : nextList;
  } else {
    nextParameterValues[targetKey] = normalized;
  }

  return ok({
    parameterValues: nextParameterValues,
  });
}
