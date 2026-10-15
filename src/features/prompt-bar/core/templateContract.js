/**
 * Prompt Bar Platform — Template Contract
 *
 * @typedef {object} TemplateDefinition
 * @property {string} id - Unique template identifier (required)
 * @property {string[]} [persistRoutes=[]] - Array of route patterns where template state is preserved
 * @property {object} [layout={}] - UI layout visibility flags (showPromptInput, showModelSelector, etc.)
 * @property {{ models?: boolean, modes?: boolean }} [features={ models: true, modes: true }] - Feature capability toggles
 * @property {object} [defaultState={}] - Partial default state for the template instance
 * @property {(mode: string, subMode?: string, model?: object) => Array<{ role: string, label: string, accepts?: string }>} getSlots - Slot resolver function
 * @property {(models: object[], mode: string, subMode: string, parameterValues?: object) => object[]} filterEligibleModels - Model eligibility filter function
 * @property {(model: object, role: string) => string|null} resolveParameterMapping - Slot role to backend parameter key mapper
 * @property {(core: object) => object} [createActions] - Optional service actions factory
 */

/** Validates, applies canonical defaults, and freezes a template definition object. */
export function defineTemplate(def) {
  if (!def || typeof def !== "object") {
    throw new Error("Invalid template definition: Definition must be a non-null object.");
  }

  const problems = [];

  if (typeof def.id !== "string" || !def.id.trim()) {
    problems.push("'id' must be a non-empty string.");
  }

  if (def.persistRoutes !== undefined && !Array.isArray(def.persistRoutes)) {
    problems.push("'persistRoutes' must be an array of route patterns.");
  }

  if (def.layout !== undefined && (typeof def.layout !== "object" || def.layout === null)) {
    problems.push("'layout' must be an object.");
  }

  if (def.features !== undefined && (typeof def.features !== "object" || def.features === null)) {
    problems.push("'features' must be an object.");
  }

  if (def.defaultState !== undefined && (typeof def.defaultState !== "object" || def.defaultState === null)) {
    problems.push("'defaultState' must be an object.");
  }

  if (typeof def.getSlots !== "function") {
    problems.push("'getSlots' must be a function: (mode, subMode, model) => SlotDef[].");
  }

  if (typeof def.filterEligibleModels !== "function") {
    problems.push("'filterEligibleModels' must be a function: (models, mode, subMode, parameterValues) => Model[].");
  }

  if (typeof def.resolveParameterMapping !== "function") {
    problems.push("'resolveParameterMapping' must be a function: (model, role) => string|null.");
  }

  if (def.createActions !== undefined && typeof def.createActions !== "function") {
    problems.push("'createActions' must be a function if provided: (core) => actions.");
  }

  if (problems.length > 0) {
    throw new Error(`Invalid template definition:\n- ${problems.join("\n- ")}`);
  }

  const template = {
    id: def.id.trim(),
    persistRoutes: Object.freeze([...(def.persistRoutes || [])]),
    layout: Object.freeze({ ...(def.layout || {}) }),
    features: Object.freeze({
      models: def.features?.models ?? true,
      modes: def.features?.modes ?? true,
      ...(def.features || {}),
    }),
    defaultState: Object.freeze({ ...(def.defaultState || {}) }),
    getSlots: def.getSlots,
    filterEligibleModels: def.filterEligibleModels,
    resolveParameterMapping: def.resolveParameterMapping,
    createActions: def.createActions || null,
  };

  return Object.freeze(template);
}
