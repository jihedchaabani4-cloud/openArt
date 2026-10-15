/**
 * Prompt Bar Store — Pending Action Queue
 *
 * Manages queued actions for prompt bar instances that are not yet mounted.
 * When the instance mounts, pending actions are drained in order and executed exactly once.
 *
 * Pure module: zero direct window/document access, storage passed in or defaults to memory fallback.
 */

import { identityKey } from "./registry.js";

export const DEFAULT_PENDING_TTL_MS = 120000; // 2 minutes
export const PENDING_QUEUE_STORAGE_KEY = "pb2:pending_actions";

// Default in-memory storage fallback for SSR or node environments
const memoryStorage = (() => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: (key) => map.delete(key),
  };
})();

function getStorage(customStorage) {
  if (customStorage && typeof customStorage.getItem === "function") {
    return customStorage;
  }
  if (typeof globalThis !== "undefined" && globalThis.sessionStorage) {
    try {
      return globalThis.sessionStorage;
    } catch {
      // sessionStorage restricted / throws
    }
  }
  return memoryStorage;
}

function resolveTargetKey(identity) {
  if (typeof identity === "string") return identity;
  if (identity && typeof identity === "object") {
    return identityKey(identity);
  }
  throw new Error("pendingActions: Identity must be a valid key string or identity object.");
}

function readAllQueues(storage) {
  try {
    const raw = storage.getItem(PENDING_QUEUE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllQueues(storage, queues) {
  try {
    storage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(queues));
  } catch {
    // Ignore storage write errors (quota, private mode)
  }
}

/**
 * Enqueues a pending action for an unmounted Prompt Bar identity.
 *
 * @param {object|string} identity
 * @param {object} actionDescriptor - { actionName, args: any[] }
 * @param {object} [options]
 * @param {object} [options.storage]
 * @param {number} [options.now]
 * @returns {{ queued: boolean }}
 */
export function enqueuePendingAction(identity, actionDescriptor, { storage, now } = {}) {
  const storeInstance = getStorage(storage);
  const key = resolveTargetKey(identity);
  const currentTime = typeof now === "number" ? now : Date.now();

  const projectId =
    typeof identity === "object" && identity?.projectId
      ? identity.projectId
      : null;

  const queues = readAllQueues(storeInstance);
  if (!Array.isArray(queues[key])) {
    queues[key] = [];
  }

  queues[key].push({
    actionName: actionDescriptor.actionName,
    args: Array.isArray(actionDescriptor.args) ? actionDescriptor.args : [],
    payload: actionDescriptor.payload,
    timestamp: currentTime,
    projectId,
  });

  writeAllQueues(storeInstance, queues);
  return { queued: true };
}

/**
 * Drains and executes pending actions for a mounting Prompt Bar instance.
 * Entries are removed from storage BEFORE execution to guarantee no double run.
 *
 * @param {object|string} identity
 * @param {object} options
 * @param {object} [options.registry]
 * @param {object} [options.storage]
 * @param {string} [options.currentProjectId]
 * @param {number} [options.ttlMs=120000]
 * @param {number} [options.now]
 * @param {Function} [options.executor]
 * @returns {{ executed: number, actions: Array<object> }}
 */
export function drainPendingActions(
  identity,
  {
    registry,
    storage,
    currentProjectId,
    ttlMs = DEFAULT_PENDING_TTL_MS,
    now,
    executor,
  } = {}
) {
  const storeInstance = getStorage(storage);
  const key = resolveTargetKey(identity);
  const currentTime = typeof now === "number" ? now : Date.now();

  const queues = readAllQueues(storeInstance);
  const pendingForIdentity = queues[key];

  if (!Array.isArray(pendingForIdentity) || pendingForIdentity.length === 0) {
    return { executed: 0, actions: [] };
  }

  // Atomically remove entries for this key BEFORE execution (prevent double execution)
  delete queues[key];
  writeAllQueues(storeInstance, queues);

  let targetStore = null;
  if (registry && typeof registry.get === "function") {
    targetStore = registry.get(identity);
  }

  let executedCount = 0;
  const executedActions = [];

  for (const entry of pendingForIdentity) {
    // 1. Drop if expired
    if (currentTime - entry.timestamp > ttlMs) {
      continue;
    }

    // 2. Drop if project mismatch
    if (
      entry.projectId &&
      currentProjectId &&
      entry.projectId !== currentProjectId &&
      entry.projectId !== "global" &&
      currentProjectId !== "global"
    ) {
      continue;
    }

    // 3. Execute
    if (typeof executor === "function") {
      executor(entry, targetStore);
      executedCount++;
      executedActions.push(entry);
    } else if (targetStore && typeof targetStore.getState === "function") {
      const state = targetStore.getState();
      if (entry.actionName === "setPrompt" && typeof state.setPrompt === "function") {
        state.setPrompt(entry.args[0]);
      } else if (entry.actionName === "reset") {
        if (typeof state.resetStoreState === "function") {
          state.resetStoreState();
        } else if (typeof state.reset === "function") {
          state.reset();
        }
      } else if (entry.actionName === "focus" && typeof state.requestFocus === "function") {
        state.requestFocus();
      } else if (entry.actionName === "animate" && typeof state.animateMedia === "function") {
        state.animateMedia(entry.args?.[0]?.media || entry.args?.[0]);
      } else if (entry.actionName === "add_reference" && typeof state.addReference === "function") {
        state.addReference(entry.args?.[0]?.media || entry.args?.[0]);
      } else if (typeof state[entry.actionName] === "function") {
        state[entry.actionName](...entry.args);
      }
      executedCount++;
      executedActions.push(entry);
    }
  }

  return { executed: executedCount, actions: executedActions };
}

/**
 * Clears pending actions for a given identity or all identities.
 *
 * @param {object|string} [identity]
 * @param {object} [options]
 */
export function clearPendingActions(identity, { storage } = {}) {
  const storeInstance = getStorage(storage);
  if (!identity) {
    writeAllQueues(storeInstance, {});
    return;
  }
  const key = resolveTargetKey(identity);
  const queues = readAllQueues(storeInstance);
  delete queues[key];
  writeAllQueues(storeInstance, queues);
}
