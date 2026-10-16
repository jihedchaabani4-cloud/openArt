import { create } from "zustand";

/**
 * usePromptStore (Legacy / Gallery Drag Store)
 *
 * Retained per PB-D-17 exclusively for gallery drag-and-drop state.
 * All prompt bar parameters, mode, model, and references have been migrated
 * to per-instance stores via promptBarService and PromptBarStoreProvider.
 */
export const usePromptStore = create((set) => ({
  // Gallery drag state (KEEP)
  isDraggingGalleryItem: false,
  draggedItem: null,

  setIsDraggingGalleryItem: (val) => set({ isDraggingGalleryItem: val }),
  setDraggedItem: (item) => set({ draggedItem: item }),
}));
