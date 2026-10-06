/**
 * Generated Media Composition Type
 *
 * Powers the main image/video generation prompt bar.
 * Defines the LAYOUT config for PromptBarPlatform (what UI chrome to show).
 *
 * v3 NOTE: Slot definitions and model eligibility have moved to:
 *   features/generated-media/generatedMedia.config.js
 *     -> COMPOSITION_REQUIREMENTS  (which roles appear per mode/subMode)
 *     -> filterEligibleModels      (capability-based model eligibility)
 *     -> resolveParameterMapping   (role -> backend key mapping)
 *
 * The `modes` and nested `referenceSlots` below are LEGACY and no longer used
 * by PromptBarPlatform v3. They are kept here for compatibility with any existing
 * code that reads type.modes directly. Do not add new modes here.
 */

import { createPromptBarType } from "./createPromptBarType.js";

export const generatedMediaType = createPromptBarType({
  id: "generated-media",
  defaultModelId: null,
  supportedDomains: ["image", "video"],
  layout: {
    showPromptInput: true,
    showModelSelector: true,
    showParameterDrawer: true,
    showAttachmentBar: true,
    showModeSelector: true,
  },
  // @deprecated v3: modes/referenceSlots below are no longer used by PromptBarPlatform.
  // Slot definitions have moved to generatedMedia.config.js > COMPOSITION_REQUIREMENTS.
  // Kept for backward compatibility only.
  modes: {
    image: {
      domain: "image",
      label: "Image",
      referenceSlots: [
        { role: "reference", label: "Reference", accepts: ["image"], maxCount: 5 },
      ],
    },
    video: {
      domain: "video",
      label: "Video",
      subModes: {
        frames: {
          label: "Frames",
          referenceSlots: [
            { role: "start", label: "Start", accepts: ["image"], maxCount: 1 },
            { role: "end",   label: "End",   accepts: ["image"], maxCount: 1 },
          ],
        },
        reference: {
          label: "Reference",
          referenceSlots: [
            { role: "reference", label: "Reference", accepts: ["image", "video"], maxCount: 5 },
          ],
        },
      },
    },
  },
});

