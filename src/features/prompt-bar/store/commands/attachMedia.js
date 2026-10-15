/**
 * Prompt Bar Platform — attachMedia Command
 *
 * Pure command executing media attachment per PB-D-03.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { canAttach, countUsedRefs, getSlotMaxRefs } from "../../core/media.js";
import { getAssetId } from "../../core/tagsService.js";
import { addEntity } from "../../core/entityService.js";

/**
 * Pure attachMedia command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { role, value }
 * @param {string} args.role - Slot role ("start", "end", "reference", etc.)
 * @param {object} args.value - Media item or asset to attach
 * @param {object} [deps] - { template }
 * @returns {CommandResult}
 */
export function attachMedia(state, { role, value } = {}, deps = {}) {
  if (!role || !value) {
    return fail(REASONS.INVALID_ARGUMENT, { role, value });
  }

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;

  // 1. Resolve slots for activeMode and activeSubMode
  let activeSlots = [];
  if (typeof template?.getSlots === "function") {
    activeSlots = template.getSlots(state.activeMode, state.activeSubMode);
  } else if (template?.COMPOSITION_REQUIREMENTS) {
    const req = template.COMPOSITION_REQUIREMENTS;
    const modeSlots = req[state.activeMode];
    activeSlots = Array.isArray(modeSlots) ? modeSlots : (modeSlots?.[state.activeSubMode] || []);
  }

  const slot = (activeSlots || []).find((s) => s.role === role);
  if (!slot) {
    return fail(REASONS.NO_SLOT_FOR_ROLE, { role, mode: state.activeMode, subMode: state.activeSubMode });
  }

  // 2. Resolve parameter key for this slot
  const resolveMapping = template?.resolveParameterMapping;
  const targetKey = resolveMapping ? resolveMapping(currentModel, role) || role : role;

  const paramDef = currentModel?.parameters?.[targetKey] || template?.parameters?.[targetKey];
  const isList = paramDef?.type === "image[]" || paramDef?.type === "video[]" || role === "reference";

  // 3. Existing values and validation
  const currentRaw = state.parameterValues?.[targetKey];
  const existing = Array.isArray(currentRaw) ? currentRaw : (currentRaw ? [currentRaw] : []);
  const used = countUsedRefs(state.parameterValues, activeSlots, [
    ...(state.elements || []),
    ...(state.characters || []),
  ]);

  const check = canAttach({
    model: currentModel,
    slot,
    value,
    used,
    existing,
    template,
  });

  if (!check.ok) {
    return check;
  }

  // 4. Normalize value
  const id = getAssetId(value) || value.id || value.workflow_id;
  const normalized = {
    ...value,
    workflow_id: id,
    id,
  };

  const nextParameterValues = { ...state.parameterValues };
  let nextElements = [...(state.elements || [])];
  let nextCharacters = [...(state.characters || [])];

  if (isList) {
    const maxRefs = getSlotMaxRefs({ slot, model: currentModel, template });
    const nextList = [...existing, normalized];
    nextParameterValues[targetKey] = maxRefs === 1 ? nextList[0] : nextList;
  } else {
    nextParameterValues[targetKey] = normalized;
  }

  // 5. Update elements and characters if applicable
  const isElement = normalized.type === "element" || normalized.is_element;
  const isCharacter = normalized.type === "character" || normalized.is_character;

  if (isElement) {
    nextElements = addEntity(nextElements, normalized, "element");
  } else if (isCharacter) {
    nextCharacters = addEntity(nextCharacters, normalized, "character");
  }

  return ok({
    parameterValues: nextParameterValues,
    elements: nextElements,
    characters: nextCharacters,
  });
}
