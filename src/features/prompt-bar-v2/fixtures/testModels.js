/**
 * Test Fixtures for Prompt Bar V2
 * 
 * Contains mock model metadata strictly as data fixtures.
 * Note: Zero UI or execution logic is coupled to these IDs.
 */

export const TEST_MODEL_A = {
  id: "test-image-a",
  name: "Omni Image Pro (Model A)",
  domain: "image",
  badge: "PRO",
  description: "Standard image model with resolution, quality, ratio, and optional input image.",
  capabilities: {
    prompt: true,
    input_image: true,
    resolution: true,
    quality: true,
    aspect_ratio: true,
  },
  parameters: {
    resolution: {
      type: "select",
      values: ["1k", "2k", "4k"],
      default: "1k",
      label: "Resolution",
      order: 10,
    },
    quality: {
      type: "select",
      values: ["standard", "hd"],
      default: "standard",
      label: "Quality",
      order: 20,
    },
    ratio: {
      type: "select",
      values: ["1:1", "16:9", "9:16"],
      default: "1:1",
      label: "Aspect Ratio",
      order: 30,
    },
    input_image: {
      type: "image",
      required: false,
      label: "Input Image",
      role: "start_frame",
      order: 40,
    },
  },
};

export const TEST_MODEL_B = {
  id: "test-image-b",
  name: "Fast Diffusion (Model B)",
  domain: "image",
  badge: "FAST",
  description: "Fast diffusion model with seed number control and limited resolutions.",
  capabilities: {
    prompt: true,
    resolution: true,
    aspect_ratio: true,
    seed: true,
  },
  parameters: {
    resolution: {
      type: "select",
      values: ["1k", "2k"],
      default: "1k",
      label: "Resolution",
      order: 10,
    },
    ratio: {
      type: "select",
      values: ["1:1", "4:3"],
      default: "1:1",
      label: "Aspect Ratio",
      order: 20,
    },
    seed: {
      type: "number",
      min: 0,
      max: 100000,
      step: 1,
      default: 42,
      label: "Seed",
      order: 30,
    },
  },
};

export const TEST_MODEL_C = {
  id: "test-video-c",
  name: "CineMotion Video (Model C)",
  domain: "video",
  badge: "CINEMA",
  description: "Video generation model with start frame, last frame, and duration options.",
  capabilities: {
    prompt: true,
    input_image: true,
    last_frame: true,
    duration: true,
    resolution: true,
  },
  parameters: {
    duration: {
      type: "select",
      values: [5, 10],
      default: 5,
      label: "Duration (s)",
      order: 10,
    },
    resolution: {
      type: "select",
      values: ["720p", "1080p"],
      default: "720p",
      label: "Resolution",
      order: 20,
    },
    input_image: {
      type: "image",
      required: false,
      label: "First Frame",
      role: "start_frame",
      order: 30,
    },
    last_frame: {
      type: "image",
      required: false,
      label: "End Frame",
      role: "end_frame",
      order: 40,
    },
  },
};

export const TEST_MODEL_D = {
  id: "test-character-d",
  name: "Persona Studio (Model D)",
  domain: "character",
  badge: "IDENTITY",
  description: "Character identity model with reference image shelf and artistic style.",
  parameters: {
    reference_images: {
      type: "image[]",
      max: 4,
      label: "Reference Images",
      role: "reference_images",
      order: 10,
    },
    style: {
      type: "select",
      values: ["realistic", "stylized"],
      default: "realistic",
      label: "Style",
      order: 20,
    },
  },
};

export const TEST_MODEL_E = {
  id: "test-edge-e",
  name: "Edge Case & Diagnostics (Model E)",
  domain: "experimental",
  badge: "DEV",
  description: "Model with unknown parameter types and required fields to verify error handling.",
  parameters: {
    quantum_tensor: {
      type: "unsupported_custom_type",
      default: "state_vector_alpha",
      label: "Quantum Tensor",
    },
    required_no_default: {
      type: "text",
      required: true,
      label: "Required API Token",
    },
    step_param: {
      type: "number",
      min: 0,
      max: 20,
      step: 5,
      default: 10,
      label: "Step Interval",
    },
  },
};

export const ALL_TEST_MODELS = [
  TEST_MODEL_A,
  TEST_MODEL_B,
  TEST_MODEL_C,
  TEST_MODEL_D,
  TEST_MODEL_E,
];
