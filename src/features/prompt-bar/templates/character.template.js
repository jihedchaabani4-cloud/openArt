/**
 * Character Generation Template Definition
 *
 * Source of truth for Character Prompt Bar feature rules:
 *   - Image domain only (no video modes)
 *   - Attachment bar hidden (no reference slots)
 *   - Eligible models filtered strictly to image domain
 *   - State persisted across character studio routes
 */

import { defineTemplate } from "../core/templateContract.js";
import { characterType } from "../composition/character.type.js";

/**
 * Returns slots for Character generation (none: attachment bar is hidden).
 * @returns {Array}
 */
export function getSlots() {
  return [];
}

/**
 * Filters models to only those supporting image generation.
 *
 * @param {Array<object>} [models=[]]
 * @returns {Array<object>}
 */
export function filterEligibleModels(models = []) {
  const list = Array.isArray(models) ? models : Object.values(models || {});
  return list.filter((m) => m && (m.domain === "image" || m.category === "image"));
}

/**
 * Maps UI slot role to backend parameter key.
 * Characters have no attachment slots, returning null.
 *
 * @param {object} _model
 * @param {string} _role
 * @returns {null}
 */
export function resolveParameterMapping(_model, _role) {
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
  id: characterType.id || "character",
  persistRoutes: [
    "/cinema-studio/:projectId/characters*",
    "/cinema-studio/:projectId/characters/new*",
  ],
  layout: {
    showPromptInput: true,
    showModelSelector: true,
    showParameterDrawer: true,
    showAttachmentBar: false,
    showModeSelector: false,
  },
  features: {
    models: true,
    modes: false,
  },
  defaultState: {
    activeMode: "image",
    activeSubMode: "frames",
  },
  getSlots,
  filterEligibleModels,
  resolveParameterMapping,
  createActions,
});

export default characterTemplate;
