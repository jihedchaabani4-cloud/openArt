/**
 * Prompt Bar Service — Public Facade
 *
 * Provides a unified public API for interacting with Prompt Bar instances by identity.
 * Actions are dispatched directly to mounted instances via pure store commands,
 * or queued in pendingActions when an instance is not yet mounted.
 *
 * Zero React, zero DOM (document/window), zero direct fetch calls.
 */

import { registry as defaultRegistry, identityKey } from "../store/registry.js";
import { enqueuePendingAction } from "../store/pendingActions.js";
import { ok, fail, REASONS } from "../core/commandResult.js";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function workflowIdOf(reference) {
  const value =
    reference?.workflow_id ??
    reference?.workflowId ??
    reference?.workflow?.id ??
    reference?.ref_media?.workflow_id ??
    reference?.ref_media?.workflowId ??
    null;
  return value ? String(value) : null;
}

function referenceRole(reference, fallback = "reference") {
  const inputType = reference?.input_type ?? reference?.inputType;
  if (inputType === "IMAGE_INPUT_TYPE_START_FRAME") return "start";
  if (inputType === "IMAGE_INPUT_TYPE_END_FRAME") return "end";
  return reference?.role ?? fallback;
}

function addWorkflowReference(references, reference, fallbackRole) {
  const workflowId = workflowIdOf(reference);
  if (!workflowId) return;
  const normalized = { workflow_id: workflowId, role: referenceRole(reference, fallbackRole) };
  if (!references.some((entry) => entry.workflow_id === normalized.workflow_id && entry.role === normalized.role)) {
    references.push(normalized);
  }
}

function mediaIdOf(media) {
  const id = media?.id ?? media?.media_id ?? media?.name ?? media?.asset_id ?? null;
  return id ? String(id) : null;
}

function resolvePrimaryMedia(workflow) {
  const items = Array.isArray(workflow?.items) ? workflow.items : [];
  const primaryId =
    workflow?.primary_media_id ??
    workflow?.primaryMediaId ??
    workflow?.metadata?.primaryMediaId ??
    null;
  const primary =
    items.find((item) => item?.is_primary || item?.isPrimary) ??
    items.find((item) => primaryId && mediaIdOf(item) === String(primaryId)) ??
    workflow?.primary_media ??
    items[0] ??
    null;
  return primary?.raw ?? primary;
}

function configFromPrimaryMedia(primary) {
  const directConfig =
    primary?.generationConfig ??
    primary?.generation_config ??
    primary?.mediaMetadata?.generationConfig ??
    null;
  if (directConfig && typeof directConfig === "object") return directConfig;

  const requestData = primary?.mediaMetadata?.requestData;
  if (requestData && typeof requestData === "object") {
    const settings = asObject(requestData.settings);
    return {
      ...settings,
      prompt: requestData.promptInputs?.[0]?.textInput ?? settings.prompt,
      model: requestData.modelId ?? requestData.modelName ?? settings.model,
      references: requestData.references ?? settings.references ?? settings.input_assets,
    };
  }

  const savedParams = asObject(primary?.params ?? primary?.parameters);
  return Object.keys(savedParams).length > 0 ? savedParams : null;
}

function savedParameters(config) {
  const parameters = {
    ...config,
    ...asObject(config.params),
    ...asObject(config.parameters),
  };
  for (const key of [
    "modelId", "model_id", "model_name", "model", "prompt", "mode", "subMode", "sub_mode",
    "parameters", "params", "references", "input_assets",
  ]) {
    delete parameters[key];
  }
  return parameters;
}

function savedWorkflowReferences(config, parameters) {
  const references = [];
  const configuredReferences =
    config.references ??
    config.input_assets ??
    config.parameters?.references ??
    config.parameters?.input_assets ??
    [];
  for (const reference of configuredReferences) {
    addWorkflowReference(references, reference, "reference");
  }
  addWorkflowReference(references, parameters.input_image ?? parameters.start_frame, "start");
  addWorkflowReference(references, parameters.last_frame ?? parameters.end_frame ?? parameters.last_image, "end");
  return references;
}

function savedGenerationMode(config, primary, parameters) {
  const explicitMode = String(config.mode ?? "").toLowerCase();
  const hasEndFrame = Boolean(parameters.last_frame ?? parameters.end_frame ?? parameters.last_image);
  const isVideo =
    explicitMode === "video" ||
    primary?.is_video === true ||
    primary?.isVideo === true ||
    Boolean(primary?.video ?? primary?.generatedVideo) ||
    hasEndFrame;
  return isVideo ? "video" : "image";
}

function savedGenerationSubMode(config, mode, parameters, references) {
  if (mode !== "video") return undefined;
  if (config.subMode ?? config.sub_mode) return config.subMode ?? config.sub_mode;
  return parameters.last_frame ?? parameters.end_frame ?? parameters.last_image
    ? "frames"
    : references.length > 0 ? "reference" : "frames";
}

export function hasGeneratedPrimaryMedia(workflow) {
  const primary = resolvePrimaryMedia(workflow);
  if (!primary) return false;
  const workflowType = String(workflow?.workflow_type ?? workflow?.workflowType ?? "").toUpperCase();
  return (
    workflowType.includes("GENERATION") ||
    String(primary?.workflowStepId ?? primary?.workflow_step_id ?? "").toUpperCase() === "GEN" ||
    Boolean(configFromPrimaryMedia(primary))
  );
}

/**
 * Converts saved primary-media config into the prompt-bar generation command.
 * References intentionally retain only workflow IDs; the backend resolves media.
 */
export function resolveReusableGeneration(workflow) {
  const primary = resolvePrimaryMedia(workflow);
  const config = configFromPrimaryMedia(primary);
  if (!primary || !config) return null;

  const modelId = config.modelId ?? config.model_id ?? config.model_name ?? config.model ?? null;
  if (!modelId) return null;

  const parameters = savedParameters(config);
  const references = savedWorkflowReferences(config, parameters);
  const mode = savedGenerationMode(config, primary, parameters);
  const subMode = savedGenerationSubMode(config, mode, parameters, references);

  return {
    mode,
    subMode,
    modelId: String(modelId),
    prompt: typeof config.prompt === "string" ? config.prompt : "",
    parameters,
    references,
    replaceParameters: true,
  };
}

/**
 * Creates an identity-scoped prompt bar service facade.
 *
 * @param {object|string} identity
 * @param {object} [options]
 * @param {object} [options.registry] - Custom store registry (defaults to global registry)
 * @param {object} [options.storage] - Custom storage for pending action queue
 * @param {number} [options.now] - Current timestamp override
 * @param {object} [options.targetInstanceIdentity] - For testing project mismatch
 * @param {(workflowId: string) => object|null} [options.resolveWorkflow] - Cache-backed workflow lookup
 * @returns {object} Service interface with action methods
 */
export function promptBarService(
  identity,
  {
    registry = defaultRegistry,
    storage,
    now,
    targetInstanceIdentity,
    resolveWorkflow,
  } = {}
) {
  if (!identity) {
    throw new Error("promptBarService: 'identity' is required.");
  }

  const cleanIdentity =
    typeof identity === "string" ? { templateId: identity } : { ...identity };

  const targetIdentity = targetInstanceIdentity || cleanIdentity;
  identityKey(targetIdentity);

  function checkProjectGuard() {
    const requestedProject = cleanIdentity.projectId;
    const targetProject = targetIdentity.projectId;

    if (
      requestedProject &&
      targetProject &&
      requestedProject !== "global" &&
      targetProject !== "global" &&
      requestedProject !== targetProject
    ) {
      return fail(REASONS.PROJECT_MISMATCH, {
        requestedProject,
        targetProject,
      });
    }
    return null;
  }

  function resolveMountedStore() {
    const guardFail = checkProjectGuard();
    if (guardFail) {
      return { ok: false, error: guardFail };
    }

    const isMounted = registry.isMounted(targetIdentity);
    if (!isMounted) {
      return { ok: false, notMounted: true };
    }

    const store = registry.get(targetIdentity);
    if (!store || typeof store.getState !== "function") {
      return { ok: false, notMounted: true };
    }

    return { ok: true, store };
  }

  function dispatchOrQueue(actionName, args = []) {
    const resolution = resolveMountedStore();

    if (!resolution.ok) {
      if (resolution.error) {
        return resolution.error;
      }
      // Not mounted: enqueue action and return canonical fail
      enqueuePendingAction(
        targetIdentity,
        { actionName, args },
        { storage, now }
      );
      return fail(REASONS.NOT_MOUNTED, { queued: true });
    }

    const store = resolution.store;
    const state = store.getState();

    if (actionName === "setPrompt") {
      state.setPrompt(args[0]);
      return ok({ prompt: args[0] });
    }

    if (actionName === "reset") {
      if (typeof state.resetStoreState === "function") {
        state.resetStoreState();
      } else if (typeof state.reset === "function") {
        state.reset();
      }
      return ok();
    }

    if (actionName === "focus") {
      if (typeof state.requestFocus === "function") {
        state.requestFocus();
      }
      return ok();
    }

    if (typeof state[actionName] === "function") {
      const result = state[actionName](...args);
      return result !== undefined ? result : ok();
    }

    return fail(REASONS.INVALID_ARGUMENT, {
      message: `Action "${actionName}" is not available on this store.`,
    });
  }

  return {
    /**
     * Updates prompt text.
     * @param {string} text
     * @returns {object} CommandResult
     */
    setPrompt(text) {
      return dispatchOrQueue("setPrompt", [text]);
    },

    /**
     * Requests focus on the prompt input/editor.
     * @returns {object} CommandResult
     */
    focus() {
      return dispatchOrQueue("focus", []);
    },

    /**
     * Resets the prompt bar state to defaults.
     * @returns {object} CommandResult
     */
    reset() {
      return dispatchOrQueue("reset", []);
    },

    /**
     * Returns a read-only copy of the instance state.
     * @returns {{ prompt: string, selectedModelId: string|null, activeMode: string, activeSubMode: string, isGenerating: boolean }}
     */
    getSnapshot() {
      const store = registry.get(targetIdentity);
      if (store && typeof store.getState === "function") {
        const s = store.getState();
        return {
          prompt: s.prompt || "",
          selectedModelId: s.selectedModelId || null,
          activeMode: s.activeMode || "image",
          activeSubMode: s.activeSubMode || "frames",
          isGenerating: Boolean(s.isGenerating),
        };
      }
      return {
        prompt: "",
        selectedModelId: null,
        activeMode: "image",
        activeSubMode: "frames",
        isGenerating: false,
      };
    },

    /**
     * Dispatches an arbitrary action or command by name.
     * @param {string} actionName
     * @param  {...any} args
     * @returns {object} CommandResult
     */
    run(actionName, ...args) {
      return dispatchOrQueue(actionName, args);
    },

    /**
     * Attaches a reference item.
     * @param {object} media
     * @returns {object} CommandResult
     */
    addReference(media) {
      return dispatchOrQueue("addReference", [media]);
    },

    /**
     * Animates a media asset (transitions to video/frames and sets input_image).
     * @param {object} media
     * @param {object} [options]
     * @returns {object} CommandResult
     */
    animateMedia(media, options) {
      return dispatchOrQueue("animateMedia", options !== undefined ? [media, options] : [media]);
    },

    /**
     * Reuses historic generation settings.
     * @param {object} old
     * @returns {object} CommandResult
     */
    applyGeneration(old) {
      return dispatchOrQueue("applyGeneration", [old]);
    },

    /**
     * Restores the saved generation config for a workflow's primary media.
     * The resolver is supplied by the UI and must read its current project cache.
     *
     * @param {string} workflowId
     * @returns {object} CommandResult
     */
    reuseGeneration(workflowId) {
      if (!workflowId || typeof resolveWorkflow !== "function") {
        return fail(REASONS.INVALID_ARGUMENT, { message: "workflowId and resolveWorkflow are required." });
      }
      const generation = resolveReusableGeneration(resolveWorkflow(workflowId));
      if (!generation) {
        return fail(REASONS.INVALID_ARGUMENT, { message: "Primary media has no reusable generation config." });
      }
      return dispatchOrQueue("applyGeneration", [generation]);
    },
  };
}
