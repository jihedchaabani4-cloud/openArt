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

  generationMode: "image", // "image" | "keyframe" | "multiref" | "motion-control"
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

  motion: 50,
  setMotion: (motion) => set({ motion }),

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
      
      // Better exists check
      const exists = referenceImages.find((r) => 
        (asset.asset_id && r.asset_id === asset.asset_id) || 
        (asset.url && r.url === asset.url)
      );
      if (exists) return state;
      
      const isSingularRole = ["start", "end", "mc_image", "mc_video"].includes(role);
      
      // If adding a normal ref and max reached, abort
      if (!isSingularRole && referenceImages.length >= maxRefs) return state;

      const isVideo = asset.is_video || (asset.url?.toLowerCase().endsWith('.mp4') || asset.url?.toLowerCase().endsWith('.webm'));
      const isMotionMode = ["motion", "motion-control"].includes(generationMode);
      const isKeyframeMode = generationMode === "keyframe";
      const isSlottedMode = isMotionMode || isKeyframeMode;

      // 1. Block 'normal' refs in slotted modes (must use specific roles)
      if (isSlottedMode && role === "normal") {
        console.warn(`[usePromptStore] Blocked 'normal' ref in slotted mode: ${generationMode}. Use specific roles.`);
        return state;
      }

      // 2. Strict type-role enforcement for Motion
      if (isMotionMode) {
        if (role === "mc_video" && !isVideo) {
          console.warn("[usePromptStore] mc_video role requires a video.");
          return state;
        }
        if (role === "mc_image" && isVideo) {
          console.warn("[usePromptStore] mc_image role requires an image.");
          return state;
        }
      }

      // 3. Block videos in non-motion modes
      if (isVideo && !isMotionMode) {
        console.warn(`[usePromptStore] Videos only allowed in motion modes. Blocked for: ${generationMode}`);
        return state;
      }
      
      const type = isVideo ? "video" : "image";
      
      // Remove previous asset of the same singular role if replacing
      const filteredRefs = isSingularRole 
        ? referenceImages.filter(r => r.role !== role) 
        : referenceImages;
        
      const newRefs = [...filteredRefs, { ...asset, role, type, is_video: isVideo }];
      
      return { 
        referenceImages: newRefs,
        referencesByMode: { ...referencesByMode, [generationMode]: newRefs }
      };
    });
  },

  removeReference: (assetId) => {
    set((state) => {
      const newRefs = state.referenceImages.filter((r) => r.asset_id !== assetId);
      const tagRegex = new RegExp(`<MediaAsset:\\s*${assetId}>`, "gi");
      const newPrompt = state.prompt.replace(tagRegex, "").replace(/\s\s+/g, ' ').trim();

      return {
        prompt: newPrompt,
        referenceImages: newRefs,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs }
      };
    });
  },

  clearReferences: () => set((state) => {
    const newPrompt = state.prompt.replace(/<MediaAsset:\s*[a-f0-9-]+>/gi, "").replace(/\s\s+/g, ' ').trim();
    return { 
      prompt: newPrompt,
      referenceImages: [],
      referencesByMode: { ...state.referencesByMode, [state.generationMode]: [] }
    };
  }),

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

  updateReferenceRole: (assetId, role) => {
    set((state) => {
      const newRefs = state.referenceImages.map((r) => 
        (r.asset_id === assetId || r.workflow_id === assetId || r.id === assetId) 
          ? { ...r, role } 
          : r
      );
      return {
        referenceImages: newRefs,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs }
      };
    });
  },

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

  // ─── Global Drag State ─────────────────────────────────────────────────────
  isDraggingGalleryItem: false,
  draggedItem: null,
  setIsDraggingGalleryItem: (val) => set({ isDraggingGalleryItem: val }),
  setDraggedItem: (item) => set({ draggedItem: item }),
}));
