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

  updateFeature: (section, key, value, forceSet = false) => set((state) => {
    const currentFeatures = state.features;
    
    // Handle top-level features (like outfit)
    if (section === 'outfit') {
      const newValue = (!forceSet && currentFeatures.outfit === value) ? null : value;
      return {
        features: {
          ...currentFeatures,
          outfit: newValue
        }
      };
    }

    // Handle nested features (identity, appearance)
    const sectionData = currentFeatures[section] || {};
    const newValue = (!forceSet && sectionData[key] === value) ? null : value;

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

  /**
   * Unifies selection cards with the text bar.
   * Directly toggles a <Trait: Label> in the prompt string.
   */
  toggleTagInPrompt: (label, info = {}) => set((state) => {
    const mode = state.elementMode;
    const currentPrompt = state.prompts[mode] || "";
    const tag = `<Trait: ${label}>`;
    
    // 1. If it exists, remove it
    if (currentPrompt.includes(tag)) {
      return {
        prompts: {
          ...state.prompts,
          [mode]: currentPrompt.replace(tag, "").replace(/\s\s+/g, ' ').trim()
        }
      };
    }

    // 2. EXCLUSIVITY: If another tag in the SAME category exists, replace it
    // We use require to avoid circular imports if needed, but the constant is stable.
    const { getFeatureInfoFromLabel } = require("./feature-constants");

    let newPrompt = currentPrompt;
    if (info.section && info.key) {
      const categoryTagsRegex = /<Trait:\s*([^>]+)>/gi;
      let matched;
      while ((matched = categoryTagsRegex.exec(currentPrompt)) !== null) {
        const foundLabel = matched[1].trim();
        const foundInfo = getFeatureInfoFromLabel(foundLabel); 
        if (foundInfo && foundInfo.section === info.section && foundInfo.key === info.key) {
           newPrompt = newPrompt.replace(matched[0], "").trim();
        }
      }
    }

    // 3. Append the new tag
    return {
      prompts: {
        ...state.prompts,
        [mode]: (newPrompt + " " + tag).replace(/\s\s+/g, ' ').trim()
      }
    };
  }),

  /**
   * Directly toggles a <MediaAsset: uuid> in the prompt string.
   */
  toggleMediaTag: (assetId) => set((state) => {
    const mode = state.elementMode;
    const currentPrompt = state.prompts[mode] || "";
    const tag = `<MediaAsset: ${assetId}>`;

    if (currentPrompt.includes(tag)) {
      return {
        prompts: {
          ...state.prompts,
          [mode]: currentPrompt.replace(tag, "").replace(/\s\s+/g, ' ').trim()
        }
      };
    }

    return {
      prompts: {
        ...state.prompts,
        [mode]: (currentPrompt + " " + tag).replace(/\s\s+/g, ' ').trim()
      }
    };
  }),

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
