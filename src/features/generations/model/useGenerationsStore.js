import { create } from "zustand";
import { adaptReferences, validateReference } from "@/shared/lib/referenceUtils";

/**
 * [FSD Layer: features/generations] 
 * Pure UI State for Generations. No API calls here.
 */
export const useGenerationsStore = create((set, get) => ({
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

    // ─── Generation mode ──────────────────────────────────────────────────────
    generationMode: "image",

    /**
     * ✅ NEW: Mode-specific references storage.
     *    Ensures each mode (image, video, motion-control) has its own independent assets.
     */
    referencesByMode: {
        image: [],
        keyframe: [],
        multiref: [],
        "motion-control": [],
    },

    setGenerationMode: (mode) => {
        const { generationMode, referenceImages, referencesByMode } = get();
        if (mode === generationMode) return;

        // 1. Save current active refs to the old mode's slot
        const updatedByMode = {
            ...referencesByMode,
            [generationMode]: referenceImages,
        };

        // 2. Load refs for the new mode (or empty if none)
        const newRefs = updatedByMode[mode] || [];

        set({
            generationMode: mode,
            referencesByMode: updatedByMode,
            referenceImages: newRefs,
        });
    },

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

    editTrigger: null,
    setEditTrigger: (trigger) => set({ editTrigger: trigger }),

    // Global Drag State
    draggedImage: null, // { url, aspect, x, y }
    setDraggedImage: (img) => set({ draggedImage: img }),
    clearDraggedImage: () => set({ draggedImage: null }),

    // ─── References ───────────────────────────────────────────────────────────
    referenceImages: [],

    addReference: (asset, role = "normal", maxRefs = 4) => {
        const { referenceImages, generationMode, referencesByMode } = get();

        const validation = validateReference(asset, role, referenceImages, maxRefs, generationMode);
        if (!validation.ok) {
            console.warn("[Store] addReference rejected:", validation.reason);
            return false;
        }

        const isSingleSlot = ["start", "end", "mc_image", "mc_video"].includes(role);
        const cleaned = isSingleSlot
            ? referenceImages.filter(r => r.role !== role)
            : referenceImages;

        const isVideo = asset.is_video || (asset.url?.toLowerCase().endsWith('.mp4') || asset.url?.toLowerCase().endsWith('.webm'));
        const type = isVideo ? "video" : "image";

        const newRefs = [...cleaned, { ...asset, role, type, is_video: isVideo }];
        
        set({ 
            referenceImages: newRefs,
            referencesByMode: { ...referencesByMode, [generationMode]: newRefs }
        });
        return true;
    },

    removeReference: (idOrUrl) => set((s) => {
        const newRefs = typeof idOrUrl === 'number' 
            ? s.referenceImages.filter((_, i) => i !== idOrUrl)
            : s.referenceImages.filter((r) => r.url !== idOrUrl);
        
        return {
            referenceImages: newRefs,
            referencesByMode: { ...s.referencesByMode, [s.generationMode]: newRefs }
        };
    }),

    clearReferences: () => set((s) => ({ 
        referenceImages: [],
        referencesByMode: { ...s.referencesByMode, [s.generationMode]: [] }
    })),

    setReferenceImages: (refs) => set((s) => ({ 
        referenceImages: refs,
        referencesByMode: { ...s.referencesByMode, [s.generationMode]: refs }
    })),

    swapFrames: () => set((s) => {
        const refs  = [...s.referenceImages];
        const start = refs.findIndex((r) => r.role === "start");
        const end   = refs.findIndex((r) => r.role === "end");
        if (start === -1 || end === -1) return {};
        
        const newRefs = [...refs];
        newRefs[start] = { ...refs[end],   role: "start" };
        newRefs[end]   = { ...refs[start], role: "end"   };
        
        return { 
            referenceImages: newRefs,
            referencesByMode: { ...s.referencesByMode, [s.generationMode]: newRefs }
        };
    }),

}));
