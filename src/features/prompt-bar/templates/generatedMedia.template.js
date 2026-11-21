/**
 * Generated Media Template Definition
 *
 * Declarative template for the Generated Media PromptBar:
 *   - COMPOSITION_REQUIREMENTS & getSlots
 *   - isFrameModel / isReferenceModel
 *   - filterEligibleModels
 *   - resolveParameterMapping
 *   - createActions (addReference, animateMedia, applyGeneration) composed via applyComposite
 *   - persistRoutes, layout & features
 */

import { defineTemplate } from "../core/templateContract.js";
import { applyComposite } from "../core/composite.js";
import { switchMode } from "../store/commands/switchMode.js";
import { selectModel } from "../store/commands/selectModel.js";
import { attachMedia } from "../store/commands/attachMedia.js";
import { isPersistableMedia, sameAsset } from "../core/mediaRef.js";
import { ok, fail, REASONS } from "../core/commandResult.js";
import { initializeValues } from "../core/parameterState.js";
import { validateParameter } from "../core/reconciliation.js";
import { PARAM, isMediaParamKey } from "../core/parameterKeys.js";

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
 * @param {object}  [parameterValues] - optional parameterValues for dynamic image eligibility
 * @returns {object[]}
 */
export function filterEligibleModels(models = [], mode = "image", subMode = null, parameterValues = {}) {
  const list = Array.isArray(models) ? models : Object.values(models || {});

  if (mode === "image") {
    const imageDomainModels = list.filter((m) => m.domain === "image" || m.category === "image");
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
    return imageDomainModels;
  }

  if (mode === "video") {
    const videoDomainModels = list.filter((m) => m.domain === "video" || m.category === "video");

    if (subMode === "frames") {
      return videoDomainModels.filter(isFrameModel);
    }

    if (subMode === "reference") {
      return videoDomainModels.filter(isReferenceModel);
    }

    return videoDomainModels;
  }

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
  if (Array.isArray(modeSlots)) return modeSlots;
  const effectiveSubMode = subMode || (mode === "video" ? "frames" : subMode);
  return modeSlots[effectiveSubMode] ?? [];
}

// ── 4. createActions ──────────────────────────────────────────────────────────

/**
 * Creates declarative template flows composed via applyComposite over private core commands.
 *
 * @param {object} core - Store handle ({ getState, setState } or { store }) provided by createPromptBarStore
 * @returns {object} { addReference, animateMedia, applyGeneration }
 */
export function createActions(core) {
  if (!core) {
    throw new Error("createActions requires core");
  }

  let store = null;
  if (typeof core.setState === "function" && typeof core.getState === "function") {
    store = core;
  } else if (core.store && typeof core.store.setState === "function") {
    store = core.store;
  }

  const getState = typeof core.getState === "function" ? core.getState : () => core;

  return {
    /**
     * Attaches a reference media item.
     * Fails with NO_SLOT_FOR_ROLE if the current mode/sub-mode or model has no reference slot.
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
        return applyComposite(store, [
          (draft) => attachMedia(draft, { role: "reference", value: media }, { template: generatedMediaTemplate }),
        ]);
      }

      return fail(REASONS.INVALID_ARGUMENT);
    },

    /**
     * Transitions to video/frames, clears old media, attaches media as start frame, and handles prompt.
     * Applied atomically as ONE patch with a single notification.
     */
    animateMedia(media, options = {}) {
      if (!media) {
        return fail(REASONS.INVALID_ARGUMENT, { message: "media is required for animateMedia." });
      }
      const opts = options || {};

      const steps = [
        (draft) =>
          switchMode(
            draft,
            { mode: "video", subMode: "frames" },
            { template: generatedMediaTemplate }
          ),
        (draft) =>
          attachMedia(
            draft,
            { role: "start", value: media },
            { template: generatedMediaTemplate }
          ),
        (draft) => {
          const mode = opts.promptMode || "default";
          let nextPrompt = draft.prompt;
          let changed = false;
          if (mode === "overwrite") {
            nextPrompt = opts.prompt ?? "";
            changed = true;
          } else if (mode === "append") {
            nextPrompt = draft.prompt
              ? `${draft.prompt} ${opts.prompt || ""}`
              : (opts.prompt || "");
            changed = Boolean(opts.prompt);
          } else if (mode === "if-empty") {
            if (!draft.prompt && opts.prompt) {
              nextPrompt = opts.prompt;
              changed = true;
            }
          }
          return ok(
            changed
              ? { prompt: nextPrompt, promptFillNonce: (draft.promptFillNonce || 0) + 1 }
              : { prompt: nextPrompt }
          );
        },
      ];

      if (store) {
        return applyComposite(store, steps);
      }

      return fail(REASONS.INVALID_ARGUMENT, { message: "No store available for animateMedia." });
    },

    /**
     * Applies historic generation settings (mode, subMode, modelId, prompt, parameters, references).
     * Bumps promptFillNonce, validates settings via validateParameter, and attaches media/references
     * through attachMedia & quota rules atomically.
     */
    applyGeneration(old) {
      if (!old || typeof old !== "object") {
        return fail(REASONS.INVALID_ARGUMENT, { message: "Invalid generation object." });
      }

      const { mode, subMode, modelId, prompt, parameters, references, replaceParameters = false } = old;
      const state = getState();
      const modelsMap = state.modelsMap || {};
      const targetModel = modelsMap[modelId];

      if (!targetModel) {
        return fail(REASONS.UNKNOWN_MODEL, { modelId });
      }

      const steps = [
        // 1. Switch mode if changed
        (draft) => {
          if (mode && (mode !== draft.activeMode || (subMode && subMode !== draft.activeSubMode))) {
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
        // 3. Set prompt and bump promptFillNonce so programmatic fill animates once
        (draft) => {
          if (typeof prompt === "string") {
            return ok({
              prompt,
              promptFillNonce: (draft.promptFillNonce || 0) + 1,
            });
          }
          return ok();
        },
        // 4. Filter & validate non-media declared parameters via validateParameter
        (draft) => {
          const declaredParams = targetModel.parameters || {};
          const nextParams = replaceParameters
            ? initializeValues(declaredParams)
            : { ...draft.parameterValues };

          if (replaceParameters) {
            for (const [k, def] of Object.entries(declaredParams)) {
              if (isMediaParamKey(k, def)) {
                delete nextParams[k];
              }
            }
          }

          if (parameters && typeof parameters === "object") {
            for (const [key, value] of Object.entries(parameters)) {
              const paramDef = declaredParams[key];
              if (!paramDef) continue;
              if (isMediaParamKey(key, paramDef)) continue;

              const validation = validateParameter(paramDef, value);
              if (validation.valid) {
                nextParams[key] = value;
              }
            }
          }

          return ok({ parameterValues: nextParams });
        },
        // 5. Attach media parameters & references through attachMedia (normalizes & enforces quota/type/dup rules)
        (draft) => {
          const declaredParams = targetModel.parameters || {};
          const activeSlots = getSlots(draft.activeMode, draft.activeSubMode);
          let curDraft = {
            ...draft,
            parameterValues: { ...(draft.parameterValues || {}) },
          };

          // 5a. Media keys supplied inside `parameters`
          if (parameters && typeof parameters === "object") {
            for (const [key, value] of Object.entries(parameters)) {
              const paramDef = declaredParams[key];
              if (!paramDef || !isMediaParamKey(key, paramDef)) continue;

              const matchingSlot = activeSlots.find(
                (s) => resolveParameterMapping(targetModel, s.role) === key
              );
              if (!matchingSlot) continue;

              const items = Array.isArray(value) ? value : value ? [value] : [];
              for (const item of items) {
                if (!isPersistableMedia(item)) continue;
                const attachRes = attachMedia(
                  curDraft,
                  { role: matchingSlot.role, value: item },
                  { template: generatedMediaTemplate, modelsMap }
                );
                if (attachRes.ok && attachRes.patch?.parameterValues) {
                  curDraft = {
                    ...curDraft,
                    parameterValues: attachRes.patch.parameterValues,
                  };
                }
              }
            }
          }

          // 5b. Explicit `references` list
          if (Array.isArray(references)) {
            for (const reference of references) {
              if (!isPersistableMedia(reference)) continue;
              const role = reference.role || "reference";
              const targetKey = resolveParameterMapping(targetModel, role);
              if (targetKey) {
                const existingInSlot = curDraft.parameterValues?.[targetKey];
                const alreadyAttached = Array.isArray(existingInSlot)
                  ? existingInSlot.some((item) => sameAsset(item, reference))
                  : Boolean(existingInSlot && sameAsset(existingInSlot, reference));
                if (alreadyAttached) continue;
              }
              const attachRes = attachMedia(
                curDraft,
                { role, value: reference },
                { template: generatedMediaTemplate, modelsMap }
              );
              if (attachRes.ok && attachRes.patch?.parameterValues) {
                curDraft = {
                  ...curDraft,
                  parameterValues: attachRes.patch.parameterValues,
                };
              }
            }
          }

          return ok({ parameterValues: curDraft.parameterValues });
        },
      ];

      if (store) {
        return applyComposite(store, steps);
      }

      return fail(REASONS.INVALID_ARGUMENT, { message: "No store available for applyGeneration." });
    },
  };
}

// ── 5. generatedMediaTemplate ────────────────────────────────────────────────
export const generatedMediaTemplate = defineTemplate({
  id: "generated-media",
  persistRoutes: [
    "/cinema-studio/:projectId/assets",
    "/cinema-studio/:projectId/collection/*",
    "/cinema-studio/:projectId/collections/*",
    "/cinema-studio/new",
    "/cinema-studio/test/prompt-bar-compare",
  ],
  layout: {
    showPromptInput: true,
    showModelSelector: true,
    showParameterDrawer: true,
    showAttachmentBar: true,
    showModeSelector: true,
  },
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
