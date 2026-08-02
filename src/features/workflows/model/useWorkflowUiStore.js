import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * [FSD Layer: features/workflows]
 * UI State ONLY for Workflows & Studio View.
 * No server data stored here — server state lives in React Query.
 */
export const useWorkflowUiStore = create(
  persist(
    (set, get) => ({
      // Active Workspace & Session Selection
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, selectedNodeId: null }),

      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),

      activeStudioTab: "generations", // "generations" | "elements" | "characters"
      setActiveStudioTab: (tab) => set((s) => {
        const target = tab === 'elements' ? '_elementFilters' : '_generationFilters';
        return {
          activeStudioTab: tab,
          filters: s[target] || s.filters
        };
      }),

      triggerScrollToTop: 0,
      fireScrollToTop: () => set((s) => ({ triggerScrollToTop: (s.triggerScrollToTop || 0) + 1 })),

      isNavbarHidden: false,
      setIsNavbarHidden: (val) => set({ isNavbarHidden: val }),

      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      clearSelectedNodeId: () => set({ selectedNodeId: null }),

      // Detail View Toggle & Selected Media
      isDetailView: false,
      setIsDetailView: (val) => set({ isDetailView: val }),
      selectedMediaId: null,
      setSelectedMediaId: (id) => set({ selectedMediaId: id }),

      gridSize: "lg", // "sm" | "md" | "lg"
      setGridSize: (size) => set({ gridSize: size }),

      // Settings Toggles
      soundOnHover: false,
      setSoundOnHover: (val) => set({ soundOnHover: val }),
      showTileDetails: true,
      setShowTileDetails: (val) => set({ showTileDetails: val }),
      showDetails: true,
      setShowDetails: (val) => set({ showDetails: val }),
      clearPromptOnSubmit: true,
      setClearPromptOnSubmit: (val) => set({ clearPromptOnSubmit: val }),
      showUploadedMedia: true,
      setShowUploadedMedia: (val) => set({ showUploadedMedia: val }),

      // Filters
      _generationFilters: {
        models: [], types: [], aspectRatios: [],
        sort: 'newest', prompt: '', liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },
      _elementFilters: {
        models: [], types: [], aspectRatios: [],
        sort: 'newest', prompt: '', liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },
      filters: {
        models: [], types: [], aspectRatios: [],
        sort: 'newest', prompt: '', liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },

      setFilter: (key, value) => set((s) => {
        const nextFilters = { ...s.filters, [key]: value };
        const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
        return {
          filters: nextFilters,
          [target]: nextFilters
        };
      }),

      clearFilters: () => set((s) => {
        const empty = {
          models: [], types: [], aspectRatios: [],
          sort: 'newest', prompt: '', liked: false,
          gender: [], renderingStyles: [], elementTypes: [],
        };
        const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
        return {
          filters: empty,
          [target]: empty
        };
      }),

      // Drag State
      draggedImage: null,
      setDraggedImage: (img) => set({ draggedImage: img }),
      clearDraggedImage: () => set({ draggedImage: null }),
    }),
    {
      name: "studio-ui-settings",
      partialize: (state) => ({
        gridSize: state.gridSize,
        soundOnHover: state.soundOnHover,
        showTileDetails: state.showTileDetails,
        showDetails: state.showDetails,
        clearPromptOnSubmit: state.clearPromptOnSubmit,
        showUploadedMedia: state.showUploadedMedia,
      }),
    }
  )
);
