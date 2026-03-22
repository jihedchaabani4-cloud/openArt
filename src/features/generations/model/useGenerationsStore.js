import { create } from "zustand";

/**
 * [FSD Layer: features/generations] 
 * Pure UI State for Generations. No API calls here.
 */
export const useGenerationsStore = create((set) => ({
    // Workspace / Active Selection
    activeWorkspaceId: null,
    setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, selectedNodeId: null }),

    selectedProjectId: null,
    setSelectedProjectId: (id) => set({ selectedProjectId: id }),

    activeSessionId: null,
    setActiveSessionId: (id) => set({ activeSessionId: id }),

    loading: false,
    setLoading: (loading) => set({ loading }),
    error: null,
    setError: (error) => set({ error }),

    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    clearSelectedNodeId: () => set({ selectedNodeId: null }),

    // Modes & Layout
    studioMode: "image", // "image" | "cinema"
    setStudioMode: (mode) => set({ studioMode: mode }),

    studioLayoutMode: "grouped", // "grouped" | "grid"
    setStudioLayoutMode: (mode) => set({ studioLayoutMode: mode }),

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

    // Filtering & Search
    filters: {
        models:       [],
        types:        [],
        aspectRatios: [],
        sort:         'newest',
        prompt:       '',
        liked:        false,
    },

    setFilter: (key, value) => set((s) => ({ 
        filters: { ...s.filters, [key]: value } 
    })),

    toggleArrayFilter: (key, value) => set((s) => {
        const arr = s.filters[key] || [];
        return {
            filters: {
                ...s.filters,
                [key]: arr.includes(value) 
                    ? arr.filter(v => v !== value) 
                    : [...arr, value],
            }
        };
    }),

    clearFilters: () => set({ 
        filters: {
            models:       [],
            types:        [],
            aspectRatios: [],
            sort:         'newest',
            prompt:       '',
            liked:        false,
        } 
    }),

    // @deprecated - use filters.liked instead
    activeFilter: "all", 
    setActiveFilter: (filter) => set({ 
        activeFilter: filter,
        filters: { 
            ...get().filters, 
            liked: filter === 'liked' 
        }
    }),

    editTrigger: null,
    setEditTrigger: (trigger) => set({ editTrigger: trigger }),
}));
