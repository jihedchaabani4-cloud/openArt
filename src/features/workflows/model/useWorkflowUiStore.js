import { create } from "zustand";
import { persist } from "zustand/middleware";

const createDefaultFilters = () => ({
  models: [],
  types: [],
  aspectRatios: [],
  sort: "newest",
  prompt: "",
  liked: false,
  dateRange: "all", // "all" | "today" | "7d" | "30d"
  hideFailed: false,
  activity: "all", // "all" | "generated" | "uploaded" | "liked"
  gender: [],
  renderingStyles: [],
  elementTypes: [],
});

/**
 * [FSD Layer: features/workflows]
 * UI State ONLY for Workflows & Studio View.
 * No server data stored here — server state lives in React Query.
 */
export const useWorkflowUiStore = create(
  persist(
    (set, _get) => ({
      // Active Workspace Selection
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, selectedNodeId: null }),

      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      selectedFolderId: null,
      setSelectedFolderId: (id) => set({ selectedFolderId: id, activeCollectionId: id }),

      activeCollectionId: null,
      setActiveCollectionId: (id) => set({ activeCollectionId: id, selectedFolderId: id }),

      activeStudioTab: "assets", // "assets" | "elements" | "characters" | "trash"
      setActiveStudioTab: (tab) => set((s) => {
        const target = tab === 'elements' ? '_elementFilters' : '_generationFilters';
        const baseFilters = s[target] || s.filters;
        return {
          activeStudioTab: tab,
          filters: {
            ...baseFilters,
            prompt: s.filters.prompt || "",
          },
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

      gridSize: "md", // "sm" | "md" | "lg"
      setGridSize: (size) => set({ gridSize: size }),

      gridSpacing: "sm", // "sm" (4px, xxs) | "md" (8px, sm) | "lg" (16px, base)
      setGridSpacing: (spacing) => set({ gridSpacing: spacing }),

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
      splitByDate: false,
      setSplitByDate: (val) => set({ splitByDate: val }),
      showFolders: true,
      setShowFolders: (val) => set({ showFolders: val }),

      // Filters
      _generationFilters: createDefaultFilters(),
      _elementFilters: createDefaultFilters(),
      filters: createDefaultFilters(),

      setFilter: (key, value) => set((s) => {
        const nextFilters = { ...s.filters, [key]: value };
        if (key === "activity") {
          nextFilters.liked = value === "liked";
        } else if (key === "liked") {
          if (value) {
            nextFilters.activity = "liked";
          } else if (nextFilters.activity === "liked") {
            nextFilters.activity = "all";
          }
        }
        const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
        return {
          filters: nextFilters,
          [target]: nextFilters,
          ...(key === 'prompt' ? {
            _generationFilters: { ...s._generationFilters, prompt: value },
            _elementFilters: { ...s._elementFilters, prompt: value },
          } : {})
        };
      }),

      clearFilters: () => set((s) => {
        const empty = createDefaultFilters();
        const target = s.activeStudioTab === 'elements' ? '_elementFilters' : '_generationFilters';
        return {
          filters: empty,
          [target]: empty,
          _generationFilters: createDefaultFilters(),
          _elementFilters: createDefaultFilters(),
        };
      }),

      // Drag State
      draggedImage: null,
      setDraggedImage: (img) => set({ draggedImage: img }),
      clearDraggedImage: () => set({ draggedImage: null }),

      // Favorite Collections / Folders
      favoriteFolderIds: {},
      toggleFavoriteFolder: (id) => {
        if (!id) return;
        set((s) => ({
          favoriteFolderIds: {
            ...(s.favoriteFolderIds || {}),
            [id]: !(s.favoriteFolderIds || {})[id],
          },
        }));
      },
    }),
    {
      name: "studio-ui-settings",
      partialize: (state) => ({
        gridSize: state.gridSize,
        gridSpacing: state.gridSpacing,
        soundOnHover: state.soundOnHover,
        showTileDetails: state.showTileDetails,
        showDetails: state.showDetails,
        clearPromptOnSubmit: state.clearPromptOnSubmit,
        showUploadedMedia: state.showUploadedMedia,
        splitByDate: state.splitByDate,
        showFolders: state.showFolders,
        favoriteFolderIds: state.favoriteFolderIds,
      }),
    }
  )
);
