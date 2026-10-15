/**
 * Generated Media Template Definition
 *
 * Composes generatedMediaType and generatedMedia.config into the canonical
 * TemplateDefinition contract without mutating legacy config sources.
 */

import { defineTemplate } from "../core/templateContract.js";
import { generatedMediaType } from "../composition/generatedMedia.type.js";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../features/generated-media/generatedMedia.config.js";

/** Resolves composition slot definitions for generated media modes and sub-modes. */
function getSlots(mode, subMode) {
  const req = COMPOSITION_REQUIREMENTS;
  const modeSlots = req?.[mode];
  if (!modeSlots) return [];
  return Array.isArray(modeSlots) ? modeSlots : (modeSlots[subMode] ?? []);
}

export const generatedMediaTemplate = defineTemplate({
  id: generatedMediaType.id,
  persistRoutes: [
    "/cinema-studio/:projectId/assets",
    "/cinema-studio/:projectId/collection/:collectionId",
  ],
  layout: generatedMediaType.layout,
  features: {
    models: true,
    modes: true,
  },
  defaultState: {
    activeMode: "image",
    activeSubMode: "frames",
  },
  getSlots,
  filterEligibleModels,
  resolveParameterMapping,
});
