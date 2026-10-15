/**
 * Prompt Bar Store Registry
 *
 * External store instance registry managing instance identities, mount lifecycles,
 * project pruning, and submit tokens.
 * Zero React, zero DOM, zero window, zero storage access.
 */

/**
 * Builds canonical identity key string for a Prompt Bar instance.
 * Format: pb2:<templateId>:<instanceId>:<projectId or "global">
 *
 * @param {object} params
 * @param {string} params.templateId
 * @param {string} [params.projectId]
 * @param {string} [params.instanceId="default"]
 * @returns {string}
 */
export function identityKey({ templateId, projectId, instanceId = "default" } = {}) {
  if (!templateId || typeof templateId !== "string" || !templateId.trim()) {
    throw new Error("identityKey: 'templateId' is required and must be a non-empty string.");
  }
  const cleanTemplateId = templateId.trim();
  const cleanInstanceId = (instanceId && typeof instanceId === "string" ? instanceId.trim() : "default") || "default";
  const cleanProjectId = (projectId && typeof projectId === "string" ? projectId.trim() : "global") || "global";

  return `pb2:${cleanTemplateId}:${cleanInstanceId}:${cleanProjectId}`;
}

/**
 * Parses an identity key back into its component parts.
 *
 * @param {string} key
 * @returns {{ templateId: string, instanceId: string, projectId: string }}
 */
function parseKey(key) {
  if (typeof key !== "string" || !key.startsWith("pb2:")) {
    return { templateId: "", instanceId: "default", projectId: "global" };
  }
  const parts = key.split(":");
  return {
    templateId: parts[1] || "",
    instanceId: parts[2] || "default",
    projectId: parts[3] || "global",
  };
}

/**
 * Resolves an identity parameter (either object or string) into a canonical key.
 *
 * @param {object|string} identity
 * @returns {string}
 */
function resolveKey(identity) {
  if (typeof identity === "string") return identity;
  if (identity && typeof identity === "object") {
    return identityKey(identity);
  }
  throw new Error("Registry identity must be a valid key string or identity object.");
}

/**
 * Creates an isolated Prompt Bar store registry.
 */
export function createRegistry() {
  const entries = new Map();

  function getEntry(identity) {
    const key = resolveKey(identity);
    return entries.get(key);
  }

  function getOrCreate(identity, factory, meta = {}) {
    const key = resolveKey(identity);
    let entry = entries.get(key);
    if (!entry) {
      if (typeof factory !== "function") {
        throw new Error("Registry: factory must be a function to create a new store instance.");
      }
      const store = factory();
      entry = {
        key,
        identity: typeof identity === "object" ? { ...identity } : parseKey(key),
        store,
        meta: meta ? { ...meta } : {},
        mountCount: 0,
        currentSubmitToken: null,
        submitCounter: 0,
      };
      entries.set(key, entry);
    } else if (meta && Object.keys(meta).length > 0) {
      entry.meta = { ...(entry.meta || {}), ...meta };
    }
    return entry.store;
  }

  function get(identity) {
    const entry = getEntry(identity);
    return entry ? entry.store : undefined;
  }

  function has(identity) {
    const key = resolveKey(identity);
    return entries.has(key);
  }

  function reset(identity) {
    const entry = getEntry(identity);
    if (!entry || !entry.store) return undefined;
    const storeObj = entry.store;
    if (typeof storeObj.reset === "function") {
      storeObj.reset();
    } else if (typeof storeObj.getState === "function") {
      const state = storeObj.getState();
      if (typeof state?.resetStoreState === "function") {
        state.resetStoreState();
      } else if (typeof state?.reset === "function") {
        state.reset();
      }
    }
    return entry.store;
  }

  function dispose(identity) {
    const key = resolveKey(identity);
    return entries.delete(key);
  }

  function setMeta(identity, meta = {}) {
    const entry = getEntry(identity);
    if (entry && meta) {
      entry.meta = { ...(entry.meta || {}), ...meta };
    }
  }

  function getMeta(identity) {
    const entry = getEntry(identity);
    return entry?.meta ? { ...entry.meta } : {};
  }

  function list() {
    return Array.from(entries.values()).map((entry) => ({
      key: entry.key,
      identity: { ...entry.identity },
      store: entry.store,
      meta: { ...(entry.meta || {}) },
      mountCount: entry.mountCount,
      isMounted: entry.mountCount > 0,
    }));
  }

  function markMounted(identity, meta = {}) {
    const key = resolveKey(identity);
    let entry = entries.get(key);
    if (!entry) {
      entry = {
        key,
        identity: typeof identity === "object" ? { ...identity } : parseKey(key),
        store: null,
        meta: meta ? { ...meta } : {},
        mountCount: 0,
        currentSubmitToken: null,
        submitCounter: 0,
      };
      entries.set(key, entry);
    } else if (meta && Object.keys(meta).length > 0) {
      entry.meta = { ...(entry.meta || {}), ...meta };
    }
    entry.mountCount = (entry.mountCount || 0) + 1;
    return entry.mountCount;
  }

  function markUnmounted(identity) {
    const entry = getEntry(identity);
    if (!entry) return 0;
    entry.mountCount = Math.max(0, (entry.mountCount || 0) - 1);
    return entry.mountCount;
  }

  function isMounted(identity) {
    const entry = getEntry(identity);
    return Boolean(entry && entry.mountCount > 0);
  }

  function pruneOtherProjects(currentProjectId) {
    const targetProject = (currentProjectId && typeof currentProjectId === "string" ? currentProjectId.trim() : "") || "global";
    const disposedKeys = [];

    for (const [key, entry] of entries.entries()) {
      const entryProject = entry.identity?.projectId || parseKey(key).projectId;
      if (entryProject !== targetProject && entryProject !== "global") {
        if (!entry.mountCount || entry.mountCount <= 0) {
          entries.delete(key);
          disposedKeys.push(key);
        }
      }
    }

    return disposedKeys;
  }

  function beginSubmit(identity) {
    const key = resolveKey(identity);
    let entry = entries.get(key);
    if (!entry) {
      entry = {
        key,
        identity: typeof identity === "object" ? { ...identity } : parseKey(key),
        store: null,
        mountCount: 0,
        currentSubmitToken: null,
        submitCounter: 0,
      };
      entries.set(key, entry);
    }
    entry.submitCounter = (entry.submitCounter || 0) + 1;
    const token = `sub_${Date.now()}_${entry.submitCounter}_${Math.random().toString(36).slice(2, 7)}`;
    entry.currentSubmitToken = token;
    return token;
  }

  function endSubmit(identity, token) {
    const entry = getEntry(identity);
    if (!entry) return false;
    if (entry.currentSubmitToken && entry.currentSubmitToken === token) {
      entry.currentSubmitToken = null;
      return true;
    }
    return false;
  }

  function isSubmitting(identity) {
    const entry = getEntry(identity);
    return Boolean(entry && entry.currentSubmitToken !== null);
  }

  return {
    identityKey,
    getOrCreate,
    get,
    has,
    reset,
    dispose,
    list,
    setMeta,
    getMeta,
    markMounted,
    markUnmounted,
    isMounted,
    pruneOtherProjects,
    beginSubmit,
    endSubmit,
    isSubmitting,
  };
}

/** Global default store registry */
export const registry = createRegistry();
