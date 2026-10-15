/**
 * Prompt Only Test Template (PB-D-13)
 *
 * Test fixture proving that model and mode are optional in the Prompt Bar platform.
 * Features:
 *   - features: { models: false, modes: false }
 *   - static parameters (style, lighting, and mapped media parameters)
 *   - slots: front, side, closeup mapped via resolveParameterMapping
 *   - mediaLimit: 3
 *   - no createActions
 */

import { defineTemplate } from "../../core/templateContract.js";

export const STATIC_PARAMETERS = {
  style: { name: "style", type: "string", default: "cinematic" },
  lighting: { name: "lighting", type: "string", default: "natural" },
  front_image: { name: "front_image", type: "image", group: "media" },
  side_image: { name: "side_image", type: "image", group: "media" },
  closeup_image: { name: "closeup_image", type: "image", group: "media" },
};

export const MEDIA_MAPPING = {
  front: "front_image",
  side: "side_image",
  closeup: "closeup_image",
};

export const promptOnlyTemplate = defineTemplate({
  id: "prompt-only-test",
  features: {
    models: false,
    modes: false,
  },
  layout: {
    showPromptInput: true,
    showModelSelector: false,
    showModeSelector: false,
    showParameterDrawer: true,
    showAttachmentBar: true,
  },
  mediaLimit: 3,
  parameters: STATIC_PARAMETERS,
  getSlots: () => [
    { role: "front", label: "Front View", accepts: "image/*" },
    { role: "side", label: "Side View", accepts: "image/*" },
    { role: "closeup", label: "Close-up", accepts: "image/*" },
  ],
  filterEligibleModels: () => [],
  resolveParameterMapping: (_model, role) => MEDIA_MAPPING[role] || null,
});
