import { create } from "zustand";

/**
 * usePromptStore
 * Independent store for the Normal Prompt Bar (Generation).
 * Keeps track of standard generation parameters, references, and status.
 */
export const usePromptStore = create((set, get) => ({
  // ─── Local UI State ───────────────────────────────────────────────────────
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),

  generationMode: "image", // "image" | "video" | "motion-control"
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

  modelId: "nanobana_pro",
  setModelId: (modelId) => set({ modelId }),

  ratio: "1:1",
  setRatio: (ratio) => set({ ratio }),

  quality: "2K",
  setQuality: (quality) => set({ quality }),

  count: 1,
  setCount: (count) => set({ count }),

  duration: "5s",
  setDuration: (duration) => set({ duration }),

  videoResolution: "1080p",
  setVideoResolution: (videoResolution) => set({ videoResolution }),

  // ─── Mode-specific references storage ─────────────────────────────────────
  referencesByMode: {
    image: [],
    video: [],
    "motion-control": [],
  },

  referenceImages: [],
  
  addReference: (asset, role = "normal", maxRefs = 4) => {
    set((state) => {
      const { referenceImages, generationMode, referencesByMode } = state;
      
      const exists = referenceImages.find((r) => r.asset_id === asset.asset_id);
      if (exists) return state;
      
      if (referenceImages.length >= maxRefs) return state;

      const isVideo = asset.is_video || (asset.url?.toLowerCase().endsWith('.mp4') || asset.url?.toLowerCase().endsWith('.webm'));
      const type = isVideo ? "video" : "image";
      
      const newRefs = [...referenceImages, { ...asset, role, type, is_video: isVideo }];
      
      return { 
        referenceImages: newRefs,
        referencesByMode: { ...referencesByMode, [generationMode]: newRefs }
      };
    });
  },

  removeReference: (assetId) => {
    set((state) => {
      const newRefs = state.referenceImages.filter((r) => r.asset_id !== assetId);
      return {
        referenceImages: newRefs,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs }
      };
    });
  },

  clearReferences: () => set((state) => ({ 
    referenceImages: [],
    referencesByMode: { ...state.referencesByMode, [state.generationMode]: [] }
  })),

  setReferenceImages: (images) => set((state) => ({ 
    referenceImages: images,
    referencesByMode: { ...state.referencesByMode, [state.generationMode]: images }
  })),

  swapFrames: () => set((state) => {
    const refs  = [...state.referenceImages];
    const start = refs.findIndex((r) => r.role === "start");
    const end   = refs.findIndex((r) => r.role === "end");
    if (start === -1 || end === -1) return state;
    
    const newRefs = [...refs];
    newRefs[start] = { ...refs[end],   role: "start" };
    newRefs[end]   = { ...refs[start], role: "end"   };
    
    return { 
      referenceImages: newRefs,
      referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs }
    };
  }),

  // ─── Reset Store ──────────────────────────────────────────────────────────
  resetPromptStore: () => set({
    prompt: "",
    generationMode: "image",
    modelId: "nanobana_pro",
    ratio: "1:1",
    quality: "2K",
    count: 1,
    duration: "5s",
    videoResolution: "1080p",
    referenceImages: [],
    referencesByMode: {
      image: [],
      video: [],
      "motion-control": [],
    },
  }),

  // ─── Popover State ────────────────────────────────────────────────────────
  popoverOpen: false,
  setPopoverOpen: (popoverOpen) => set({ popoverOpen }),
  togglePopover: () => set((state) => ({ popoverOpen: !state.popoverOpen })),
}));
