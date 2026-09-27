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
      { role: "start", label: "Start Frame", accepts: "image/*" },
      { role: "end",   label: "End Frame",   accepts: "image/*" },
    ],
    reference: [
      { role: "reference", label: "Reference", accepts: "image/*" },
    ],
  },
};

// ── 2. filterEligibleModels ───────────────────────────────────────────────────
//
// Returns the subset of `models` that are capable of the given mode+subMode.
// RULES:
//   - MUST use only manifest capability fields — NEVER model.id substrings
//   - MUST return [] (not null/undefined) when no models are eligible
//   - For Image mode: dynamic — all image models eligible when reference slot is empty;
//     narrows to input_image-capable models when a reference image is present.
//
// @param {Model[]} models — full model list from backend
// @param {string}  mode   — "image" | "video"
// @param {string}  [subMode] — "frames" | "reference"
// @param {object}  [parameterValues] — current store parameterValues, used for Image mode dynamic eligibility
// @returns {Model[]}

export function filterEligibleModels(models = [], mode = "image", subMode = null, parameterValues = {}) {
  const list = Array.isArray(models) ? models : Object.values(models || {});

  if (mode === "image") {
    const imageDomainModels = list.filter((m) => m.domain === "image");
    // Dynamic eligibility (FR-FEAT-06): if reference slot is populated, only input_image-capable models
    const hasReference = Boolean(parameterValues?.input_image);
    if (hasReference) {
      return imageDomainModels.filter((m) => m.capabilities?.input_image === true);
    }
    // No reference uploaded: all image-domain models are eligible
    return imageDomainModels;
  }

  if (mode === "video") {
    const videoDomainModels = list.filter((m) => m.domain === "video");

    if (subMode === "frames") {
      // Frames requires last_frame capability — the only correct manifest-based check
      return videoDomainModels.filter((m) => m.capabilities?.last_frame === true);
    }

    if (subMode === "reference") {
      // Video Reference requires input_image capability
      return videoDomainModels.filter((m) => m.capabilities?.input_image === true);
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
// This is an EXPLICIT STATIC TABLE — never derived from canonicalInputs inference.
//
// Background (§8-C Audit):
//   - canonicalInputs in manifests is descriptive schema, not a role→key map
//   - backendModelAdapter uses internal adapter roles that don't match UI slot roles
//   - The mapping below is built directly from manifest inspection:
//       seedance_2_5, wan_3_0: start → input_image, end → last_frame, reference → input_image
//       nanobana_pro, nanobana_pro_ultra: reference → input_image
//
// @param {Model}  model — currently selected model (currently unused; table is model-invariant)
// @param {string} role  — UI slot role (e.g. "start", "end", "reference")
// @returns {string|null} — backend parameter key, or null if no mapping
//
// NOTE: If future models require a different role→key mapping, add a model-specific
// branch here keyed on model.id. Do NOT use model.id substrings for capability logic.

const ROLE_TO_BACKEND_KEY = {
  start:     "input_image",  // Start Frame → the main source image URL
  end:       "last_frame",   // End Frame   → the last frame image URL
  reference: "input_image",  // Reference   → same field, used as style/reference image
};

export function resolveParameterMapping(model, role) {
  return ROLE_TO_BACKEND_KEY[role] ?? null;
}
