/**
 * Prompt Bar Platform — Initialization
 *
 * Bootstrap logic: derives initial state from a composition type config and a models map.
 * No React, no DOM, no feature-specific imports.
 */

import { initializeValues, getActiveDefinitions } from "./parameterState.js";
import { resolveEligibleModels } from "./modelManagement.js";

/**
 * Derives the initial PromptBar instance state from a template/config and available models.
 * Uses the same resolveEligibleModels rule as setModels, hydrate, and switchMode.
 *
 * @param {object}                 typeConfig - Template or layout config
 * @param {Record<string, object>} modelsMap  - Keyed ModelContract map
 * @returns {{ selectedModelId: string|null, parameterValues: Record<string, any> }}
 */
export function initializeFromType(typeConfig, modelsMap = {}) {
  if (typeConfig?.features?.models === false) {
    const parameterValues = initializeValues(typeConfig?.parameters || {});
    return { selectedModelId: null, parameterValues };
  }

  const { defaultModelId } = typeConfig || {};
  const activeMode = typeConfig?.defaultState?.activeMode || "image";
  const activeSubMode = typeConfig?.defaultState?.activeSubMode || "frames";

  const eligible = resolveEligibleModels(Object.values(modelsMap), {
    template: typeConfig,
    activeMode,
    activeSubMode,
  });

  // Resolve starting model
  let selectedModelId = null;
  if (defaultModelId && eligible.some((m) => m.id === defaultModelId)) {
    selectedModelId = defaultModelId;
  } else if (eligible.length > 0) {
    selectedModelId = eligible[0].id;
  }

  const model = selectedModelId ? modelsMap[selectedModelId] : null;
  const definitions = getActiveDefinitions(model);
  const parameterValues = initializeValues(definitions);

  return { selectedModelId, parameterValues };
}
