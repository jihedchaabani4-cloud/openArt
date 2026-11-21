"use client";

/**
 * Prompt Bar Platform — Store Context & Public React Hooks
 *
 * Provides per-instance Zustand vanilla store via React Context backed by store registry.
 * Exposes read-only usePromptBarState(selector) and command-only usePromptBarService().
 * Zero storage reading or registry mutations during render.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { useStore } from "zustand";
import { createPromptBarStore } from "./createPromptBarStore.js";
import { initializeFromType } from "../core/initialization.js";
import { registry, identityKey } from "./registry.js";
import { loadSaved, createSaver, removeSaved } from "./persistence.js";
import { drainPendingActions } from "./pendingActions.js";
import { createBoundPromptBarService } from "./publicActions.js";

/**
 * @deprecated Documented no-op. Retained only until external studio re-export is cleaned up.
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
    (item) =>
      item.isMounted &&
      (item.identity?.projectId === currentProject ||
        (!item.identity?.projectId && currentProject === "global"))
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
export function clearPersistentPromptBarStores(
  storage = typeof window !== "undefined" ? window.sessionStorage : null
) {
  const items = registry.list();
  for (const item of items) {
    registry.dispose(item.key);
    if (storage) {
      removeSaved(storage, item.key);
    }
  }
}

/**
 * Provides a PromptBar store to the component tree backed by the external registry.
 * Supports optional `store` (external injection) and `reuseParent` (reuses nearest ancestor provider).
 */
export function PromptBarStoreProvider(props) {
  const parentContextStore = useContext(PromptBarStoreContext);
  const passthroughStore = props.store || (props.reuseParent ? parentContextStore : null);
  if (passthroughStore) {
    return React.createElement(PromptBarStoreContext.Provider, { value: passthroughStore }, props.children);
  }
  return React.createElement(PromptBarStoreProviderManaged, props);
}

const EMPTY_MODELS = [];

function PromptBarStoreProviderManaged({
  type,
  featureConfig,
  template,
  templateId,
  instanceId,
  projectId,
  initialModels = EMPTY_MODELS,
  persist = true,
  persistKey = "studio-prompt-bar",
  storage = typeof window !== "undefined" ? window.sessionStorage : null,
  children,
}) {
  const effectiveTemplate = React.useMemo(() => {
    if (template) return template;
    if (featureConfig && type && featureConfig !== type) {
      return { ...type, ...featureConfig };
    }
    return featureConfig || type || null;
  }, [template, type, featureConfig]);
  const resolvedProjectId = projectId || resolveProjectId();
  const effectiveTemplateId = templateId || effectiveTemplate?.id || type?.id || "default";
  const effectiveInstanceId =
    instanceId || (persistKey && persistKey !== "studio-prompt-bar" ? persistKey : "default");

  const identity = React.useMemo(
    () => ({
      templateId: effectiveTemplateId,
      instanceId: effectiveInstanceId,
      projectId: resolvedProjectId || "global",
    }),
    [effectiveTemplateId, effectiveInstanceId, resolvedProjectId]
  );

  const canonicalKey = React.useMemo(() => identityKey(identity), [identity]);

  const instanceMeta = React.useMemo(
    () => ({
      persistRoutes: effectiveTemplate?.persistRoutes || type?.persistRoutes || null,
      storage: persist ? storage : null,
      canonicalKey,
    }),
    [effectiveTemplate?.persistRoutes, type?.persistRoutes, persist, storage, canonicalKey]
  );

  // 1. Store creation is allowed ONLY through registry.getOrCreate on the client and must not read storage.
  // On the server (typeof window === "undefined"), create an ephemeral non-registered store to prevent SSR memory leaks.
  const createStore = () => {
    const modelsMap = {};
    for (const m of initialModels) {
      modelsMap[m.id] = m;
    }
    const { selectedModelId: defaultModelId, parameterValues: defaultParams } = initializeFromType(
      effectiveTemplate || type,
      modelsMap
    );

    return createPromptBarStore(
      {
        identity,
        template: effectiveTemplate,
        modelsMap,
        selectedModelId: defaultModelId,
        parameterValues: defaultParams,
        prompt: "",
        activeMode: effectiveTemplate?.defaultState?.activeMode || "image",
        activeSubMode: effectiveTemplate?.defaultState?.activeSubMode || "frames",
      },
      { template: effectiveTemplate }
    );
  };

  const store =
    typeof window === "undefined"
      ? createStore()
      : registry.getOrCreate(identity, createStore, instanceMeta);

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

    registry.markMounted(identity, instanceMeta);
    registry.pruneOtherProjects(resolvedProjectId);

    let saver = null;

    if (persist && storage) {
      const saved = loadSaved(storage, canonicalKey);
      if (saved) {
        store.getState().hydrate(saved);
      }

      saver = createSaver({
        storage,
        key: canonicalKey,
        getState: store.getState,
        subscribe: store.subscribe,
      });
    }

    // Drain pending actions immediately ONLY when models are already loaded or this template needs no models.
    // Otherwise setModels() drains pending actions synchronously as soon as models arrive.
    const hasModels = Object.keys(store.getState().modelsMap || {}).length > 0;
    const needsModels = effectiveTemplate?.features?.models !== false;
    if (hasModels || !needsModels) {
      drainPendingActions(identity, {
        registry,
        storage,
        currentProjectId: resolvedProjectId,
      });
    }

    return () => {
      if (saver) {
        saver.flush();
        saver.stop();
      }
      registry.markUnmounted(identity);
    };
  }, [
    identity,
    canonicalKey,
    persist,
    storage,
    resolvedProjectId,
    store,
    instanceMeta,
    effectiveTemplate,
  ]);

  // 3. Sync incoming initialModels in its own effect so prop changes never teardown mount lifecycle
  React.useEffect(() => {
    if (!initialModels || initialModels.length === 0) return;
    const currentModelsMap = store.getState().modelsMap || {};
    const hasMissingModel = initialModels.some((m) => !currentModelsMap[m.id]);
    if (hasMissingModel) {
      store.getState().setModels(initialModels);
    }
  }, [store, initialModels]);

  return React.createElement(PromptBarStoreContext.Provider, { value: store }, children);
}

/**
 * Internal: returns the raw Zustand vanilla store from the nearest PromptBarStoreProvider.
 * @returns {import("zustand/vanilla").StoreApi}
 */
export function usePromptBarStoreInstance() {
  const store = useContext(PromptBarStoreContext);
  if (!store) {
    throw new Error("usePromptBarStoreInstance must be used inside a PromptBarStoreProvider");
  }
  return store;
}

/**
 * Public React hook: returns the sealed Public Service facade bound to the nearest PromptBarStoreProvider.
 * All UI mutations go through this service — never raw store setters.
 *
 * @returns {object}
 */
export function usePromptBarService() {
  const store = usePromptBarStoreInstance();
  return useMemo(() => createBoundPromptBarService(store), [store]);
}

/**
 * Public React hook: read-only state selector for the nearest PromptBarStoreProvider.
 *
 * @template T
 * @param {(state: object) => T} selector
 * @returns {T}
 */
export function usePromptBarState(selector) {
  const store = usePromptBarStoreInstance();
  return useStore(store, selector);
}

const DEFAULT_PUBLIC_SNAPSHOT = Object.freeze({
  prompt: "",
  selectedModelId: null,
  activeMode: "image",
  activeSubMode: "frames",
  isGenerating: false,
});

const identitySnapshotSelector = (snapshot) => snapshot;

/**
 * Public React hook: reactive read-only snapshot reader for any Prompt Bar instance by identity.
 * Safe to call outside PromptBarStoreProvider (e.g. media cards and menus).
 * Backed by useSyncExternalStore so primitive selectors only re-render when the selected value changes.
 *
 * @template T
 * @param {object|string|null} identity
 * @param {(snapshot: { prompt: string, selectedModelId: string|null, activeMode: string, activeSubMode: string, isGenerating: boolean }) => T} [selector]
 * @param {object} [options]
 * @param {object} [options.registry]
 * @returns {T}
 */
export function usePromptBarSnapshot(
  identity,
  selector = identitySnapshotSelector,
  { registry: targetRegistry = registry } = {}
) {
  const templateId = typeof identity === "string" ? identity : identity?.templateId || null;
  const projectId = typeof identity === "string" ? null : identity?.projectId || null;
  const instanceId = typeof identity === "string" ? null : identity?.instanceId || null;

  const normalizedKey = useMemo(() => {
    if (!templateId) return null;
    return identityKey({ templateId, projectId, instanceId });
  }, [templateId, projectId, instanceId]);

  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const cacheRef = useRef({ rawState: null, snapshot: DEFAULT_PUBLIC_SNAPSHOT });

  const subscribe = useCallback(
    (onStoreChange) => {
      if (!normalizedKey) return () => {};
      return targetRegistry.subscribe(normalizedKey, onStoreChange);
    },
    [normalizedKey, targetRegistry]
  );

  const readPublicSnapshot = useCallback(() => {
    if (!normalizedKey || !targetRegistry.isMounted(normalizedKey)) {
      return DEFAULT_PUBLIC_SNAPSHOT;
    }
    const store = targetRegistry.get(normalizedKey);
    if (!store || typeof store.getState !== "function") {
      return DEFAULT_PUBLIC_SNAPSHOT;
    }
    const rawState = store.getState();
    if (cacheRef.current.rawState === rawState) {
      return cacheRef.current.snapshot;
    }
    const nextSnapshot = Object.freeze({
      prompt: rawState.prompt || "",
      selectedModelId: rawState.selectedModelId || null,
      activeMode: rawState.activeMode || "image",
      activeSubMode: rawState.activeSubMode || "frames",
      isGenerating: Boolean(rawState.isGenerating),
    });
    cacheRef.current = { rawState, snapshot: nextSnapshot };
    return nextSnapshot;
  }, [normalizedKey, targetRegistry]);

  const getSnapshot = useCallback(
    () => selectorRef.current(readPublicSnapshot()),
    [readPublicSnapshot]
  );

  const getServerSnapshot = useCallback(
    () => selectorRef.current(DEFAULT_PUBLIC_SNAPSHOT),
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
