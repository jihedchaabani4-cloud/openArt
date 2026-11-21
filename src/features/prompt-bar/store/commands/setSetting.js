/**
 * Prompt Bar Platform — setSetting Command
 *
 * Pure command updating a single non-media setting parameter.
 * Validates against active model/template schema and REJECTS media keys
 * so media can only flow through attachMedia / removeMedia / clearSlot / swapFrames.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { validateParameter } from "../../core/reconciliation.js";
import { isMediaParamKey } from "../../core/parameterKeys.js";

/**
 * Pure setSetting command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { key, value }
 * @param {object} [deps] - { template, modelsMap }
 * @returns {import("../../core/commandResult.js").CommandResult}
 */
export function setSetting(state, { key, value } = {}, deps = {}) {
  if (!key || typeof key !== "string") {
    return fail(REASONS.INVALID_ARGUMENT, { key, message: "Setting key must be a non-empty string." });
  }

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const currentModel = modelsMap[state.selectedModelId] || null;
  const definitions = currentModel?.parameters || template?.parameters || {};
  const paramDef = definitions[key];

  // Media parameters MUST go through media commands, never setSetting
  if (isMediaParamKey(key, paramDef)) {
    return fail(REASONS.INVALID_ARGUMENT, {
      key,
      message: `Media key "${key}" cannot be modified via setSetting. Use attachMedia/removeMedia/clearSlot/swapFrames.`,
    });
  }

  // Validate against active model/template schema when definitions exist
  if (Object.keys(definitions).length > 0) {
    if (!paramDef) {
      return fail(REASONS.INVALID_ARGUMENT, {
        key,
        message: `Unknown setting "${key}" for active model.`,
      });
    }
    const validation = validateParameter(paramDef, value);
    if (!validation.valid) {
      return fail(REASONS.INVALID_ARGUMENT, {
        key,
        value,
        error: validation.error,
      });
    }
  }

  return ok({
    parameterValues: {
      ...(state.parameterValues || {}),
      [key]: value,
    },
  });
}
