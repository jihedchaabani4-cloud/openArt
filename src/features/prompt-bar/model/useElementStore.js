import { create } from "zustand";
import { getFeatureInfoFromLabel } from "./feature-constants";

const createEmptyFeatures = () => ({
  era: null,
  renderingStyle: null,
  identity: {
    characterType: null,
    gender: null,
    race: null,
    age: null,
    build: null,
    height: null,
  },
  head: {
    hairStyle: null,
    hairTexture: null,
    hairColor: null,
  },
  details: {
    eyeColor: null,
    skinCondition: null,
    rightArm: null,
    leftArm: null,
    rightLeg: null,
    leftLeg: null,
  },
  outfit: null,
});

function clearFeatureSelection(features, featureInfo) {
  if (!featureInfo?.section) return features;

  if (["outfit", "era", "renderingStyle"].includes(featureInfo.section)) {
    return {
      ...features,
      [featureInfo.section]: null,
    };
  }

  if (!featureInfo.key) return features;

  return {
    ...features,
    [featureInfo.section]: {
      ...features[featureInfo.section],
      [featureInfo.key]: null,
    },
  };
}

function applyFeatureSelection(features, featureInfo) {
  if (!featureInfo?.section) return features;

  if (["outfit", "era", "renderingStyle"].includes(featureInfo.section)) {
    return {
      ...features,
      [featureInfo.section]: featureInfo.value,
    };
  }

  if (!featureInfo.key) return features;

  return {
    ...features,
    [featureInfo.section]: {
      ...features[featureInfo.section],
      [featureInfo.key]: featureInfo.value,
    },
  };
}

function mergeElementFeatures(features) {
  const base = createEmptyFeatures();
  if (!features) return base;

  return {
    ...base,
    ...features,
    identity: {
      ...base.identity,
      ...features.identity,
    },
    head: {
      ...base.head,
      ...features.head,
    },
    details: {
      ...base.details,
      ...features.details,
    },
  };
}

function resolveFeatureEditorSelection(featureInfo) {
  if (!featureInfo?.section) {
    return { activeTab: "identity", activeSubTab: "characterType" };
  }

  if (["era", "renderingStyle", "outfit"].includes(featureInfo.section)) {
    return { activeTab: featureInfo.section, activeSubTab: null };
  }

  return {
    activeTab: featureInfo.section,
    activeSubTab: featureInfo.key || null,
  };
}

/**
 * useElementStore
 * Independent store for the Elements Prompt Bar.
 * Keeps track of element-specific prompts, references, and structured features.
 */
export const useElementStore = create((set) => ({
  prompts: {
    character: "",
    location: "",
    product: "",
  },
  setPrompt: (text) =>
    set((state) => ({
      prompts: {
        ...state.prompts,
        [state.elementMode]: text,
      },
    })),

  elementMode: "character",
  setElementMode: (mode) => set({ elementMode: mode }),

  features: createEmptyFeatures(),
  featureEditor: {
    open: false,
    activeTab: "identity",
    activeSubTab: "characterType",
  },

  setFeatureEditorOpen: (open) =>
    set((state) => ({
      featureEditor: {
        ...state.featureEditor,
        open,
      },
    })),

  setFeatureEditorView: ({ activeTab, activeSubTab = null }) =>
    set((state) => ({
      featureEditor: {
        ...state.featureEditor,
        activeTab: activeTab || state.featureEditor.activeTab,
        activeSubTab,
      },
    })),

  openFeatureEditorForLabel: (label) =>
    set((state) => {
      const featureInfo = getFeatureInfoFromLabel(label);
      const nextView = resolveFeatureEditorSelection(featureInfo);
      return {
        featureEditor: {
          ...state.featureEditor,
          ...nextView,
          open: true,
        },
      };
    }),

  updateFeature: (section, key, value, forceSet = false) =>
    set((state) => {
      const currentFeatures = state.features;

      if (["outfit", "era", "renderingStyle"].includes(section)) {
        const currentValue = currentFeatures[section];
        const newValue = !forceSet && currentValue === value ? null : value;
        return {
          features: {
            ...currentFeatures,
            [section]: newValue,
          },
        };
      }

      const sectionData = currentFeatures[section] || {};
      const newValue = !forceSet && sectionData[key] === value ? null : value;

      return {
        features: {
          ...currentFeatures,
          [section]: {
            ...sectionData,
            [key]: newValue,
          },
        },
      };
    }),

  clearFeatures: () => set({ features: createEmptyFeatures() }),

  references: {
    character: [],
    location: [],
    product: [],
  },

  addReference: (asset, role = "normal", maxRefs = 5) => {
    set((state) => {
      const modeRefs = state.references[state.elementMode] || [];

      const exists = modeRefs.find((ref) => ref.asset_id === asset.asset_id);
      if (exists || modeRefs.length >= maxRefs) return state;

      const isVideo =
        asset.is_video ||
        asset.url?.toLowerCase().endsWith(".mp4") ||
        asset.url?.toLowerCase().endsWith(".webm");

      const newRefs = [...modeRefs, { ...asset, role, type: isVideo ? "video" : "image", is_video: isVideo }];

      return {
        references: {
          ...state.references,
          [state.elementMode]: newRefs,
        },
      };
    });
  },

  removeReference: (assetId) => {
    set((state) => {
      const mode = state.elementMode;
      const currentPrompt = state.prompts[mode] || "";
      const tagRegex = new RegExp(`<MediaAsset:\\s*${assetId}>`, "gi");
      const newPrompt = currentPrompt.replace(tagRegex, "").replace(/\s\s+/g, " ").trim();

      return {
        prompts: {
          ...state.prompts,
          [mode]: newPrompt,
        },
        references: {
          ...state.references,
          [mode]: (state.references[mode] || []).filter((ref) => ref.asset_id !== assetId),
        },
      };
    });
  },

  clearReferences: () =>
    set((state) => {
      const mode = state.elementMode;
      const currentPrompt = state.prompts[mode] || "";
      const newPrompt = currentPrompt.replace(/<MediaAsset:\s*[a-f0-9-]+>/gi, "").replace(/\s\s+/g, " ").trim();

      return {
        prompts: {
          ...state.prompts,
          [mode]: newPrompt,
        },
        references: {
          ...state.references,
          [mode]: [],
        },
      };
    }),

  setReferenceImages: (images) =>
    set((state) => {
      const mode = state.elementMode;
      const currentRefs = state.references[mode] || [];
      const removedIds = currentRefs
        .filter(old => !images.some(img => img.asset_id === old.asset_id))
        .map(img => img.asset_id);
      
      let newPrompt = state.prompts[mode] || "";
      removedIds.forEach(id => {
        const tagRegex = new RegExp(`<MediaAsset:\\s*${id}>`, "gi");
        newPrompt = newPrompt.replace(tagRegex, "");
      });
      newPrompt = newPrompt.replace(/\s\s+/g, ' ').trim();

      return {
        prompts: {
          ...state.prompts,
          [mode]: newPrompt,
        },
        references: {
          ...state.references,
          [mode]: images,
        },
      };
    }),

  hydrateElementDraft: ({
    mode = "character",
    prompt = "",
    references = [],
    features = null,
  } = {}) =>
    set((state) => ({
      elementMode: mode,
      prompts: {
        ...state.prompts,
        [mode]: prompt,
      },
      references: {
        ...state.references,
        [mode]: references,
      },
      features: mergeElementFeatures(features),
    })),

  toggleTagInPrompt: (label, info = {}) =>
    set((state) => {
      const mode = state.elementMode;
      const currentPrompt = state.prompts[mode] || "";
      const tag = `<Trait: ${label}>`;
      const resolvedInfo = getFeatureInfoFromLabel(label);

      if (currentPrompt.includes(tag)) {
        return {
          prompts: {
            ...state.prompts,
            [mode]: currentPrompt.replace(tag, "").replace(/\s\s+/g, " ").trim(),
          },
          features: clearFeatureSelection(state.features, resolvedInfo),
        };
      }

      let newPrompt = currentPrompt;
      if (info.section) {
        const categoryTagsRegex = /<Trait:\s*([^>]+)>/gi;
        let matched;
        while ((matched = categoryTagsRegex.exec(currentPrompt)) !== null) {
          const foundInfo = getFeatureInfoFromLabel(matched[1].trim());
          const sameTopLevel = !info.key && foundInfo && foundInfo.section === info.section && foundInfo.key == null;
          const sameNested = info.key && foundInfo && foundInfo.section === info.section && foundInfo.key === info.key;
          if (sameTopLevel || sameNested) {
            newPrompt = newPrompt.replace(matched[0], "").trim();
          }
        }
      }

      return {
        prompts: {
          ...state.prompts,
          [mode]: (newPrompt + " " + tag).replace(/\s\s+/g, " ").trim(),
        },
        features: applyFeatureSelection(state.features, resolvedInfo),
      };
    }),

  toggleMediaTag: (assetId) =>
    set((state) => {
      const mode = state.elementMode;
      const currentPrompt = state.prompts[mode] || "";
      const tagRegex = new RegExp(`<MediaAsset:\\s*${assetId}>`, "gi");
      const tag = `<MediaAsset:${assetId}>`;

      if (tagRegex.test(currentPrompt)) {
        return {
          prompts: {
            ...state.prompts,
            [mode]: currentPrompt.replace(tagRegex, "").replace(/\s\s+/g, " ").trim(),
          },
        };
      }

      return {
        prompts: {
          ...state.prompts,
          [mode]: (currentPrompt + " " + tag).replace(/\s\s+/g, " ").trim(),
        },
      };
    }),

  resetElementStore: () =>
    set({
      prompts: { character: "", location: "", product: "" },
      elementMode: "character",
      references: { character: [], location: [], product: [] },
      features: createEmptyFeatures(),
      featureEditor: {
        open: false,
        activeTab: "identity",
        activeSubTab: "characterType",
      },
    }),
}));
