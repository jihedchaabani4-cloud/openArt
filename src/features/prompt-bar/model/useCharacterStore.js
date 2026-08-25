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
 * [Zustand Store: useCharacterStore]
 * Dedicated store for Character Creation: Prompt, References, and Feature Form.
 * Completely stripped of legacy location/product bloat.
 */
export const useCharacterStore = create((set) => ({
  prompt: "",
  setPrompt: (text) => set({ prompt: text }),

  isGeneratingDescription: false,
  setIsGeneratingDescription: (loading) => set({ isGeneratingDescription: loading }),

  // Character Form / Traits State
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

  // Character References (Clean flat array)
  references: [],

  addReference: (asset, role = "normal", maxRefs = 4) => {
    set((state) => {
      const assetKey = getReferenceAssetKey(asset);
      const exists = state.references.find((ref) => getReferenceAssetKey(ref) === assetKey);
      if (exists || state.references.length >= maxRefs) return state;

      const isVideo = isVideoAsset(asset);
      const newRefs = [...state.references, { ...asset, role, type: isVideo ? "video" : "image", is_video: isVideo }];

      return { references: newRefs };
    });
  },

  removeReference: (assetId) => {
    set((state) => {
      const currentPrompt = state.prompt || "";
      const newPrompt = cleanMediaAssetTags(currentPrompt, [assetId]);

      return {
        prompt: newPrompt,
        references: state.references.filter((ref) => getReferenceAssetKey(ref) !== assetId),
      };
    });
  },

  clearReferences: () =>
    set((state) => {
      const currentPrompt = state.prompt || "";
      const newPrompt = cleanAllMediaAssetTags(currentPrompt);

      return {
        prompt: newPrompt,
        references: [],
      };
    }),

  setReferenceImages: (images) =>
    set((state) => {
      const currentRefs = state.references || [];
      const removedIds = currentRefs
        .filter((old) => !images.some((img) => img.asset_id === old.asset_id))
        .map((img) => img.asset_id);

      const newPrompt = cleanMediaAssetTags(state.prompt || "", removedIds);

      return {
        prompt: newPrompt,
        references: images,
      };
    }),

  hydrateCharacterDraft: ({
    prompt = "",
    references = [],
    features = null,
  } = {}) =>
    set({
      prompt,
      references,
      features: mergeElementFeatures(features),
    }),

  hydrateElementDraft: (opts = {}) =>
    set({
      prompt: opts?.prompt || "",
      references: opts?.references || [],
      features: mergeElementFeatures(opts?.features || null),
    }),

  toggleTagInPrompt: (label, info = {}) =>
    set((state) => {
      const currentPrompt = state.prompt || "";
      const tag = `<Trait: ${label}>`;
      const resolvedInfo = getFeatureInfoFromLabel(label);

      if (currentPrompt.includes(tag)) {
        return {
          prompt: currentPrompt.replace(tag, "").replace(/\s\s+/g, " ").trim(),
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
        prompt: (newPrompt + " " + tag).replace(/\s\s+/g, " ").trim(),
        features: applyFeatureSelection(state.features, resolvedInfo),
      };
    }),

  toggleMediaTag: (assetId) =>
    set((state) => {
      const currentPrompt = state.prompt || "";
      const tagRegex = new RegExp(`<MediaAsset:\\s*${assetId}>`, "gi");
      const tag = `<MediaAsset:${assetId}>`;

      if (tagRegex.test(currentPrompt)) {
        return {
          prompt: currentPrompt.replace(tagRegex, "").replace(/\s\s+/g, " ").trim(),
        };
      }

      return {
        prompt: (currentPrompt + " " + tag).replace(/\s\s+/g, " ").trim(),
      };
    }),

  resetCharacterStore: () =>
    set({
      prompt: "",
      references: [],
      features: createEmptyFeatures(),
      featureEditor: {
        open: false,
        activeTab: "identity",
        activeSubTab: "characterType",
      },
    }),

  resetElementStore: () =>
    set({
      prompt: "",
      references: [],
      features: createEmptyFeatures(),
      featureEditor: {
        open: false,
        activeTab: "identity",
        activeSubTab: "characterType",
      },
    }),
}));

// Backwards compatibility export
export const useElementStore = useCharacterStore;
export default useCharacterStore;
