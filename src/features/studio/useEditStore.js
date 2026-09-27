import { create } from "zustand";
import { createEditPromptBarState } from "./core/promptBarState";
import {
  cleanAllMediaAssetTags,
  cleanMediaAssetTags,
  getReferenceAssetKey,
} from "./core/promptBarRules";

/**
 * useEditStore
 * Independent store for the Edit Prompt Bar.
 * Keeps track of edit-specific parameters, references, and status.
 */
export const useEditStore = create((set) => ({
  ...createEditPromptBarState(),

  setEditTarget: (target) => set({ editTarget: target }),
  clearEditTarget: () => set({ editTarget: null }),

  setPrompt: (prompt) => set({ prompt }),
  setModelId: (modelId) => set({ modelId }),
  setRatio: (ratio) => set({ ratio }),
  setQuality: (quality) => set({ quality }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCamera: (camera) => set({ camera }),
  setLighting: (lighting) => set({ lighting }),
  setStagedDna: (stagedDna) => set({ stagedDna }),
  setCameraDna: (cameraDna) =>
    set((state) => ({
      stagedDna: {
        ...state.stagedDna,
        camera_dna: cameraDna,
      },
    })),
  setLightingDna: (lightingDna) =>
    set((state) => ({
      stagedDna: {
        ...state.stagedDna,
        lighting_dna: lightingDna,
      },
    })),
  setUpscaleScale: (scale) => set({ upscaleScale: scale }),
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  addReference: (asset, role = "normal", maxRefs = 4) => {
    set((state) => {
      const assetKey = getReferenceAssetKey(asset);
      const exists = state.referenceImages.find((r) => getReferenceAssetKey(r) === assetKey);
      if (exists) return state;
      if (state.referenceImages.length >= maxRefs) return state;
      return { referenceImages: [...state.referenceImages, { ...asset, role }] };
    });
  },

  removeReference: (assetId) => {
    set((state) => ({
      prompt: cleanMediaAssetTags(state.prompt, [assetId]),
      referenceImages: state.referenceImages.filter((r) => getReferenceAssetKey(r) !== assetId),
    }));
  },

  clearReferences: () =>
    set((state) => ({
      prompt: cleanAllMediaAssetTags(state.prompt),
      referenceImages: [],
    })),

  setReferenceImages: (images) => set({ referenceImages: images }),

  patchEditTarget: (partial) =>
    set((state) =>
      state.editTarget
        ? { editTarget: { ...state.editTarget, ...partial } }
        : state
    ),

  resetEditStore: () => set(() => createEditPromptBarState()),
}));
