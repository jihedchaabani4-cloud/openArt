// src/features/prompt-bar/model/useModelSync.js
// Keeps the selected model aligned with the active generation mode
// without effect-driven setState loops.

import { useMemo, useState } from "react";

function supportsGenerationMode(model, generationMode) {
  if (!model) return false;

  const isVideoMode = ["video", "keyframe", "motion", "motion-control"].includes(generationMode);
  const isVideoModel = model.category === "video" || model.supportedModes?.some(m => ["i2v", "t2v", "i2v_se", "motion"].includes(m));

  if (isVideoMode) {
    return isVideoModel;
  }

  if (generationMode === "multiref") {
    return model.supportedModes?.includes("r2v") || (model.support?.references?.max > 1);
  }

  if (["edit", "image", "character", "location", "product"].includes(generationMode)) {
    return model.category === "image" || model.category === generationMode;
  }

  return model.category === generationMode || model.supportedModes?.includes(generationMode);
}

/**
 * @param {Array} studioModels
 * @param {boolean} _studioModelsLoading
 * @param {string} generationMode
 * @param {string|null} preferredModelId
 * @returns {{ model: { id: string } | null, setModel: Function, selectedModel: object | null, maxRefs: number }}
 */
export function useModelSync(studioModels, _studioModelsLoading, generationMode, preferredModelId = null) {
  const supportedModels = useMemo(
    () => studioModels.filter((item) => supportsGenerationMode(item, generationMode)),
    [studioModels, generationMode]
  );

  const selectedModelId = useMemo(() => {
    // Fallback to preferred model from store
    if (preferredModelId) {
      const preferredModel = studioModels.find((item) => item.key === preferredModelId);
      if (supportsGenerationMode(preferredModel, generationMode)) {
        return preferredModel.key;
      }
    }

    return supportedModels[0]?.key ?? studioModels[0]?.key ?? null;
  }, [preferredModelId, studioModels, supportedModels, generationMode]);

  const selectedModel = useMemo(
    () => studioModels.find((item) => item.key === selectedModelId) ?? null,
    [studioModels, selectedModelId]
  );

  const maxRefs = useMemo(() => {
    if (!selectedModel?.support?.references) {
      return 1;
    }
    let count = selectedModel?.support?.references?.max ?? 4;
    if (generationMode === "motion" || generationMode === "motion-control") {
      count = 2;
    }
    // keyframe uses the model's own max (Row1 handles start-only vs start+end via supportsEndFrame = maxRefs >= 2)
    return count;
  }, [selectedModel, generationMode]);

  return {
    model: selectedModelId ? { id: selectedModelId } : null,
    selectedModel,
    maxRefs,
  };
}
