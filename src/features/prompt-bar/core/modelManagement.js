/**
 * Prompt Bar Platform — Model Management
 *
 * Pure functions for adapting backend model data into the canonical frontend contract.
 * No React, no DOM, no model-id branching, no feature-specific knowledge.
 */

import { normalizeParameterDefinition } from "./types.js";

/**
 * Infers the parameter type and metadata from raw backend parameter definition.
 *
 * @param {string} paramName - Parameter key name
 * @param {object} rawParam - Raw backend parameter definition
 * @returns {object} Adapted ParameterDefinition
 */
export function adaptBackendParameter(paramName, rawParam = {}) {
  const rawType = rawParam.type || "string";
  const hasValues = Array.isArray(rawParam.values) && rawParam.values.length > 0;

  let type = "text";
  let role = "parameter";
  let group = "generation";

  // 1. Media type inference
  if (paramName === "input_image" || paramName === "start_frame" || paramName === "image_url") {
    type = "image";
    role = "start_frame";
    group = "media";
  } else if (paramName === "last_frame" || paramName === "end_frame" || paramName === "mask") {
    type = "image";
    role = paramName === "mask" ? "mask" : "end_frame";
    group = "media";
  } else if (paramName === "reference_images" || paramName === "images" || (rawType === "array" && paramName.includes("image"))) {
    type = "image[]";
    role = "reference_images";
    group = "media";
  } else if (paramName === "input_video" || (rawType === "string" && paramName.includes("video"))) {
    type = "video";
    role = "reference_video";
    group = "media";
  } else if (paramName === "reference_videos" || (rawType === "array" && paramName.includes("video"))) {
    type = "video[]";
    role = "reference_videos";
    group = "media";
  } else if (hasValues) {
    type = "select";
  } else if (rawType === "boolean") {
    type = "boolean";
  } else if (rawType === "number") {
    type = "number";
  } else {
    type = "text";
  }

  // Grouping for non-media params
  if (group !== "media") {
    const isAdvanced = [
      "seed",
      "negative_prompt",
      "output_format",
      "generate_audio",
      "enable_audio",
      "enable_web_search",
      "enable_image_search",
      "prompt_optimization_mode",
      "enable_prompt_expansion",
      "cfg_scale",
      "steps",
      "face_restore",
      "scale_factor",
    ].includes(paramName);
    group = isAdvanced ? "advanced" : "generation";
  }

  // Deterministic render order
  let order = 50;
  if (paramName === "resolution" || paramName === "target_resolution") order = 10;
  else if (paramName === "aspect_ratio" || paramName === "ratio") order = 20;
  else if (paramName === "quality") order = 30;
  else if (paramName === "duration") order = 40;
  else if (paramName === "style") order = 45;

  const normalized = normalizeParameterDefinition(paramName, {
    ...rawParam,
    type,
    role,
    group,
    order,
    required: Boolean(rawParam.required),
  });

  return { ...normalized, isPrompt: paramName === "prompt" };
}

export const MODEL_ICON_MAP = {
  nanobana: "/icons/models/minimax.svg",
  nano: "/icons/models/minimax.svg",
  google: "/icons/models/google.svg",
  gemini: "/icons/models/google.svg",
  gpt: "/icons/models/openai.svg",
  openai: "/icons/models/openai.svg",
  seedance: "/icons/models/bytedance.svg",
  seedream: "/icons/models/baichuan.svg",
  wan: "/icons/models/alibaba.svg",
  wavespeed: "/icons/models/replicate.svg",
  kling: "/icons/models/kling.svg",
  runway: "/icons/models/runway.svg",
  ltx: "/icons/models/ltx.svg",
};

/**
 * Resolves a valid icon URL for a model DTO or contract.
 * Checks icon, iconUrl, image, and falls back to canonical icon mapping by model family/id.
 *
 * @param {object} rawModel
 * @returns {string}
 */
export function resolveModelIcon(rawModel = {}) {
  if (!rawModel) return "";
  if (typeof rawModel.icon === "string" && rawModel.icon.trim()) {
    return rawModel.icon;
  }
  if (typeof rawModel.iconUrl === "string" && rawModel.iconUrl.trim()) {
    return rawModel.iconUrl;
  }
  if (typeof rawModel.image === "string" && rawModel.image.trim()) {
    return rawModel.image;
  }

  const key = String(rawModel.id || rawModel.key || rawModel.modelFamily || rawModel.name || "").toLowerCase();
  for (const [prefix, iconPath] of Object.entries(MODEL_ICON_MAP)) {
    if (key.includes(prefix)) {
      return iconPath;
    }
  }
  return "";
}

/**
 * Adapts a raw backend model DTO into the normalized frontend ModelContract.
 *
 * @param {object} rawModel - Backend model object from /api/models
 * @returns {object} Normalized ModelContract
 */
export function adaptBackendModel(rawModel = {}) {
  const id = rawModel.key || rawModel.id || rawModel.modelFamily || "unknown-model";
  const name = rawModel.displayName || rawModel.name || id;
  const domain = rawModel.category || rawModel.domain || "image";
  const rawParams = rawModel.parameters || {};

  const definitions = {};
  const diagnostics = [];

  for (const [paramName, rawParam] of Object.entries(rawParams)) {
    const adapted = adaptBackendParameter(paramName, rawParam);
    definitions[paramName] = adapted;
    if (adapted.diagnostics?.length > 0) {
      diagnostics.push(...adapted.diagnostics);
    }
  }

  return {
    id,
    name,
    domain,
    description: rawModel.description || "",
    badge: rawModel.badge || (rawModel.tier && rawModel.tier !== "standard" ? rawModel.tier.toUpperCase() : null),
    icon: resolveModelIcon(rawModel),
    pricing: rawModel.pricing || rawModel.retailPricing || null,
    tags: rawModel.tags || [],
    capabilities: {
      ...(rawModel.capabilities || {}),
      input_image: Boolean(
        rawModel.capabilities?.input_image ||
        rawParams.input_image ||
        rawParams.images ||
        rawParams.reference_images ||
        definitions.input_image
      ),
      last_frame: Boolean(
        rawModel.capabilities?.last_frame ||
        rawParams.last_frame ||
        rawParams.end_frame ||
        definitions.last_frame
      ),
      input_video: Boolean(
        rawModel.capabilities?.input_video ||
        rawParams.input_video ||
        definitions.input_video
      ),
    },
    parameters: definitions,
    diagnostics,
  };
}

/**
 * Adapts an array of raw backend models into normalized ModelContracts.
 *
 * @param {Array<object>} rawModels - Array of backend model DTOs
 * @returns {Array<object>} Normalized ModelContracts
 */
export function adaptBackendCatalog(rawModels = []) {
  if (!Array.isArray(rawModels)) return [];
  return rawModels.map(adaptBackendModel);
}

/**
 * Infers reference image capability and max capacity for a model.
 *
 * @param {object} model - Normalized ModelContract or raw model object
 * @returns {{ supports: boolean, maxRefs: number, backendKey: string|null }}
 */
export function getModelReferenceCapability(model) {
  if (!model) return { supports: false, maxRefs: 0, backendKey: null };

  const isVideo = model.domain === "video" || model.category === "video";
  const params = model.parameters || {};
  const caps = model.capabilities || {};
  const support = model.support || {};
  const topMax = model.max_images || model.max_refs || model.maxRefs;

  // Video domain models:
  // Video models ONLY support references if they explicitly declare `images` or `reference_images`.
  // `input_image` and `last_frame` in video models are KEYFRAMES (start and end frame), NEVER references!
  if (isVideo) {
    if (params.images) {
      const max = params.images.max || params.images.max_count || topMax || 4;
      return { supports: true, maxRefs: max, backendKey: "images" };
    }
    if (params.reference_images) {
      const max = params.reference_images.max || params.reference_images.max_count || topMax || 4;
      return { supports: true, maxRefs: max, backendKey: "reference_images" };
    }
    return { supports: false, maxRefs: 0, backendKey: null };
  }

  // 1. Array / multi-image parameters
  if (params.images) {
    const max = params.images.max || params.images.max_count || topMax || (typeof support.references === "object" ? support.references?.max : null) || 4;
    return { supports: true, maxRefs: max, backendKey: "images" };
  }
  if (params.reference_images) {
    const max = params.reference_images.max || params.reference_images.max_count || topMax || (typeof support.references === "object" ? support.references?.max : null) || 4;
    return { supports: true, maxRefs: max, backendKey: "reference_images" };
  }

  // 2. Model capabilities or support flags (v1 compatibility: support.references)
  if (support.references) {
    const max = typeof support.references === "object" ? support.references.max || 4 : (topMax || 4);
    return { supports: true, maxRefs: max, backendKey: "images" };
  }

  // 3. Image domain models with single input_image (legacy img2img):
  if (params.input_image || caps.input_image) {
    const max = params.input_image?.max || topMax || 1;
    return { supports: true, maxRefs: max, backendKey: "input_image" };
  }

  // Text-only model (no image input parameters accepted)
  return { supports: false, maxRefs: 0, backendKey: null };
}

