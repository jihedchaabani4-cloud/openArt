import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adaptReferences, validateReference } from "@/shared/lib/referenceUtils";

/**
 * [FSD Layer: features/workflows] 
 * Pure UI State for Workflows. No API calls here.
 */
export const useWorkflowsStore = create(
  persist(
    (set, get) => ({
      // Workspace / Active Selection
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, selectedNodeId: null }),

      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),

      activeStudioTab: "generations", // "generations" | "elements"
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

      loading: false,
      setLoading: (loading) => set({ loading }),
      error: null,
      setError: (error) => set({ error }),

      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      clearSelectedNodeId: () => set({ selectedNodeId: null }),

      // ─── Detail View ──────────────────────────────────────────────────────────
      isDetailView: false,
      setIsDetailView: (val) => set({ isDetailView: val }),
      selectedMediaId: null,
      setSelectedMediaId: (id) => set({ selectedMediaId: id }),

      gridSize: "lg", // "sm" | "md" | "lg"
      setGridSize: (size) => set({ gridSize: size }),

      // Navbar Settings toggles
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

      // ── Filtering & Search ──
      _generationFilters: {
          models:       [], types:        [], aspectRatios: [],
          sort:         'newest', prompt:       '', liked:        false,
          gender:       [], renderingStyles:[], elementTypes: [],
      },
      _elementFilters: {
          models:       [], types:        [], aspectRatios: [],
          sort:         'newest', prompt:       '', liked:        false,
          gender:       [], renderingStyles:[], elementTypes: [],
      },
      // The exposed state for the currently active tab
      filters: {
          models:       [], types:        [], aspectRatios: [],
          sort:         'newest', prompt:       '', liked:        false,
          gender:       [], renderingStyles:[], elementTypes: [],
      },

      setFilter: (key, value) => set((s) => {
          const nextFilters = { ...s.filters, [key]: value };
          const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
          return { 
              filters: nextFilters, 
              [target]: nextFilters 
          };
      }),

      toggleArrayFilter: (key, value) => set((s) => {
          const arr = s.filters[key] || [];
          const nextArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
          const nextFilters = { ...s.filters, [key]: nextArr };
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
              showGenerated: false, showImported: false,
              gender: [], renderingStyles: [], elementTypes: [],
          };
          const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
          return { 
              filters: empty,
              [target]: empty
          };
      }),

      // @deprecated - use filters.liked instead
      activeFilter: "all", 
      setActiveFilter: (filter) => set((s) => {
          const nextFilters = { ...s.filters, liked: filter === 'liked' };
          const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
          return { 
              activeFilter: filter,
              filters: nextFilters,
              [target]: nextFilters
          };
      }),

      // Global Drag State
      draggedImage: null, // { url, aspect, x, y }
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

// ── Alias for compatibility ──────────────────────────────────────────────────
export const useGenerationsStore = useWorkflowsStore;
