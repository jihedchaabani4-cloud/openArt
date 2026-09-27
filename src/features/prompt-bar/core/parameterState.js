/**
 * Prompt Bar Platform — Parameter State
 *
 * Pure functions for managing parameter state.
 * No React, no DOM, no side effects.
 */

/**
 * Initializes a parameter values map from a set of definitions.
 * Each parameter is initialized to its declared default.
 *
 * @param {Record<string, object>} definitions - Keyed ParameterDefinition map
 * @returns {Record<string, any>} Initial parameter values
 */
export function initializeValues(definitions = {}) {
  const values = {};
  for (const [key, def] of Object.entries(definitions)) {
    if (def.default !== undefined) {
      values[key] = def.default;
    }
  }
  return values;
}

/**
 * Returns a new state object with the given key set to the given value.
 * Does not mutate the input.
 *
 * @param {Record<string, any>} state - Current parameter values
 * @param {string} key - Parameter key
 * @param {any} value - New value
 * @returns {Record<string, any>} New parameter state
 */
export function setValue(state = {}, key, value) {
  return { ...state, [key]: value };
}

/**
 * Returns only the parameter definitions for the active model.
 * Convenience wrapper — definitions are already keyed by parameter name.
 *
 * @param {object} model - ModelContract (with .parameters property)
 * @returns {Record<string, object>} Parameter definitions map
 */
export function getActiveDefinitions(model) {
  return model?.parameters || {};
}
