/**
 * Prompt Bar Store — Public Action Allowlist & Dispatcher
 *
 * Single source of truth defining which commands and template actions are part of
 * the sealed Public Service boundary. Used by promptBarService, pendingActions,
 * and usePromptBarService.
 * Zero React, zero DOM.
 */

import { ok, fail, REASONS } from "../core/commandResult.js";

/** Explicit allowlist of public core commands executable via service.run() and pendingActions. */
export const PUBLIC_COMMAND_ALLOWLIST = Object.freeze(
  new Set([
    "setPrompt",
    "setPromptExternal",
    "switchMode",
    "selectModel",
    "setSetting",
    "attachMedia",
    "removeMedia",
    "clearSlot",
    "swapFrames",
    "clearDraft",
    "reset",
    "focus",
    "setIsGenerating",
  ])
);

/** Template actions allowed to be queued when an instance is not yet mounted. */
export const KNOWN_TEMPLATE_ACTIONS = Object.freeze(
  new Set([
    "addReference",
    "animateMedia",
    "applyGeneration",
    "reuseGeneration",
  ])
);

/**
 * Checks whether an action name is allowed on a mounted store instance.
 *
 * @param {object} store
 * @param {string} actionName
 * @returns {boolean}
 */
export function isAllowedPublicAction(store, actionName) {
  if (typeof actionName !== "string" || !actionName) return false;
  if (PUBLIC_COMMAND_ALLOWLIST.has(actionName)) return true;
  const templateActions = store?.actions;
  if (templateActions && typeof templateActions[actionName] === "function") {
    return true;
  }
  if (KNOWN_TEMPLATE_ACTIONS.has(actionName)) {
    const state = typeof store?.getState === "function" ? store.getState() : null;
    if (state && typeof state[actionName] === "function") {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether an action name is allowed to be queued for an unmounted instance.
 *
 * @param {string} actionName
 * @param {string[]} [extraAllowed=[]]
 * @returns {boolean}
 */
export function isAllowedQueuedAction(actionName, extraAllowed = []) {
  if (typeof actionName !== "string" || !actionName) return false;
  if (PUBLIC_COMMAND_ALLOWLIST.has(actionName)) return true;
  if (KNOWN_TEMPLATE_ACTIONS.has(actionName)) return true;
  if (Array.isArray(extraAllowed) && extraAllowed.includes(actionName)) return true;
  return false;
}

/**
 * Executes an allowlisted public command or template action on a mounted store.
 *
 * @param {object} store
 * @param {string} actionName
 * @param {any[]} [args=[]]
 * @param {object} [options]
 * @param {boolean} [options.external=false] - When true, setPrompt uses setPromptExternal (ShineText fill nonce)
 * @returns {import("../core/commandResult.js").CommandResult}
 */
export function executePublicAction(store, actionName, args = [], { external = false } = {}) {
  if (!store || typeof store.getState !== "function") {
    return fail(REASONS.NOT_MOUNTED);
  }

  if (!isAllowedPublicAction(store, actionName)) {
    return fail(REASONS.INVALID_ARGUMENT, {
      actionName,
      message: `Action "${actionName}" is not part of the public PromptBar service API.`,
    });
  }

  const state = store.getState();

  if (actionName === "setPrompt") {
    if (external && typeof state.setPromptExternal === "function") {
      state.setPromptExternal(args[0]);
    } else if (typeof state.setPrompt === "function") {
      state.setPrompt(args[0]);
    }
    return ok({ prompt: args[0] });
  }

  if (actionName === "setPromptExternal") {
    if (typeof state.setPromptExternal === "function") {
      state.setPromptExternal(args[0]);
    }
    return ok({ prompt: args[0] });
  }

  if (actionName === "focus") {
    if (typeof state.requestFocus === "function") {
      state.requestFocus();
    }
    return ok();
  }

  if (actionName === "reset") {
    if (typeof state.reset === "function") {
      state.reset();
    }
    return ok();
  }

  const templateActions = store.actions;
  if (templateActions && typeof templateActions[actionName] === "function") {
    const result = templateActions[actionName](...args);
    return result !== undefined ? result : ok();
  }

  if (typeof state[actionName] === "function") {
    const result = state[actionName](...args);
    return result !== undefined ? result : ok();
  }

  return fail(REASONS.INVALID_ARGUMENT, {
    actionName,
    message: `Action "${actionName}" is not available on this store.`,
  });
}

/**
 * Builds a read-only state snapshot from a store instance.
 *
 * @param {object|null} store
 * @returns {{ prompt: string, selectedModelId: string|null, activeMode: string, activeSubMode: string, isGenerating: boolean, parameterValues: Record<string, any> }}
 */
export function readStoreSnapshot(store) {
  if (store && typeof store.getState === "function") {
    const s = store.getState();
    return {
      prompt: s.prompt || "",
      selectedModelId: s.selectedModelId || null,
      activeMode: s.activeMode || "image",
      activeSubMode: s.activeSubMode || "frames",
      isGenerating: Boolean(s.isGenerating),
      parameterValues: { ...(s.parameterValues || {}) },
    };
  }
  return {
    prompt: "",
    selectedModelId: null,
    activeMode: "image",
    activeSubMode: "frames",
    isGenerating: false,
    parameterValues: {},
  };
}

/**
 * Creates a clean Public Service facade bound directly to a mounted store instance
 * (used inside React UI via usePromptBarService).
 *
 * @param {object} store
 * @returns {object}
 */
export function createBoundPromptBarService(store) {
  const service = {
    setPrompt: (text) => executePublicAction(store, "setPrompt", [text], { external: false }),
    setPromptExternal: (text) => executePublicAction(store, "setPromptExternal", [text], { external: true }),
    switchMode: (modeOrOptions, maybeSubMode) =>
      executePublicAction(
        store,
        "switchMode",
        maybeSubMode !== undefined ? [modeOrOptions, maybeSubMode] : [modeOrOptions]
      ),
    selectModel: (modelId) => executePublicAction(store, "selectModel", [modelId]),
    setSetting: (key, value) => executePublicAction(store, "setSetting", [key, value]),
    attachMedia: (args) => executePublicAction(store, "attachMedia", [args]),
    removeMedia: (args) => executePublicAction(store, "removeMedia", [args]),
    clearSlot: (role) => executePublicAction(store, "clearSlot", [role]),
    swapFrames: () => executePublicAction(store, "swapFrames", []),
    clearDraft: () => executePublicAction(store, "clearDraft", []),
    reset: () => executePublicAction(store, "reset", []),
    focus: () => executePublicAction(store, "focus", []),
    setIsGenerating: (flag) => executePublicAction(store, "setIsGenerating", [flag]),
    setModels: (models, rawModelsMap) => store.getState().setModels(models, rawModelsMap),
    beginSubmit: () => store.getState().beginSubmit(),
    endSubmit: (token) => store.getState().endSubmit(token),
    serialize: () => store.getState().serialize(),
    getSnapshot: () => readStoreSnapshot(store),
    run: (actionName, ...args) => executePublicAction(store, actionName, args, { external: false }),
  };

  // Expose template actions automatically on the bound service facade
  const templateActions = store?.actions || {};
  for (const actionName of Object.keys(templateActions)) {
    if (typeof templateActions[actionName] === "function" && !(actionName in service)) {
      service[actionName] = (...args) => executePublicAction(store, actionName, args, { external: true });
    }
  }

  return service;
}
