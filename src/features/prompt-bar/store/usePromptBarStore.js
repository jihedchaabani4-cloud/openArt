/**
 * Prompt Bar Platform — Store Selector Hook
 *
 * Reads selected state from the nearest PromptBarStoreProvider.
 * Subscribe to specific slices to avoid unnecessary re-renders.
 *
 * Usage:
 *   const prompt = usePromptBarStore(s => s.prompt);
 *   const selectModel = usePromptBarStore(s => s.selectModel);
 *
 * Must be called inside a component tree wrapped by PromptBarStoreProvider.
 */

import { useStore } from "zustand";
import { usePromptBarStoreInstance } from "./PromptBarStoreContext.js";

/**
 * @template T
 * @param {(state: PromptBarInstanceState) => T} selector
 * @returns {T}
 */
export function usePromptBarStore(selector) {
  const store = usePromptBarStoreInstance();
  return useStore(store, selector);
}
