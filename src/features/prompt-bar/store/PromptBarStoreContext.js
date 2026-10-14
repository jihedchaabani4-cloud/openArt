"use client";

/**
 * Prompt Bar Platform — Store Context
 *
 * Provides per-instance Zustand vanilla store via React Context.
 * Each <PromptBarStoreProvider> mounts its own isolated store instance.
 * On unmount, the store is garbage-collected — no residual state.
 */

import React, { createContext, useContext, useRef } from "react";
import { createPromptBarStore } from "./createPromptBarStore.js";
import { initializeFromType } from "../core/initialization.js";

let activePromptBarStoreInstance = null;

export function setActivePromptBarStore(store) {
  activePromptBarStoreInstance = store;
}

export function getActivePromptBarStore() {
  return activePromptBarStoreInstance;
}

export const PromptBarStoreContext = createContext(null);

// In-memory registry to preserve store instances across page transitions within a project
const persistentStoreRegistry = new Map();

export function clearPersistentPromptBarStores() {
  persistentStoreRegistry.clear();
}

/**
 * Resolves the active project ID from store or window path if available.
 */
function resolveProjectId() {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/\/cinema-studio\/([^/]+)/);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Loads serialized store state from sessionStorage.
 */
function loadSavedState(key) {
  if (typeof window === "undefined" || !window.sessionStorage || !key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves serialized store state to sessionStorage.
 */
function saveState(key, state) {
  if (typeof window === "undefined" || !window.sessionStorage || !key || !state) return;
  try {
    const payload = {
      prompt: state.prompt,
      selectedModelId: state.selectedModelId,
      parameterValues: state.parameterValues,
      elements: state.elements,
      characters: state.characters,
      activeMode: state.activeMode,
      activeSubMode: state.activeSubMode,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

/**
 * Provides a PromptBar store to the component tree.
 * When persist=true (default in studio), the store instance and its state
 * (prompt, parameters, model, and references) are preserved across page changes.
 *
 * @param {{ type: CompositionType, initialModels?: object[], persist?: boolean, persistKey?: string, children: React.ReactNode }} props
 */
export function PromptBarStoreProvider({
  type,
  initialModels = [],
  persist = true,
  persistKey = "studio-prompt-bar",
  children,
}) {
  const storeRef = useRef(null);

  const resolvedProjectId = resolveProjectId();
  const effectiveKey = persist
    ? `${persistKey}_${resolvedProjectId || "global"}`
    : null;

  if (!storeRef.current) {
    if (effectiveKey && persistentStoreRegistry.has(effectiveKey)) {
      // 1. Reuse existing store instance in memory across page navigation
      storeRef.current = persistentStoreRegistry.get(effectiveKey);

      if (initialModels && initialModels.length > 0) {
        storeRef.current.getState().setModels(initialModels);
      }
    } else {
      // 2. Initialize from modelsMap + savedState
      const modelsMap = {};
      for (const m of initialModels) {
        modelsMap[m.id] = m;
      }

      const { selectedModelId: defaultModelId, parameterValues: defaultParams } = initializeFromType(type, modelsMap);
      const savedState = effectiveKey ? loadSavedState(effectiveKey) : null;

      const mergedParams = {
        ...defaultParams,
        ...(savedState?.parameterValues || {}),
      };

      const newStore = createPromptBarStore({
        modelsMap,
        selectedModelId: savedState?.selectedModelId || defaultModelId,
        parameterValues: mergedParams,
        prompt: savedState?.prompt !== undefined ? savedState.prompt : "",
        elements: savedState?.elements || [],
        characters: savedState?.characters || [],
        activeMode: savedState?.activeMode || "image",
        activeSubMode: savedState?.activeSubMode || "frames",
      });

      if (effectiveKey) {
        persistentStoreRegistry.set(effectiveKey, newStore);
      }
      storeRef.current = newStore;
    }
  }

  // Register active store instance
  setActivePromptBarStore(storeRef.current);

  // Subscribe to changes and persist to sessionStorage
  React.useEffect(() => {
    setActivePromptBarStore(storeRef.current);

    if (!effectiveKey || !storeRef.current) return undefined;

    const unsub = storeRef.current.subscribe((state) => {
      saveState(effectiveKey, state);
    });

    return () => {
      unsub();
    };
  }, [effectiveKey]);

  return React.createElement(PromptBarStoreContext.Provider, { value: storeRef.current }, children);
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
