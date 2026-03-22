import { create } from "zustand";

/**
 * [FSD Layer: features/projects]
 * Pure UI State for Projects Feature.
 */
export const useProjectsStore = create((set) => ({
    // Modal states, etc.
    isCreateModalOpen: false,
    setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
}));
