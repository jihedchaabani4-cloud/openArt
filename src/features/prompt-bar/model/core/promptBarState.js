export const PROMPT_BAR_REFERENCE_MODES = Object.freeze({
  image: [],
  video: [],
  keyframe: [],
  multiref: [],
  "motion-control": [],
});

const PROMPT_BAR_GENERATION_DEFAULTS = Object.freeze({
  prompt: "",
  generationMode: "image",
  modelId: "nanobana_pro",
  ratio: "1:1",
  quality: "2K",
  count: 1,
  duration: "5s",
  videoResolution: "1080p",
  motion: 50,
  popoverOpen: false,
  isDraggingGalleryItem: false,
  draggedItem: null,
});

export function createPromptBarReferencesByMode(overrides = {}) {
  return {
    ...PROMPT_BAR_REFERENCE_MODES,
    ...overrides,
  };
}

export function createPromptBarState(overrides = {}) {
  return {
    ...PROMPT_BAR_GENERATION_DEFAULTS,
    ...overrides,
    referenceImages: [...(overrides.referenceImages ?? [])],
    referencesByMode: createPromptBarReferencesByMode(overrides.referencesByMode),
  };
}

