/**
 * Generated Media Feature Config
 *
 * v3 Architecture: This file owns the 3 feature-level decisions for Generated Media:
 *   1. COMPOSITION_REQUIREMENTS — which roles appear per Mode+SubMode
 *   2. filterEligibleModels — which models support this Mode+SubMode (manifest-only)
 *   3. resolveParameterMapping — how UI roles map to backend parameter keys
 *
 * Core, Store, and Platform are completely unaware of this file's contents.
 * Adding a new prompt bar feature = creating a new <feature>.config.js like this one.
 */

// ── 1. COMPOSITION_REQUIREMENTS ─────────────────────────────────────────────
//
// Flat map: mode → subMode → SlotDef[]
// Each SlotDef is { role, label, accepts }.
// Role is a UI identifier ONLY — never a backend parameter key.
// Must be a plain object literal — no functions, no runtime complexity.

export const COMPOSITION_REQUIREMENTS = {
  image: [
    { role: "reference", label: "Reference", accepts: "image/*" },
  ],
  video: {
    frames: [
      { role: "start", label: "Start", accepts: "image/*" },
      { role: "end",   label: "End",   accepts: "image/*" },
    ],
    reference: [
      { role: "reference", label: "Reference", accepts: "image/*" },
    ],
  },
};

// ── Helpers: Model classification by parameters ─────────────────────────────

/**
 * Checks if a model supports Keyframe Video generation (Start Frame + End Frame).
 * Pure parameter check: must have input_image (or start_frame) AND last_frame (or end_frame).
 *
 * @param {object} model
 * @returns {boolean}
 */
export function isFrameModel(model) {
  if (!model) return false;
  const isVideo = model.domain === "video" || model.category === "video";
  if (!isVideo) return false;
  const params = model.parameters || {};
  const hasStart = Boolean(params.input_image || params.start_frame || model.capabilities?.input_image);
  const hasEnd = Boolean(params.last_frame || params.last_image || params.end_frame || model.capabilities?.last_frame);
  return hasStart && hasEnd;
}

/**
 * Checks if a model supports Reference images (multi-reference / characters / elements).
 * Pure parameter check: must have `images` (or `reference_images`).
 *
 * @param {object} model
 * @returns {boolean}
 */
export function isReferenceModel(model) {
  if (!model) return false;
  const params = model.parameters || {};
  if (params.images || params.reference_images) return true;
  // In image domain, legacy img2img models with single input_image also accept an image input
  if ((model.domain === "image" || model.category === "image") && (params.input_image || model.capabilities?.input_image)) {
    return true;
  }
  return false;
}

// ── 2. filterEligibleModels ───────────────────────────────────────────────────
//
// Returns the subset of `models` that are capable of the given mode+subMode.
// RULES:
//   - Pure parameter inspection — never hardcoded by model.id strings
//   - If mode is video and subMode is frames -> requires isFrameModel (input_image + last_frame)
//   - If mode is video and subMode is reference -> requires isReferenceModel (images / reference_images)
//   - For Image mode: dynamic — all image models eligible when reference slot is empty;
//     narrows to reference-capable models when references are attached.
//
// @param {Model[]} models — full model list from backend
// @param {string}  mode   — "image" | "video"
// @param {string}  [subMode] — "frames" | "reference"
// @param {object}  [parameterValues] — current store parameterValues, used for Image mode dynamic eligibility
// @returns {Model[]}

export function filterEligibleModels(models = [], mode = "image", subMode = null, parameterValues = {}) {
  const list = Array.isArray(models) ? models : Object.values(models || {});

  if (mode === "image") {
    const imageDomainModels = list.filter((m) => m.domain === "image" || m.category === "image");
    // Dynamic eligibility: if references are currently in the store, narrow to reference-capable models
    const hasReference = Boolean(
      (Array.isArray(parameterValues?.images) && parameterValues.images.length > 0) ||
      (Array.isArray(parameterValues?.reference_images) && parameterValues.reference_images.length > 0) ||
      parameterValues?.images ||
      parameterValues?.reference_images ||
      parameterValues?.input_image
    );
    if (hasReference) {
      return imageDomainModels.filter(isReferenceModel);
    }
    // No reference uploaded: all image-domain models are eligible
    return imageDomainModels;
  }

  if (mode === "video") {
    const videoDomainModels = list.filter((m) => m.domain === "video" || m.category === "video");

    if (subMode === "frames") {
      // Frames requires both start (input_image) and end (last_frame) parameters
      return videoDomainModels.filter(isFrameModel);
    }

    if (subMode === "reference") {
      // Video Reference requires `images` (or `reference_images`)
      return videoDomainModels.filter(isReferenceModel);
    }

    // Generic video (no subMode): all video models
    return videoDomainModels;
  }

  // Fallback: return full list (unknown mode)
  return list;
}

// ── 3. resolveParameterMapping ────────────────────────────────────────────────
//
// Maps a UI slot role name to its backend parameter key for the current model.
// Inspects model.parameters directly so references map to `images` and frames map to `input_image`/`last_frame`.
//
// @param {object} model — currently selected model
// @param {string} role  — UI slot role ("start", "end", "reference")
// @returns {string|null} — backend parameter key, or null if unsupported

export function resolveParameterMapping(model, role) {
  const params = model?.parameters || {};

  if (role === "start") {
    if (params.input_image) return "input_image";
    if (params.start_frame) return "start_frame";
    return "input_image";
  }

  if (role === "end") {
    if (params.last_frame) return "last_frame";
    if (params.last_image) return "last_image";
    if (params.end_frame) return "end_frame";
    return params.last_frame ? "last_frame" : null;
  }

  if (role === "reference") {
    // If model has `images` parameter, map to `images`!
    if (params.images) return "images";
    if (params.reference_images) return "reference_images";
    if (params.input_image && (model?.domain === "image" || model?.category === "image")) {
      return "input_image";
    }
    return params.images ? "images" : null;
  }

  return null;
}

