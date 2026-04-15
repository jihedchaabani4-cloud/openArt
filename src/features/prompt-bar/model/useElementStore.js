import { create } from "zustand";

/**
 * useElementStore
 * Independent store for the Elements Prompt Bar.
 * Keeps track of element-specific prompts, modes (Character, Location, General), and references.
 * Completely isolated from the main Generation usePromptStore.
 */
export const useElementStore = create((set, get) => ({
  // ─── Local UI State ───────────────────────────────────────────────────────
  prompts: {
    character: "",
    location: "",
    product: ""
  },
  setPrompt: (text) => set((state) => ({
    prompts: {
      ...state.prompts,
      [state.elementMode]: text
    }
  })),

  elementMode: "character", // "character" | "location" | "product"
  setElementMode: (mode) => set({ elementMode: mode }),

  features: {
    identity: {
      gender: null,
      race: null,
      age: null,
    },
    appearance: {
      build: null,
      height: null,
      eyeColor: null,
      hairStyle: null,
      hairTexture: null,
      hairColor: null,
      facialHair: null,
    },
    outfit: null,
  },

  updateFeature: (section, key, value) => set((state) => {
    const currentFeatures = state.features;
    
    // Handle top-level features (like outfit)
    if (section === 'outfit') {
      return {
        features: {
          ...currentFeatures,
          outfit: currentFeatures.outfit === value ? null : value
        }
      };
    }

    // Handle nested features (identity, appearance)
    const sectionData = currentFeatures[section] || {};
    const newValue = sectionData[key] === value ? null : value;

    return {
      features: {
        ...currentFeatures,
        [section]: {
          ...sectionData,
          [key]: newValue
        }
      }
    };
  }),

  references: {
    character: [],
    location: [],
    product: []
  },
  
  addReference: (asset, role = "normal", maxRefs = 5) => {
    set((state) => {
      const modeRefs = state.references[state.elementMode] || [];
      
      const exists = modeRefs.find((r) => r.asset_id === asset.asset_id);
      if (exists) return state;
      
      if (modeRefs.length >= maxRefs) return state;

      const isVideo = asset.is_video || (asset.url?.toLowerCase().endsWith('.mp4') || asset.url?.toLowerCase().endsWith('.webm'));
      const type = isVideo ? "video" : "image";
      
      const newRefs = [...modeRefs, { ...asset, role, type, is_video: isVideo }];
      
      return { 
        references: {
          ...state.references,
          [state.elementMode]: newRefs
        }
      };
    });
  },

  removeReference: (assetId) => {
    set((state) => ({
      references: {
        ...state.references,
        [state.elementMode]: (state.references[state.elementMode] || []).filter((r) => r.asset_id !== assetId)
      }
    }));
  },

  clearReferences: () => set((state) => ({
    references: {
      ...state.references,
      [state.elementMode]: []
    }
  })),

  setReferenceImages: (images) => set((state) => ({
    references: {
      ...state.references,
      [state.elementMode]: images
    }
  })),

  // ─── Reset Store ──────────────────────────────────────────────────────────
  resetElementStore: () => set({
    prompts: { character: "", location: "", product: "" },
    elementMode: "character",
    references: { character: [], location: [], product: [] },
    features: {
      identity: { gender: null, race: null, age: null },
      appearance: { 
        build: null, height: null, eyeColor: null, hairStyle: null, 
        hairTexture: null, hairColor: null, facialHair: null 
      },
      outfit: null,
    },
  }),

  // ─── Popover / Drag State (Local to Elements) ─────────────────────────────
  // We keep these separate so dragging in Elements doesn't flicker Generations
  isDraggingGalleryItem: false,
  draggedItem: null,
  setIsDraggingGalleryItem: (val) => set({ isDraggingGalleryItem: val }),
  setDraggedItem: (item) => set({ draggedItem: item }),
}));
