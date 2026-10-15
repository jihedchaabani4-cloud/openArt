/**
 * Prompt Bar Core — applyComposite Helper
 *
 * Executes multiple state transition steps atomically over a draft state.
 * If all steps succeed, combines all accumulated patches and applies them
 * via a single store.setState call (single notification).
 * If any step fails, aborts immediately and leaves store state 100% unchanged.
 *
 * Zero React, zero DOM, zero template/domain literals.
 */

import { ok, fail, REASONS } from "./commandResult.js";

/**
 * Applies multiple command steps atomically to a store.
 *
 * @param {object} store - Zustand vanilla store instance
 * @param {Array<Function>} steps - Array of pure step functions: (draftState) => CommandResult
 * @returns {object} CommandResult
 */
export function applyComposite(store, steps) {
  if (!store || typeof store.getState !== "function" || typeof store.setState !== "function") {
    return fail(REASONS.INVALID_ARGUMENT, { message: "applyComposite requires a valid store with getState and setState." });
  }

  if (!Array.isArray(steps)) {
    return fail(REASONS.INVALID_ARGUMENT, { message: "applyComposite requires an array of step functions." });
  }

  const initialState = store.getState();
  let draft = {
    ...initialState,
    parameterValues: { ...(initialState.parameterValues || {}) },
  };

  const accumulatedPatch = {};

  for (const step of steps) {
    if (typeof step !== "function") continue;
    const res = step(draft);

    if (!res || res.ok === false) {
      // Abort immediately without touching store
      return res || fail(REASONS.INVALID_ARGUMENT);
    }

    if (res.patch && typeof res.patch === "object") {
      for (const [key, val] of Object.entries(res.patch)) {
        if (key === "parameterValues" && val && typeof val === "object") {
          draft.parameterValues = val;
          accumulatedPatch.parameterValues = val;
        } else {
          draft[key] = val;
          accumulatedPatch[key] = val;
        }
      }
    }
  }

  // Exactly one store mutation and notification
  store.setState(accumulatedPatch);
  return ok(accumulatedPatch);
}
