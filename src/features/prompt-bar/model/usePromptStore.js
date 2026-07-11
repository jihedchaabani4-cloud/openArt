import { create } from "zustand";
import {
  createPromptBarState,
  createPromptBarReferencesByMode,
} from "./core/promptBarState";
import {
  cleanAllMediaAssetTags,
  cleanMediaAssetTags,
  getReferenceAssetKey,
  normalizeGenerationMode,
  shouldAllowReferenceAdd,
} from "./core/promptBarRules";

/**
 * usePromptStore
 * Independent store for the Normal Prompt Bar (Generation).
 * Keeps track of standard generation parameters, references, and status.
 */
export const usePromptStore = create((set, get) => ({
  ...createPromptBarState(),

  setPrompt: (prompt) => set({ prompt }),

  setGenerationMode: (mode) => {
    const normalized = normalizeGenerationMode(mode);
    const { generationMode, referenceImages, referencesByMode } = get();
    if (normalized === generationMode) return;

    const updatedByMode = {
      ...createPromptBarReferencesByMode(referencesByMode),
      [generationMode]: referenceImages,
    };

    let newRefs = updatedByMode[normalized];
    if (newRefs === undefined && normalized === "keyframe") {
      newRefs = updatedByMode.video;
    }

    set({
      generationMode: normalized,
      referencesByMode: updatedByMode,
      referenceImages: newRefs ?? [],
    });
  },

  setModelId: (modelId) => set({ modelId }),
  setRatio: (ratio) => set({ ratio }),
  setQuality: (quality) => set({ quality }),
  setCount: (count) => set({ count }),
  setDuration: (duration) => set({ duration }),
  setVideoResolution: (videoResolution) => set({ videoResolution }),
  setMotion: (motion) => set({ motion }),

  addReference: (asset, role = "normal", maxRefs = 4) => {
    set((state) => {
      const { referenceImages, generationMode, referencesByMode } = state;
      const assetKey = getReferenceAssetKey(asset);
      const exists = referenceImages.find((r) => getReferenceAssetKey(r) === assetKey);
      if (exists) return state;

      const validation = shouldAllowReferenceAdd({
        generationMode,
        role,
        asset,
        referenceImages,
        maxRefs,
      });

      if (!validation.ok) {
        console.warn(`[usePromptStore] ${validation.reason}`);
        return state;
      }

      const nextRole = validation.nextRole ?? role;
      const isVideo = validation.isVideo;
      const isSingularRole = ["start", "end", "mc_image", "mc_video"].includes(nextRole);
      const type = isVideo ? "video" : "image";
      const filteredRefs = isSingularRole ? referenceImages.filter((r) => r.role !== nextRole) : referenceImages;
      const newRefs = [...filteredRefs, { ...asset, role: nextRole, type, is_video: isVideo }];

      return {
        referenceImages: newRefs,
        referencesByMode: { ...referencesByMode, [generationMode]: newRefs },
      };
    });
  },

  removeReference: (assetId) => {
    set((state) => {
      const newRefs = state.referenceImages.filter((r) => getReferenceAssetKey(r) !== assetId);
      const newPrompt = cleanMediaAssetTags(state.prompt, [assetId]);

      return {
        prompt: newPrompt,
        referenceImages: newRefs,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs },
      };
    });
  },

  clearReferences: () =>
    set((state) => {
      const newPrompt = cleanAllMediaAssetTags(state.prompt);
      return {
        prompt: newPrompt,
        referenceImages: [],
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: [] },
      };
    }),

  setReferenceImages: (images) =>
    set((state) => {
      const removedIds = state.referenceImages
        .filter((old) => !images.some((img) => img.asset_id === old.asset_id))
        .map((img) => img.asset_id);

      const newPrompt = cleanMediaAssetTags(state.prompt, removedIds);

      return {
        prompt: newPrompt,
        referenceImages: images,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: images },
      };
    }),

  swapFrames: () =>
    set((state) => {
      const refs = [...state.referenceImages];
      const start = refs.findIndex((r) => r.role === "start");
      const end = refs.findIndex((r) => r.role === "end");
      if (start === -1 || end === -1) return state;

      const newRefs = [...refs];
      newRefs[start] = { ...refs[end], role: "start" };
      newRefs[end] = { ...refs[start], role: "end" };

      return {
        referenceImages: newRefs,
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs },
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
        referencesByMode: { ...state.referencesByMode, [state.generationMode]: newRefs },
      };
    });
  },

  resetPromptStore: () =>
    set(() => createPromptBarState()),

  setPopoverOpen: (popoverOpen) => set({ popoverOpen }),
  togglePopover: () => set((state) => ({ popoverOpen: !state.popoverOpen })),

  setIsDraggingGalleryItem: (val) => set({ isDraggingGalleryItem: val }),
  setDraggedItem: (item) => set({ draggedItem: item }),
}));
