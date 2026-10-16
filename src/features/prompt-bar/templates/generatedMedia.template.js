/**
 * Generated Media Template Definition
 *
 * Source of truth for the Generated Media feature rules (P7 W3):
 *   - COMPOSITION_REQUIREMENTS
 *   - isFrameModel / isReferenceModel
 *   - filterEligibleModels
 *   - resolveParameterMapping
 *   - createActions (addReference, animateMedia, applyGeneration)
 *   - persistRoutes
 *   - layout & features
 */

import { defineTemplate } from "../core/templateContract.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { applyComposite } from "../core/composite.js";
import { switchMode } from "../store/commands/switchMode.js";
import { selectModel } from "../store/commands/selectModel.js";
import { attachMedia } from "../store/commands/attachMedia.js";
import { isPersistableMedia } from "../core/mediaRef.js";
import { ok, fail, REASONS } from "../core/commandResult.js";

import { PARAM } from "../core/parameterKeys.js";

// ── 1. COMPOSITION_REQUIREMENTS ─────────────────────────────────────────────
//
// Flat map: mode → subMode → SlotDef[]
// Each SlotDef is { role, label, accepts }.
// Role is a UI identifier ONLY — never a backend parameter key.
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
  const hasStart = Boolean(params[PARAM.INPUT_IMAGE] || params[PARAM.START_FRAME] || model.capabilities?.[PARAM.INPUT_IMAGE]);
  const hasEnd = Boolean(params[PARAM.LAST_FRAME] || params.last_image || params[PARAM.END_FRAME] || model.capabilities?.[PARAM.LAST_FRAME]);
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
  if (params[PARAM.IMAGES] || params[PARAM.REFERENCE_IMAGES]) return true;
  // In image domain, legacy img2img models with single input_image also accept an image input
  if ((model.domain === "image" || model.category === "image") && (params[PARAM.INPUT_IMAGE] || model.capabilities?.[PARAM.INPUT_IMAGE])) {
    return true;
  }
  return false;
}

// ── 2. filterEligibleModels ───────────────────────────────────────────────────

/**
 * Returns the subset of `models` that are capable of the given mode+subMode.
 *
 * @param {object[]} models - full model list from backend
 * @param {string}  mode - "image" | "video"
 * @param {string}  [subMode] - "frames" | "reference"
 * @param {object}  [parameterValues] - current store parameterValues, used for Image mode dynamic eligibility
 * @returns {object[]}
 */
export function filterEligibleModels(models = [], mode = "image", subMode = null, parameterValues = {}) {
  const list = Array.isArray(models) ? models : Object.values(models || {});

  if (mode === "image") {
    const imageDomainModels = list.filter((m) => m.domain === "image" || m.category === "image");
    // Dynamic eligibility: if references are currently in the store, narrow to reference-capable models
    const hasReference = Boolean(
      (Array.isArray(parameterValues?.[PARAM.IMAGES]) && parameterValues[PARAM.IMAGES].length > 0) ||
      (Array.isArray(parameterValues?.[PARAM.REFERENCE_IMAGES]) && parameterValues[PARAM.REFERENCE_IMAGES].length > 0) ||
      parameterValues?.[PARAM.IMAGES] ||
      parameterValues?.[PARAM.REFERENCE_IMAGES] ||
      parameterValues?.[PARAM.INPUT_IMAGE]
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

/**
 * Maps a UI slot role name to its backend parameter key for the current model.
 *
 * @param {object} model - currently selected model
 * @param {string} role - UI slot role ("start", "end", "reference")
 * @returns {string|null} - backend parameter key, or null if unsupported
 */
export function resolveParameterMapping(model, role) {
  const params = model?.parameters || {};

  if (role === "start") {
    if (params[PARAM.INPUT_IMAGE]) return PARAM.INPUT_IMAGE;
    if (params[PARAM.START_FRAME]) return PARAM.START_FRAME;
    return PARAM.INPUT_IMAGE;
  }

  if (role === "end") {
    if (params[PARAM.LAST_FRAME]) return PARAM.LAST_FRAME;
    if (params.last_image) return "last_image";
    if (params[PARAM.END_FRAME]) return PARAM.END_FRAME;
    return null;
  }

  if (role === "reference") {
    if (params[PARAM.IMAGES]) return PARAM.IMAGES;
    if (params[PARAM.REFERENCE_IMAGES]) return PARAM.REFERENCE_IMAGES;
    if (params[PARAM.INPUT_IMAGE] && (model?.domain === "image" || model?.category === "image")) {
      return PARAM.INPUT_IMAGE;
    }
    return null;
  }

  return null;
}

/** Resolves composition slot definitions for generated media modes and sub-modes. */
export function getSlots(mode, subMode) {
  const req = COMPOSITION_REQUIREMENTS;
  const modeSlots = req?.[mode];
  if (!modeSlots) return [];
  return Array.isArray(modeSlots) ? modeSlots : (modeSlots[subMode] ?? []);
}

// ── 4. createActions ──────────────────────────────────────────────────────────

/**
 * Creates actions for the generated media template.
 *
 * @param {object} core - Command wrappers and state accessors from the store
 * @returns {object} { addReference, animateMedia, applyGeneration }
 */
export function createActions(core) {
  if (!core) {
    throw new Error("createActions requires core");
  }

  // Resolve store for composite execution
  let store = null;
  if (typeof core.setState === "function" && typeof core.getState === "function") {
    store = core;
  } else if (core.store && typeof core.store.setState === "function") {
    store = core.store;
  } else if (core._store && typeof core._store.setState === "function") {
    store = core._store;
  }

  const getState = typeof core.getState === "function" ? core.getState : () => core;

  return {
    /**
     * Attaches a reference media item.
     * If the current mode/sub-mode has no reference slot, fails with NO_SLOT_FOR_ROLE (no silent mode change).
     *
     * @param {object} media
     * @returns {object} CommandResult
     */
    addReference(media) {
      if (!media) {
        return fail(REASONS.INVALID_ARGUMENT, { message: "media is required for addReference." });
      }

      const state = getState();
      const slots = getSlots(state.activeMode, state.activeSubMode);
      const hasRefSlot = (slots || []).some((s) => s.role === "reference");

      if (!hasRefSlot) {
        return fail(REASONS.NO_SLOT_FOR_ROLE, {
          role: "reference",
          mode: state.activeMode,
          subMode: state.activeSubMode,
        });
      }

      if (typeof core.attachMedia === "function") {
        return core.attachMedia({ role: "reference", value: media });
      }

      if (store) {
        const steps = [
          (draft) => attachMedia(draft, { role: "reference", value: media }, { template: generatedMediaTemplate }),
        ];
        return applyComposite(store, steps);
      }

      return fail(REASONS.INVALID_ARGUMENT);
    },

    /**
     * Transitions to video/frames, clears old media, attaches media as start frame, and sets prompt.
     * Applied atomically as ONE patch with single notification.
     *
     * @param {object} media
     * @param {object} [options]
     * @param {string} [options.prompt]
     * @param {"default"|"overwrite"|"append"|"if-empty"} [options.promptMode="default"]
     * @returns {object} CommandResult
     */
    animateMedia(media, options = {}) {
      if (!media) {
        return fail(REASONS.INVALID_ARGUMENT, { message: "media is required for animateMedia." });
      }
      const opts = options || {};

      const steps = [
        // 1. Switch to video / frames
        (draft) => {
          return switchMode(
            draft,
            { mode: "video", subMode: "frames" },
            { template: generatedMediaTemplate }
          );
        },
        // 2. Attach media as start frame
        (draft) => {
          return attachMedia(
            draft,
            { role: "start", value: media },
            { template: generatedMediaTemplate }
          );
        },
        // 3. Prompt handling per V4 semantics & options.promptMode
        (draft) => {
          const mode = opts.promptMode || "default";
          let nextPrompt = draft.prompt;
          if (mode === "overwrite") {
            nextPrompt = opts.prompt ?? "";
          } else if (mode === "append") {
            nextPrompt = draft.prompt
              ? `${draft.prompt} ${opts.prompt || ""}`
              : (opts.prompt || "");
          } else if (mode === "if-empty") {
            if (!draft.prompt && opts.prompt) {
              nextPrompt = opts.prompt;
            }
          }
          return ok({ prompt: nextPrompt });
        },
      ];

      if (store) {
        return applyComposite(store, steps);
      }

      return fail(REASONS.INVALID_ARGUMENT, { message: "No store available for animateMedia." });
    },

    /**
     * Applies old generation settings (mode, subMode, modelId, prompt, parameters).
     * Filters parameters through the model's declared schema and validates media.
     *
     * @param {object} old - { mode, subMode, modelId, prompt, parameters }
     * @returns {object} CommandResult
     */
    applyGeneration(old) {
      if (!old || typeof old !== "object") {
        return fail(REASONS.INVALID_ARGUMENT, { message: "Invalid generation object." });
      }

      const { mode, subMode, modelId, prompt, parameters } = old;
      const state = getState();
      const modelsMap = state.modelsMap || {};
      const targetModel = modelsMap[modelId];

      if (!targetModel) {
        return fail(REASONS.UNKNOWN_MODEL, { modelId });
      }

      const steps = [
        // 1. Switch mode if changed
        (draft) => {
          if (mode && (mode !== draft.activeMode || subMode !== draft.activeSubMode)) {
            return switchMode(
              draft,
              { mode, subMode },
              { template: generatedMediaTemplate, modelsMap }
            );
          }
          return ok();
        },
        // 2. Select model if changed
        (draft) => {
          if (modelId !== draft.selectedModelId) {
            return selectModel(
              draft,
              { modelId },
              { template: generatedMediaTemplate, modelsMap }
            );
          }
          return ok();
        },
        // 3. Set prompt
        (draft) => {
          return ok({ prompt: typeof prompt === "string" ? prompt : draft.prompt });
        },
        // 4. Filter declared parameters and validate media values
        (draft) => {
          const declaredParams = targetModel.parameters || {};
          const nextParams = { ...draft.parameterValues };

          if (parameters && typeof parameters === "object") {
            for (const [key, value] of Object.entries(parameters)) {
              if (!declaredParams[key]) continue;

              const paramDef = declaredParams[key];
              const isMediaParam =
                paramDef?.type === "image" ||
                paramDef?.type === "image[]" ||
                paramDef?.type === "video" ||
                paramDef?.type === "video[]";

              if (isMediaParam) {
                if (Array.isArray(value)) {
                  const validItems = value.filter((v) => isPersistableMedia(v));
                  nextParams[key] = validItems;
                } else if (value && isPersistableMedia(value)) {
                  nextParams[key] = value;
                }
              } else {
                nextParams[key] = value;
              }
            }
          }

          return ok({ parameterValues: nextParams });
        },
      ];

      if (store) {
        return applyComposite(store, steps);
      }

      return fail(REASONS.INVALID_ARGUMENT, { message: "No store available for applyGeneration." });
    },
  };
}

// ── 5. generatedMediaType (Legacy shim support) ──────────────────────────────
export const generatedMediaType = createPromptBarType({
  id: "generated-media",
  defaultModelId: null,
  supportedDomains: ["image", "video"],
  layout: {
    showPromptInput: true,
    showModelSelector: true,
    showParameterDrawer: true,
    showAttachmentBar: true,
    showModeSelector: true,
  },
  modes: {
    image: {
      domain: "image",
      label: "Image",
      referenceSlots: [
        { role: "reference", label: "Reference", accepts: ["image"], maxCount: 5 },
      ],
    },
    video: {
      domain: "video",
      label: "Video",
      subModes: {
        frames: {
          label: "Frames",
          referenceSlots: [
            { role: "start", label: "Start", accepts: ["image"], maxCount: 1 },
            { role: "end",   label: "End",   accepts: ["image"], maxCount: 1 },
          ],
        },
        reference: {
          label: "Reference",
          referenceSlots: [
            { role: "reference", label: "Reference", accepts: ["image", "video"], maxCount: 5 },
          ],
        },
      },
    },
  },
});

// ── 6. generatedMediaTemplate ────────────────────────────────────────────────
export const generatedMediaTemplate = defineTemplate({
  id: generatedMediaType.id,
  persistRoutes: [
    "/cinema-studio/:projectId/assets",
    "/cinema-studio/:projectId/collection/*",
    "/cinema-studio/:projectId/collections/*",
    "/cinema-studio/new",
    "/cinema-studio/test/prompt-bar-compare",
  ],
  layout: generatedMediaType.layout,
  features: {
    models: true,
    modes: true,
  },
  defaultState: {
    activeMode: "image",
    activeSubMode: "frames",
  },
  getSlots,
  filterEligibleModels,
  resolveParameterMapping,
  createActions,
});
