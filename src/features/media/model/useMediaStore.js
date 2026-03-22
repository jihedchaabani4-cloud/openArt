import { create } from "zustand";

/**
 * [FSD Layer: features/media]
 * Pure UI State for Media.
 */
export const useMediaStore = create((set) => ({
    // Track upload/import state, etc.
    isImporting: false,
    setIsImporting: (isImporting) => set({ isImporting }),
}));
