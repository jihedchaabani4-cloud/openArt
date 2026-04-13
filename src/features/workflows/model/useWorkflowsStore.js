import { create } from "zustand";
import { adaptReferences, validateReference } from "@/shared/lib/referenceUtils";

/**
 * [FSD Layer: features/workflows] 
 * Pure UI State for Workflows. No API calls here.
 */
export const useWorkflowsStore = create((set, get) => ({
    // Workspace / Active Selection
    activeWorkspaceId: null,
    setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, selectedNodeId: null }),

    selectedProjectId: null,
    setSelectedProjectId: (id) => set({ selectedProjectId: id }),

    activeSessionId: null,
    setActiveSessionId: (id) => set({ activeSessionId: id }),

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
            showGenerated: false,
            showImported:  false,
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

    // Global Drag State
    draggedImage: null, // { url, aspect, x, y }
    setDraggedImage: (img) => set({ draggedImage: img }),
    clearDraggedImage: () => set({ draggedImage: null }),

}));

// ── Alias for compatibility ──────────────────────────────────────────────────
export const useGenerationsStore = useWorkflowsStore;
