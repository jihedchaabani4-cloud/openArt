/**
 * Prompt Bar Platform — swapFrames Command
 *
 * Pure atomic command swapping start and end keyframe media slots in a single patch.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { PARAM } from "../../core/parameterKeys.js";

/**
 * Pure swapFrames command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} [deps] - { template, modelsMap }
 * @returns {import("../../core/commandResult.js").CommandResult}
 */
export function swapFrames(state, deps = {}) {
  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;

  const resolveMapping = template?.resolveParameterMapping;
  const startKey = resolveMapping
    ? resolveMapping(currentModel, "start")
    : PARAM.INPUT_IMAGE;
  const endKey = resolveMapping
    ? resolveMapping(currentModel, "end")
    : PARAM.LAST_FRAME;

  if (!startKey || !endKey) {
    return fail(REASONS.NO_SLOT_FOR_ROLE, { roles: ["start", "end"] });
  }

  const currentValues = state.parameterValues || {};
  const startVal = currentValues[startKey];
  const endVal = currentValues[endKey];

  const nextParameterValues = { ...currentValues };
  if (endVal !== undefined) {
    nextParameterValues[startKey] = endVal;
  } else {
    delete nextParameterValues[startKey];
  }

  if (startVal !== undefined) {
    nextParameterValues[endKey] = startVal;
  } else {
    delete nextParameterValues[endKey];
  }

  return ok({ parameterValues: nextParameterValues });
}
