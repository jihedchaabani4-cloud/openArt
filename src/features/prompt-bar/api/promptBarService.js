/**
 * Prompt Bar Service — Public Facade
 *
 * Provides ONE clean Public Service contract for interacting with Prompt Bar instances by identity.
 * Actions are dispatched directly to mounted instances via allowlisted semantic commands & template actions,
 * or queued in pendingActions when an instance is not yet mounted.
 *
 * Zero React, zero DOM (document/window), zero direct fetch calls.
 */

import { registry as defaultRegistry, identityKey } from "../store/registry.js";
import { enqueuePendingAction } from "../store/pendingActions.js";
import {
  isAllowedQueuedAction,
  executePublicAction,
  readStoreSnapshot,
} from "../store/publicActions.js";
import { fail, REASONS } from "../core/commandResult.js";

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

function isDeclaredPrimaryMedia(workflow, media) {
  const declaredPrimaryId =
    workflow.primary_media_id ??
    workflow.primaryMediaId ??
    workflow.metadata?.primaryMediaId ??
    null;
  if (declaredPrimaryId) return String(declaredPrimaryId) === mediaIdOf(media);
  return Boolean(media.is_primary || media.isPrimary);
}

/**
 * Preserves primary-only reuse when the cache has not yet attached the card media.
 */
export function withPrimaryMediaFallback(workflow, media) {
  if (!workflow || !media) return workflow;

  const primaryMedia = media.raw ?? media;
  const primaryMediaId = mediaIdOf(primaryMedia);
  if (!primaryMediaId || !isDeclaredPrimaryMedia(workflow, primaryMedia)) {
    return workflow;
  }

  const items = Array.isArray(workflow.items) ? workflow.items : [];
  if (items.some((item) => mediaIdOf(item) === primaryMediaId)) {
    return workflow;
  }

  return {
    ...workflow,
    items: [primaryMedia, ...items],
  };
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
 * @param {string[]} [options.allowedActions] - Optional extra template action names allowed when unmounted
 * @returns {object} Public service interface
 */
export function promptBarService(
  identity,
  {
    registry = defaultRegistry,
    storage,
    now,
    targetInstanceIdentity,
    resolveWorkflow,
    allowedActions,
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
      // Enforce public allowlist even before queueing for an unmounted instance
      if (!isAllowedQueuedAction(actionName, allowedActions)) {
        return fail(REASONS.INVALID_ARGUMENT, {
          actionName,
          message: `Action "${actionName}" is not part of the public PromptBar service API.`,
        });
      }
      enqueuePendingAction(
        targetIdentity,
        { actionName, args },
        { storage, now }
      );
      return fail(REASONS.NOT_MOUNTED, { queued: true });
    }

    return executePublicAction(resolution.store, actionName, args, { external: true });
  }

  return {
    /** Updates prompt text (triggers programmatic fill animation). */
    setPrompt(text) {
      return dispatchOrQueue("setPrompt", [text]);
    },

    /** Atomically switches generation mode and sub-mode. */
    switchMode(modeOrOptions, maybeSubMode) {
      return dispatchOrQueue(
        "switchMode",
        maybeSubMode !== undefined ? [modeOrOptions, maybeSubMode] : [modeOrOptions]
      );
    },

    /** Selects an eligible model and reconciles settings/media. */
    selectModel(modelId) {
      return dispatchOrQueue("selectModel", [modelId]);
    },

    /** Updates a validated non-media setting (rejects media keys). */
    setSetting(key, value) {
      return dispatchOrQueue("setSetting", [key, value]);
    },

    /** Attaches media to a composition slot. */
    attachMedia(args) {
      return dispatchOrQueue("attachMedia", [args]);
    },

    /** Removes media from a composition slot. */
    removeMedia(args) {
      return dispatchOrQueue("removeMedia", [args]);
    },

    /** Clears an entire media slot by role. */
    clearSlot(role) {
      return dispatchOrQueue("clearSlot", [role]);
    },

    /** Atomically swaps start and end keyframe slots. */
    swapFrames() {
      return dispatchOrQueue("swapFrames", []);
    },

    /** Atomically clears prompt and all media slots while keeping settings. */
    clearDraft() {
      return dispatchOrQueue("clearDraft", []);
    },

    /** Requests focus on the prompt input/editor. */
    focus() {
      return dispatchOrQueue("focus", []);
    },

    /** Resets the prompt bar state to defaults. */
    reset() {
      return dispatchOrQueue("reset", []);
    },

    /** Returns a read-only snapshot of the instance state. */
    getSnapshot() {
      const store = registry.get(targetIdentity);
      const snap = readStoreSnapshot(store);
      return {
        prompt: snap.prompt,
        selectedModelId: snap.selectedModelId,
        activeMode: snap.activeMode,
        activeSubMode: snap.activeSubMode,
        isGenerating: snap.isGenerating,
      };
    },

    /** Subscribes to mount/unmount and state changes for this Prompt Bar identity. */
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      if (checkProjectGuard()) return () => {};
      return registry.subscribe(targetIdentity, listener);
    },

    /**
     * Dispatches an allowlisted public command or template action by name.
     * Rejects private or non-allowlisted names.
     */
    run(actionName, ...args) {
      return dispatchOrQueue(actionName, args);
    },

    /** Template flow: attaches a reference item. */
    addReference(media) {
      return dispatchOrQueue("addReference", [media]);
    },

    /** Template flow: animates a media asset (video/frames + start frame). */
    animateMedia(media, options) {
      return dispatchOrQueue("animateMedia", options !== undefined ? [media, options] : [media]);
    },

    /** Template flow: applies historic generation settings. */
    applyGeneration(old) {
      return dispatchOrQueue("applyGeneration", [old]);
    },

    /** Template flow: restores saved generation config for a workflow's primary media. */
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
