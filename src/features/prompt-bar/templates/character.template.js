/**
 * Character Generation Template Definition
 *
 * Source of truth for Character Prompt Bar feature rules:
 *   - No models (features.models = false, layout.showModelSelector = false)
 *   - No modes (features.modes = false, layout.showModeSelector = false)
 *   - No parameter drawer (layout.showParameterDrawer = false)
 *   - Reference attachment slot (layout.showAttachmentBar = true, role = "reference")
 *   - Prompt input (layout.showPromptInput = true)
 *   - State persisted across character studio routes
 */

import { defineTemplate } from "../core/templateContract.js";

export const CHARACTER_PARAMETERS = {
  references: { name: "references", type: "image[]", group: "media" },
};

/**
 * Returns slots for Character generation (1 Reference slot).
 * @returns {Array<{ role: string, label: string, accepts: string }>}
 */
export function getSlots() {
  return [
    { role: "reference", label: "Reference", accepts: "image/*" },
  ];
}

/**
 * Character generation has no model selector.
 * @returns {Array}
 */
export function filterEligibleModels() {
  return [];
}

/**
 * Maps UI slot role to backend parameter key.
 * Role "reference" maps to "references" parameter in payload.
 *
 * @param {object} _model
 * @param {string} role
 * @returns {string|null}
 */
export function resolveParameterMapping(_model, role) {
  if (role === "reference") return "references";
  return null;
}

/**
 * Creates actions for character prompt bar.
 *
 * @param {object} _core
 * @returns {object}
 */
export function createActions(_core) {
  return {};
}

export const characterTemplate = defineTemplate({
  id: "character",
  persistRoutes: [
    "/cinema-studio/:projectId/characters*",
    "/cinema-studio/:projectId/characters/new*",
  ],
  layout: {
    showPromptInput: true,
    showModelSelector: false,
    showParameterDrawer: false,
    showAttachmentBar: true,
    showModeSelector: false,
  },
  features: {
    models: false,
    modes: false,
  },
  defaultState: {
    activeMode: "image",
    activeSubMode: "frames",
  },
  mediaLimit: 4,
  parameters: CHARACTER_PARAMETERS,
  getSlots,
  filterEligibleModels,
  resolveParameterMapping,
  createActions,
});

export default characterTemplate;
