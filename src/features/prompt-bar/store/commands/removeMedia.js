/**
 * Prompt Bar Platform — removeMedia Command
 *
 * Pure command executing media removal and prompt tag cleaning per PB-D-03.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { cleanTagsForAsset, getAssetId } from "../../core/tagsService.js";

/**
 * Pure removeMedia command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { role, value }
 * @param {string} args.role - Slot role ("start", "end", "reference", etc.)
 * @param {object|string} [args.value] - Item to remove if role is a list parameter
 * @param {object} [deps] - { template }
 * @returns {CommandResult}
 */
export function removeMedia(state, { role, value } = {}, deps = {}) {
  if (!role) {
    return fail(REASONS.INVALID_ARGUMENT, { message: "role is required" });
  }

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;

  const resolveMapping = template?.resolveParameterMapping;
  const targetKey = resolveMapping ? resolveMapping(currentModel, role) || role : role;

  let activeSlots = [];
  if (typeof template?.getSlots === "function") {
    activeSlots = template.getSlots(state.activeMode, state.activeSubMode);
  } else if (template?.COMPOSITION_REQUIREMENTS) {
    const req = template.COMPOSITION_REQUIREMENTS;
    const modeSlots = req[state.activeMode];
    activeSlots = Array.isArray(modeSlots) ? modeSlots : (modeSlots?.[state.activeSubMode] || []);
  }

  const currentVal = state.parameterValues?.[targetKey];
  const nextParameterValues = { ...state.parameterValues };
  let nextPrompt = state.prompt || "";
  let nextElements = [...(state.elements || [])];
  let nextCharacters = [...(state.characters || [])];
  const idsToClean = [];

  if (value !== undefined && value !== null) {
    // Removing specific item from list
    const idToRemove = getAssetId(value) || value.id || value.workflow_id || value;
    if (Array.isArray(currentVal)) {
      const nextArr = currentVal.filter((r) => (getAssetId(r) || r.id || r.workflow_id) !== idToRemove);
      nextParameterValues[targetKey] = nextArr.length > 0 ? nextArr : undefined;
    } else if (currentVal && (getAssetId(currentVal) || currentVal.id || currentVal.workflow_id) === idToRemove) {
      delete nextParameterValues[targetKey];
    }

    idsToClean.push(idToRemove);
  } else {
    // Clearing entire slot
    if (Array.isArray(currentVal)) {
      currentVal.forEach((item) => {
        const id = getAssetId(item);
        if (id) idsToClean.push(id);
      });
    } else if (currentVal) {
      const id = getAssetId(currentVal);
      if (id) idsToClean.push(id);
    }
    delete nextParameterValues[targetKey];
  }

  // Filter elements & characters
  if (idsToClean.length > 0) {
    const idSet = new Set(idsToClean);
    nextElements = nextElements.filter((e) => !idSet.has(getAssetId(e)) && !idSet.has(e.id) && !idSet.has(e.workflow_id));
    nextCharacters = nextCharacters.filter((c) => !idSet.has(getAssetId(c)) && !idSet.has(c.id) && !idSet.has(c.workflow_id));

    // Check if any id is still used in other slots
    const idsFinallyRemoved = idsToClean.filter((id) => {
      return !activeSlots.some((s) => {
        const k = resolveMapping ? resolveMapping(currentModel, s.role) || s.role : s.role;
        const v = nextParameterValues[k];
        if (!v) return false;
        if (Array.isArray(v)) {
          return v.some((item) => (getAssetId(item) || item.id || item.workflow_id) === id);
        }
        return (getAssetId(v) || v.id || v.workflow_id) === id;
      });
    });

    if (idsFinallyRemoved.length > 0) {
      nextPrompt = cleanTagsForAsset(nextPrompt, idsFinallyRemoved);
    }
  }

  return ok({
    parameterValues: nextParameterValues,
    prompt: nextPrompt,
    elements: nextElements,
    characters: nextCharacters,
  });
}
