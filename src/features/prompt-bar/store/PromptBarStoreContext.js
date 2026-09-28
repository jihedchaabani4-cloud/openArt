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

/**
 * Provides an isolated PromptBar store to the component tree.
 *
 * @param {{ type: CompositionType, initialModels?: object[], children: React.ReactNode }} props
 */
export function PromptBarStoreProvider({ type, initialModels = [], children }) {
  const storeRef = useRef(null);

  if (!storeRef.current) {
    // Build initial modelsMap
    const modelsMap = {};
    for (const m of initialModels) {
      modelsMap[m.id] = m;
    }

    // Derive initial selected model and parameter values from composition type
    const { selectedModelId, parameterValues } = initializeFromType(type, modelsMap);

    storeRef.current = createPromptBarStore({
      modelsMap,
      selectedModelId,
      parameterValues,
    });
  }

  // Register active store instance
  setActivePromptBarStore(storeRef.current);

  React.useEffect(() => {
    setActivePromptBarStore(storeRef.current);
    return () => {
      if (getActivePromptBarStore() === storeRef.current) {
        setActivePromptBarStore(null);
      }
    };
  }, []);

  return (
    <PromptBarStoreContext.Provider value={storeRef.current}>
      {children}
    </PromptBarStoreContext.Provider>
  );
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
