/**
 * Generated Media Template Definition
 *
 * Composes generatedMediaType and generatedMedia.config into the canonical
 * TemplateDefinition contract without mutating legacy config sources.
 */

import { defineTemplate } from "../core/templateContract.js";
import { generatedMediaType } from "../composition/generatedMedia.type.js";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../features/generated-media/generatedMedia.config.js";
import { applyComposite } from "../core/composite.js";
import { switchMode } from "../store/commands/switchMode.js";
import { selectModel } from "../store/commands/selectModel.js";
import { attachMedia } from "../store/commands/attachMedia.js";
import { isPersistableMedia } from "../core/mediaRef.js";
import { ok, fail, REASONS } from "../core/commandResult.js";

/** Resolves composition slot definitions for generated media modes and sub-modes. */
function getSlots(mode, subMode) {
  const req = COMPOSITION_REQUIREMENTS;
  const modeSlots = req?.[mode];
  if (!modeSlots) return [];
  return Array.isArray(modeSlots) ? modeSlots : (modeSlots[subMode] ?? []);
}

/**
 * Creates actions for the generated media template.
 *
 * @param {object} core - Command wrappers and state accessors from the store
 * @returns {object} { addReference, animateMedia, applyGeneration }
 */
function createActions(core) {
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
          const mode = options.promptMode || "default";
          let nextPrompt = draft.prompt;
          if (mode === "overwrite") {
            nextPrompt = options.prompt ?? "";
          } else if (mode === "append") {
            nextPrompt = draft.prompt
              ? `${draft.prompt} ${options.prompt || ""}`
              : (options.prompt || "");
          } else if (mode === "if-empty") {
            if (!draft.prompt && options.prompt) {
              nextPrompt = options.prompt;
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

