import { create } from "zustand";
import { 
  createEmptyFeatures,
  applyFeatureSelection,
  clearFeatureSelection,
  mergeElementFeatures,
  resolveFeatureEditorSelection,
  getFeatureInfoFromLabel,
} from "./feature-constants";
import { cleanAllMediaAssetTags, cleanMediaAssetTags, isVideoAsset, getReferenceAssetKey } from "./core/promptBarRules";

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
      const assetKey = getReferenceAssetKey(asset);

      const exists = modeRefs.find((ref) => getReferenceAssetKey(ref) === assetKey);
      if (exists || modeRefs.length >= maxRefs) return state;

      const isVideo = isVideoAsset(asset);
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
      const newPrompt = cleanMediaAssetTags(currentPrompt, [assetId]);

      return {
        prompts: {
          ...state.prompts,
          [mode]: newPrompt,
        },
        references: {
          ...state.references,
          [mode]: (state.references[mode] || []).filter((ref) => getReferenceAssetKey(ref) !== assetId),
        },
      };
    });
  },

  clearReferences: () =>
    set((state) => {
      const mode = state.elementMode;
      const currentPrompt = state.prompts[mode] || "";
      const newPrompt = cleanAllMediaAssetTags(currentPrompt);

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
        .filter((old) => !images.some((img) => img.asset_id === old.asset_id))
        .map((img) => img.asset_id);

      const newPrompt = cleanMediaAssetTags(state.prompts[mode] || "", removedIds);

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
