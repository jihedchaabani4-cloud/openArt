/**
 * Character Generation Composition Type
 *
 * Powers the character generation prompt bar.
 * No reference slots — attachment bar is hidden (FR-COMP-04).
 */

import { createPromptBarType } from "./createPromptBarType.js";

export const characterType = createPromptBarType({
  id: "character",
  defaultModelId: null,
  supportedDomains: ["image"],
  referenceSlots: [],
  layout: {
    showPromptInput: true,
    showModelSelector: true,
    showParameterDrawer: true,
    showAttachmentBar: false,
  },
});
