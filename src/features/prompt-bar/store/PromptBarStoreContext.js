"use client";

/**
 * Prompt Bar Platform — Store Context
 *
 * Provides per-instance Zustand vanilla store via React Context backed by store registry.
 * Zero storage reading or registry mutations during render.
 * Hydration occurs after mount in useEffect.
 */

import React, { createContext, useContext } from "react";
import { createPromptBarStore } from "./createPromptBarStore.js";
import { initializeFromType } from "../core/initialization.js";
import { registry, identityKey } from "./registry.js";
import { loadSaved, createSaver, removeSaved, selectPersistable } from "./persistence.js";

/**
 * @deprecated Documented no-op. Prompt bar stores are managed per instance via registry.
 */
export function setActivePromptBarStore() {}

/**
 * Resolves the active project ID from window path if available.
 */
function resolveProjectId() {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/\/cinema-studio\/([^/]+)/);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * @deprecated Returns the store of the most recently mounted instance if exactly
 * one instance is mounted for the current project; if more than one is mounted returns null.
 */
export function getActivePromptBarStore() {
  const currentProject = resolveProjectId() || "global";
  const mounted = registry.list().filter(
    (item) => item.isMounted && (item.identity?.projectId === currentProject || (!item.identity?.projectId && currentProject === "global"))
  );
  if (mounted.length === 1) {
    return mounted[0].store;
  }
  return null;
}

export const PromptBarStoreContext = createContext(null);

/**
 * Clears all persistent prompt bar stores from registry and storage.
 *
 * @param {Storage|object} [storage]
 */
export function clearPersistentPromptBarStores(storage = typeof window !== "undefined" ? window.sessionStorage : null) {
  const items = registry.list();
  for (const item of items) {
    registry.dispose(item.key);
    if (storage) {
      removeSaved(storage, item.key);
    }
  }
}

function loadAnySaved(storage, canonicalKey, legacyKey) {
  const fromCanonical = loadSaved(storage, canonicalKey);
  if (fromCanonical) return fromCanonical;
  if (!legacyKey || !storage || typeof storage.getItem !== "function") return null;
  try {
    const raw = storage.getItem(legacyKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Provides a PromptBar store to the component tree backed by the external registry.
 *
 * @param {{
 *   type: CompositionType,
 *   templateId?: string,
 *   instanceId?: string,
 *   initialModels?: object[],
 *   persist?: boolean,
 *   persistKey?: string,
 *   storage?: Storage|object,
 *   children: React.ReactNode
 * }} props
 */
export function PromptBarStoreProvider({
  type,
  templateId,
  instanceId,
  initialModels = [],
  persist = true,
  persistKey = "studio-prompt-bar",
  storage = typeof window !== "undefined" ? window.sessionStorage : null,
  children,
}) {
  const resolvedProjectId = resolveProjectId();
  const effectiveTemplateId = templateId || type?.id || "default";
  const effectiveInstanceId = instanceId || (persistKey && persistKey !== "studio-prompt-bar" ? persistKey : "default");

  const identity = React.useMemo(() => ({
    templateId: effectiveTemplateId,
    instanceId: effectiveInstanceId,
    projectId: resolvedProjectId || "global",
  }), [effectiveTemplateId, effectiveInstanceId, resolvedProjectId]);

  const canonicalKey = React.useMemo(() => identityKey(identity), [identity]);
  const legacyKey = React.useMemo(
    () => (persist && persistKey ? `${persistKey}_${resolvedProjectId || "global"}` : null),
    [persist, persistKey, resolvedProjectId]
  );

  // 1. Store creation is allowed ONLY through registry.getOrCreate and must not read storage.
  // The first render (server and client) uses defaults plus initialConfig only (PB-D-06).
  const store = registry.getOrCreate(identity, () => {
    const modelsMap = {};
    for (const m of initialModels) {
      modelsMap[m.id] = m;
    }
    const { selectedModelId: defaultModelId, parameterValues: defaultParams } = initializeFromType(type, modelsMap);

    return createPromptBarStore({
      identity,
      modelsMap,
      selectedModelId: defaultModelId,
      parameterValues: defaultParams,
      prompt: "",
      elements: [],
      characters: [],
      activeMode: "image",
      activeSubMode: "frames",
    });
  });

  // 2. Mount lifecycle, hydration and debounced persistence
  React.useEffect(() => {
    // Reset stale isGenerating on mount if no active submit is in flight
    if (store.getState().isGenerating && !registry.isSubmitting(identity)) {
      if (typeof store.getState().setIsGenerating === "function") {
        store.getState().setIsGenerating(false);
      } else if (typeof store.setState === "function") {
        store.setState({ isGenerating: false });
      }
    }

    registry.markMounted(identity);
    registry.pruneOtherProjects(resolvedProjectId);

    let saver = null;
    let unsubLegacy = null;

    if (persist && storage) {
      const saved = loadAnySaved(storage, canonicalKey, legacyKey);
      if (saved) {
        store.getState().hydrate(saved);
      }

      saver = createSaver({
        storage,
        key: canonicalKey,
        getState: store.getState,
        subscribe: store.subscribe,
      });

      if (legacyKey) {
        unsubLegacy = store.subscribe((state) => {
          if (storage && typeof storage.setItem === "function") {
            try {
              storage.setItem(legacyKey, JSON.stringify(selectPersistable(state)));
            } catch {
              // safe ignore
            }
          }
        });
      }
    }

    if (initialModels && initialModels.length > 0) {
      const currentModelsMap = store.getState().modelsMap || {};
      const hasMissingModel = initialModels.some((m) => !currentModelsMap[m.id]);
      if (hasMissingModel) {
        store.getState().setModels(initialModels);
      }
    }

    return () => {
      if (saver) {
        saver.flush();
        saver.stop();
      }
      if (unsubLegacy) {
        unsubLegacy();
      }
      registry.markUnmounted(identity);
    };
  }, [identity, canonicalKey, legacyKey, persist, storage, initialModels, resolvedProjectId, store]);

  return React.createElement(PromptBarStoreContext.Provider, { value: store }, children);
}

/**
 * Returns the raw Zustand vanilla store from the nearest PromptBarStoreProvider.
 * @returns {ZustandVanillaStore}
 */
export function usePromptBarStoreInstance() {
  const store = useContext(PromptBarStoreContext);
  if (!store) {
    throw new Error("usePromptBarStoreInstance must be used inside a PromptBarStoreProvider");
  }
  return store;
}
