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

const EDIT_STAGE_DEFAULTS = Object.freeze({
  camera_dna: {
    rotation: 0,
    tilt: 0,
    zoom: 0,
  },
  lighting_dna: {
    angle: 0,
    elevation: 0,
    intensity: 5,
    type: "soft",
    brightness: 40,
    color: "#ffffff",
  },
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

export function createEditPromptBarState(overrides = {}) {
  return {
    editTarget: null,
    prompt: "",
    modelId: "nanobana_pro",
    ratio: "1:1",
    quality: "standard",
    activeTab: "describe",
    camera: null,
    lighting: null,
    upscaleScale: "x2",
    selection: null,
    referenceImages: [],
    stagedDna: {
      ...EDIT_STAGE_DEFAULTS,
      camera_dna: { ...EDIT_STAGE_DEFAULTS.camera_dna },
      lighting_dna: { ...EDIT_STAGE_DEFAULTS.lighting_dna },
    },
    ...overrides,
    referenceImages: [...(overrides.referenceImages ?? [])],
    stagedDna: overrides.stagedDna
      ? {
          ...EDIT_STAGE_DEFAULTS,
          ...overrides.stagedDna,
          camera_dna: {
            ...EDIT_STAGE_DEFAULTS.camera_dna,
            ...overrides.stagedDna.camera_dna,
          },
          lighting_dna: {
            ...EDIT_STAGE_DEFAULTS.lighting_dna,
            ...overrides.stagedDna.lighting_dna,
          },
        }
      : {
          ...EDIT_STAGE_DEFAULTS,
          camera_dna: { ...EDIT_STAGE_DEFAULTS.camera_dna },
          lighting_dna: { ...EDIT_STAGE_DEFAULTS.lighting_dna },
        },
  };
}

