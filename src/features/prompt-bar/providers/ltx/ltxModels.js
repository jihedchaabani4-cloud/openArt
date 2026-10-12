/**
 * LTX (Lightricks) Video Provider — Static Model Catalog
 *
 * These model definitions mirror the backend DTO format expected by adaptBackendCatalog.
 * They are injected into the model list alongside backend models in useRealBackendModels.
 *
 * LTX API Docs: https://docs.ltx.io/welcome
 * Models: https://docs.ltx.io/models
 */

/** Shared resolutions for LTX-2.5 */
const LTX_25_RESOLUTIONS = [
  "1280x720",
  "720x1280",
  "1024x768",
  "768x1024",
  "1920x1080",
  "1080x1920",
  "960x960",
];

/** Shared resolutions for LTX-2.3 */
const LTX_23_RESOLUTIONS = [
  "1280x720",
  "720x1280",
  "1024x576",
  "576x1024",
  "1920x1080",
  "1080x1920",
];

/** Camera motion options (shared across all models) */
const CAMERA_MOTION_VALUES = [
  "dolly_in",
  "dolly_out",
  "dolly_left",
  "dolly_right",
  "jib_up",
  "jib_down",
  "static",
  "focus_shift",
];

/**
 * Shared base parameters for all LTX models.
 * duration: nullable integer — pass null to enable auto-duration (LTX-2.5 only).
 */
const BASE_LTX_PARAMS = {
  prompt: { type: "string", required: true },
  duration: { type: "number", required: true, default: 8, values: [6, 8, 10] },
  fps: { type: "number", default: 24 },
  generate_audio: { type: "boolean", default: true },
  camera_motion: { type: "string", values: CAMERA_MOTION_VALUES },
};

/**
 * LTX model definitions in backend DTO format.
 * adaptBackendCatalog() will convert these into normalized ModelContracts.
 *
 * IMPORTANT — parameter naming convention:
 *   - `input_image` → adaptBackendParameter() classifies as type "image", role "start_frame"
 *   - `last_frame`  → adaptBackendParameter() classifies as type "image", role "end_frame"
 *   Both are needed for isFrameModel() to return true (enables Start+End UI slots).
 */
export const LTX_MODELS_CATALOG = [
  // ── LTX-2.5 Pro ──────────────────────────────────────────────────────────────
  {
    key: "ltx-2-5-pro",
    displayName: "LTX 2.5 Pro",
    category: "video",
    badge: "PRO",
    description:
      "Lightricks LTX-2.5 Pro — up to 4K video with AI audio, automatic duration, and first-frame animation.",
    icon: "/icons/models/ltx.svg",
    parameters: {
      ...BASE_LTX_PARAMS,
      resolution: { type: "string", required: true, values: LTX_25_RESOLUTIONS },
      // Start frame only (no last_frame → isFrameModel = false, shows 1 slot)
      input_image: { type: "string" },
    },
  },

  // ── LTX-2.5 Fast ─────────────────────────────────────────────────────────────
  {
    key: "ltx-2-5-fast",
    displayName: "LTX 2.5 Fast",
    category: "video",
    badge: "FAST",
    description:
      "Lightricks LTX-2.5 Fast — rapid video generation with automatic duration support.",
    icon: "/icons/models/ltx.svg",
    parameters: {
      ...BASE_LTX_PARAMS,
      resolution: { type: "string", required: true, values: LTX_25_RESOLUTIONS },
      input_image: { type: "string" },
    },
  },

  // ── LTX-2.3 Pro ─────────────────────────────────────────────────────────────
  {
    key: "ltx-2-3-pro",
    displayName: "LTX 2.3 Pro",
    category: "video",
    badge: "PRO",
    description:
      "Lightricks LTX-2.3 Pro — first-to-last frame interpolation, extend, and retake.",
    icon: "/icons/models/ltx.svg",
    parameters: {
      ...BASE_LTX_PARAMS,
      resolution: { type: "string", required: true, values: LTX_23_RESOLUTIONS },
      // Both input_image + last_frame → isFrameModel = true → Start + End slots shown
      input_image: { type: "string" },
      last_frame: { type: "string" },
    },
  },

  // ── LTX-2.3 Fast ─────────────────────────────────────────────────────────────
  {
    key: "ltx-2-3-fast",
    displayName: "LTX 2.3 Fast",
    category: "video",
    badge: "FAST",
    description:
      "Lightricks LTX-2.3 Fast — speedy video generation with first-frame animation.",
    icon: "/icons/models/ltx.svg",
    parameters: {
      ...BASE_LTX_PARAMS,
      resolution: { type: "string", required: true, values: LTX_23_RESOLUTIONS },
      input_image: { type: "string" },
    },
  },
];
