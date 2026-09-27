/**
 * Prompt Bar Platform — Initialization
 *
 * Bootstrap logic: derives initial state from a composition type config and a models map.
 * No React, no DOM, no feature-specific imports.
 */

import { initializeValues, getActiveDefinitions } from "./parameterState.js";

/**
 * Derives the initial PromptBar instance state from a composition type and available models.
 *
 * @param {object}                 typeConfig - CompositionType (from createPromptBarType)
 * @param {Record<string, object>} modelsMap  - Keyed ModelContract map
 * @returns {{ selectedModelId: string|null, parameterValues: Record<string, any> }}
 */
export function initializeFromType(typeConfig, modelsMap = {}) {
  const { defaultModelId, supportedDomains } = typeConfig || {};

  // Filter models by supported domains
  const eligible = Object.values(modelsMap).filter(
    (m) => !supportedDomains?.length || supportedDomains.includes(m.domain)
  );

  // Resolve starting model
  let selectedModelId = null;
  if (defaultModelId && modelsMap[defaultModelId]) {
    selectedModelId = defaultModelId;
  } else if (eligible.length > 0) {
    selectedModelId = eligible[0].id;
  } else if (Object.keys(modelsMap).length > 0) {
    selectedModelId = Object.keys(modelsMap)[0];
  }

  const model = selectedModelId ? modelsMap[selectedModelId] : null;
  const definitions = getActiveDefinitions(model);
  const parameterValues = initializeValues(definitions);

  return { selectedModelId, parameterValues };
}
