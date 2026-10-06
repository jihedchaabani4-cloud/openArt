import { filterEligibleModels } from "../features/generated-media/generatedMedia.config.js";

export { filterEligibleModels };

export const UI_SLOTS = {
  image: [
    { role: "reference", label: "Reference", accepts: "image/*" },
  ],
  video_frames: [
    { role: "start", label: "Start", accepts: "image/*" },
    { role: "end",   label: "End",   accepts: "image/*" },
  ],
  video_reference: [
    { role: "reference", label: "Reference", accepts: "video/*,image/*" },
  ],
};

export function resolveUI(model, mode = "image", subMode = "frames") {
  if (!model) return { slots: [], showSwap: false };
  if (mode === "image") {
    return { slots: UI_SLOTS.image, showSwap: false };
  }
  if (mode === "video") {
    if (subMode === "frames") {
      return { slots: UI_SLOTS.video_frames, showSwap: true };
    }
    if (subMode === "reference") {
      return { slots: UI_SLOTS.video_reference, showSwap: false };
    }
  }
  return { slots: [], showSwap: false };
}
