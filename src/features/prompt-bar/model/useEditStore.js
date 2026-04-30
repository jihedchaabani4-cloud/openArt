import { create } from "zustand";

/**
 * useEditStore
 * Independent store for the Edit Prompt Bar.
 * Keeps track of edit-specific parameters, references, and status.
 */
export const useEditStore = create((set) => ({
  // ─── Edit Target (Workflow & Media) ───────────────────────────────────────
  editTarget: null, // { workflow_id, media_id, initialPrompt, model_name, etc }
  
  setEditTarget: (target) => set({ editTarget: target }),
  clearEditTarget: () => set({ editTarget: null }),

  // ─── Local Edit State ─────────────────────────────────────────────────────
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),

  modelId: "nanobana_pro",
  setModelId: (modelId) => set({ modelId }),

  ratio: "1:1",
  setRatio: (ratio) => set({ ratio }),

  quality: "standard",
  setQuality: (quality) => set({ quality }),

  activeTab: "describe", // describe | camera | upscale | extend | insert | remove
  setActiveTab: (tab) => set({ activeTab: tab }),

  camera: null,
  setCamera: (camera) => set({ camera }),

  lighting: null,
  setLighting: (lighting) => set({ lighting }),

  // ─── DNA State (from useStudioStore) ─────────────────────────────────────
  stagedDna: {
    camera_dna: {
      rotation: 0,
      tilt: 0,
      zoom: 0
    },
    lighting_dna: {
      angle: 0,
      elevation: 0,
      intensity: 5,
      type: 'soft',
      brightness: 40,
      color: '#ffffff'
    }
  },
  setStagedDna: (stagedDna) => set({ stagedDna }),
  setCameraDna: (cameraDna) => set((state) => ({
    stagedDna: {
      ...state.stagedDna,
      camera_dna: cameraDna
    }
  })),
  setLightingDna: (lightingDna) => set((state) => ({
    stagedDna: {
      ...state.stagedDna,
      lighting_dna: lightingDna
    }
  })),

  upscaleScale: "x2", // x2 | x4 | x8  (capped at 19 MP output)
  setUpscaleScale: (scale) => set({ upscaleScale: scale }),

  // ─── Selection for Inpainting/Editing ─────────────────────────────────────
  selection: null, // { x, y, width, height }
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  // ─── References for Edit Mode ─────────────────────────────────────────────
  referenceImages: [],
  
  addReference: (asset, role = "normal", maxRefs = 4) => {
    set((state) => {
      const exists = state.referenceImages.find((r) => r.asset_id === asset.asset_id);
      if (exists) return state;
      if (state.referenceImages.length >= maxRefs) return state;
      return { referenceImages: [...state.referenceImages, { ...asset, role }] };
    });
  },

  removeReference: (assetId) => {
    set((state) => ({
      referenceImages: state.referenceImages.filter((r) => r.asset_id !== assetId),
    }));
  },

  clearReferences: () => set({ referenceImages: [] }),

  setReferenceImages: (images) => set({ referenceImages: images }),

  // ─── Reset Store ──────────────────────────────────────────────────────────
  resetEditStore: () => set({
    editTarget: null,
    prompt: "",
    modelId: "nanobana_pro",
    ratio: "1:1",
    quality: "standard",
    activeTab: "describe",
    referenceImages: [],
  }),
}));
