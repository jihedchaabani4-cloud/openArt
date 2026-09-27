import { normalizeParameterDefinition } from "./modelContract.js";

/**
 * Backend Model Adapter for Prompt Bar V2
 * 
 * Converts raw backend model objects (from GET /api/models or useProjectData.modelConfig.models)
 * into canonical frontend V2 model contracts.
 * 
 * Guarantees:
 * - Pure data transformation
 * - Strips all provider, route, or execution details
 * - ZERO model-id branching
 */

/**
 * Maps a single backend parameter definition into a frontend parameter definition.
 * 
 * @param {string} paramName - Name/key of parameter
 * @param {object} rawParam - Backend parameter definition
 * @returns {object} Adapted parameter definition
 */
export function adaptBackendParameter(paramName, rawParam = {}) {
  const isPrompt = paramName === "prompt";
  const rawType = rawParam.type || "string";
  const hasValues = Array.isArray(rawParam.values) && rawParam.values.length > 0;

  let type = "text";
  let role = "parameter";
  let group = "generation";

  // 1. Media Type Inference
  if (paramName === "input_image" || paramName === "start_frame" || paramName === "image_url") {
    type = "image";
    role = "start_frame";
    group = "media";
  } else if (paramName === "last_frame" || paramName === "end_frame" || paramName === "mask") {
    type = "image";
    role = paramName === "mask" ? "mask" : "end_frame";
    group = "media";
  } else if (paramName === "reference_images" || (rawType === "array" && paramName.includes("image"))) {
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
  }
  // 2. Select / Enum Inference (values array present)
  else if (hasValues) {
    type = "select";
  }
  // 3. Boolean Inference
  else if (rawType === "boolean") {
    type = "boolean";
  }
  // 4. Number Inference
  else if (rawType === "number") {
    type = "number";
  }
  // 5. Text / String Fallback
  else {
    type = "text";
  }

  // Grouping rules based on parameter purpose
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

    if (isAdvanced) {
      group = "advanced";
    } else {
      group = "generation";
    }
  }

  // Deterministic order
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
    required: isPrompt ? false : Boolean(rawParam.required),
  });

  return {
    ...normalized,
    isPrompt,
  };
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
 * Adapts a raw backend model DTO into the normalized V2 model contract.
 * 
 * @param {object} rawModel - Backend model object
 * @returns {object} Normalized V2 model contract
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
    if (adapted.diagnostics && adapted.diagnostics.length > 0) {
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
    capabilities: rawModel.capabilities || {},
    parameters: definitions,
    diagnostics,
  };
}

/**
 * Adapts an array of raw backend models into an array of normalized V2 models.
 * 
 * @param {Array<object>} rawModels - Array of backend model DTOs
 * @returns {Array<object>} Normalized V2 models
 */
export function adaptBackendCatalog(rawModels = []) {
  if (!Array.isArray(rawModels)) return [];
  return rawModels.map(adaptBackendModel);
}
