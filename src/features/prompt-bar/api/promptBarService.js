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

/**
 * Creates an identity-scoped prompt bar service facade.
 *
 * @param {object|string} identity
 * @param {object} [options]
 * @param {object} [options.registry] - Custom store registry (defaults to global registry)
 * @param {object} [options.storage] - Custom storage for pending action queue
 * @param {number} [options.now] - Current timestamp override
 * @param {object} [options.targetInstanceIdentity] - For testing project mismatch
 * @returns {object} Service interface with action methods
 */
export function promptBarService(
  identity,
  {
    registry = defaultRegistry,
    storage,
    now,
    targetInstanceIdentity,
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
  };
}
