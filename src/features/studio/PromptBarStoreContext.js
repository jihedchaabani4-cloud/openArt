"use client";

/**
 * Prompt Bar Platform — Store Context
 * Re-exports unified context and persistent store provider from features/prompt-bar.
 */
export {
  setActivePromptBarStore,
  getActivePromptBarStore,
  PromptBarStoreContext,
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
} from "@/features/prompt-bar/store/PromptBarStoreContext.js";

