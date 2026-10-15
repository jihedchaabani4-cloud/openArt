/**
 * Prompt Bar Store Persistence
 *
 * Serialization, debounced persistence, and hydration for Prompt Bar instances.
 * Pure module with storage passed in; zero React, zero DOM.
 */

import { isPersistableMedia } from "../core/mediaRef.js";

/** Default trailing debounce window for storage writes in milliseconds (PB-D-09). */
export const DEFAULT_PERSIST_DEBOUNCE_MS = 300;

/**
 * Checks whether an individual value or parameter is safe to persist to storage.
 *
 * @param {*} val
 * @returns {boolean}
 */
function isSafePersistableValue(val) {
  if (val === undefined || val === null) return true;

  if (typeof Blob !== "undefined" && val instanceof Blob) return false;
  if (typeof File !== "undefined" && val instanceof File) return false;
  if (typeof val === "object") {
    const tag = Object.prototype.toString.call(val);
    if (tag === "[object File]" || tag === "[object Blob]") return false;
    if (typeof val.arrayBuffer === "function" && typeof val.size === "number") return false;
  }

  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("blob:") || s.startsWith("data:")) return false;
    return true;
  }

  if (typeof val === "object") {
    const url = val.url || val.preview || val.file_url || val.src;
    if (typeof url === "string") {
      const s = url.trim();
      if (s.startsWith("blob:") || s.startsWith("data:")) return false;
    }
    return isPersistableMedia(val);
  }

  return true;
}

/**
 * Filters a parameter values dictionary, eliminating non-persistable media objects,
 * blob URLs, data URLs, and Files (PB-D-07).
 *
 * @param {object} parameterValues
 * @returns {object}
 */
function sanitizeParameterValues(parameterValues = {}) {
  if (!parameterValues || typeof parameterValues !== "object") return {};

  const clean = {};
  for (const [key, val] of Object.entries(parameterValues)) {
    if (val === undefined) continue;

    if (Array.isArray(val)) {
      const cleanArray = val.filter((item) => isSafePersistableValue(item));
      clean[key] = cleanArray;
    } else if (isSafePersistableValue(val)) {
      clean[key] = val;
    }
  }

  return clean;
}

/**
 * Filters an entity list (elements or characters), keeping only persistable references.
 *
 * @param {Array} list
 * @returns {Array}
 */
function sanitizeEntityList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => isSafePersistableValue(item));
}

/**
 * Extracts the canonical persistable state subset with version 2 (PB-D-07).
 * Never includes `isGenerating` or volatile UI flags.
 *
 * @param {object} state
 * @returns {object}
 */
export function selectPersistable(state = {}) {
  return {
    v: 2,
    prompt: typeof state.prompt === "string" ? state.prompt : "",
    selectedModelId: state.selectedModelId || null,
    parameterValues: sanitizeParameterValues(state.parameterValues),
    elements: sanitizeEntityList(state.elements),
    characters: sanitizeEntityList(state.characters),
    activeMode: state.activeMode || "image",
    activeSubMode: state.activeSubMode || "frames",
  };
}

/**
 * Loads and parses saved state from the provided storage.
 * Returns null if missing, invalid JSON, wrong version, or storage throws.
 *
 * @param {Storage|object} storage
 * @param {string} key
 * @returns {object|null}
 */
export function loadSaved(storage, key) {
  if (!storage || !key || typeof storage.getItem !== "function") return null;

  try {
    const raw = storage.getItem(key);
    if (!raw || typeof raw !== "string") return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.v !== 2) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Creates a debounced saver subscribed to a store (PB-D-09).
 * Returns flush, cancel, and stop controllers.
 *
 * @param {object} options
 * @param {Storage|object} options.storage
 * @param {string} options.key
 * @param {() => object} options.getState
 * @param {(listener: () => void) => () => void} [options.subscribe]
 * @param {number} [options.debounceMs=DEFAULT_PERSIST_DEBOUNCE_MS]
 * @returns {{ flush: () => { ok: boolean, error?: any }, cancel: () => void, stop: () => void, write: () => { ok: boolean, error?: any } }}
 */
export function createSaver({
  storage,
  key,
  getState,
  subscribe,
  debounceMs = DEFAULT_PERSIST_DEBOUNCE_MS,
} = {}) {
  let timer = null;
  let unsubscribe = null;

  function write() {
    if (!storage || !key || typeof storage.setItem !== "function" || typeof getState !== "function") {
      return { ok: false, error: new Error("createSaver: Invalid storage, key, or getState configuration") };
    }

    try {
      const state = getState();
      const persistable = selectPersistable(state);
      storage.setItem(key, JSON.stringify(persistable));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    return write();
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function stop() {
    cancel();
    if (typeof unsubscribe === "function") {
      unsubscribe();
      unsubscribe = null;
    }
  }

  if (typeof subscribe === "function") {
    unsubscribe = subscribe(() => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        write();
      }, debounceMs);
    });
  }

  return { flush, cancel, stop, write };
}

/**
 * Removes a saved prompt bar state key from storage safely.
 *
 * @param {Storage|object} storage
 * @param {string} key
 */
export function removeSaved(storage, key) {
  if (!storage || !key || typeof storage.removeItem !== "function") return;

  try {
    storage.removeItem(key);
  } catch {
    // safely ignore storage deletion failures
  }
}
