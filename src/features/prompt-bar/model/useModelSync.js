// src/features/prompt-bar/model/useModelSync.js
// Keeps the selected model aligned with the active generation mode
// without effect-driven setState loops.

import { useMemo, useState } from "react";

function supportsGenerationMode(model, generationMode) {
  if (!model) return false;

  if (generationMode === "motion" || generationMode === "motion-control") {
    return model.supportedModes?.includes("motion") || model.category === "motion";
  }

  if (generationMode === "keyframe") {
    return model.supportedModes?.includes("i2v_se") || model.supportedModes?.includes("i2v");
  }

  if (generationMode === "multiref") {
    return model.supportedModes?.includes("r2v");
  }

  if (["edit", "image", "character", "location", "product"].includes(generationMode)) {
    return model.category === "image" || model.category === generationMode;
  }

  return model.category === generationMode;
}

/**
 * @param {Array} studioModels
 * @param {boolean} _studioModelsLoading
 * @param {string} generationMode
 * @param {string|null} preferredModelId
 * @returns {{ model: { id: string } | null, setModel: Function, selectedModel: object | null, maxRefs: number }}
 */
export function useModelSync(studioModels, _studioModelsLoading, generationMode, preferredModelId = null) {
  const [manualModelId, setManualModelId] = useState(null);

  const supportedModels = useMemo(
    () => studioModels.filter((item) => supportsGenerationMode(item, generationMode)),
    [studioModels, generationMode]
  );

  const selectedModelId = useMemo(() => {
    if (preferredModelId) {
      const preferredModel = studioModels.find((item) => item.key === preferredModelId);
      if (supportsGenerationMode(preferredModel, generationMode)) {
        return preferredModel.key;
      }
    }

    if (manualModelId) {
      const manualModel = studioModels.find((item) => item.key === manualModelId);
      if (supportsGenerationMode(manualModel, generationMode)) {
        return manualModel.key;
      }
    }

    return supportedModels[0]?.key ?? studioModels[0]?.key ?? null;
  }, [preferredModelId, manualModelId, studioModels, supportedModels, generationMode]);

  const selectedModel = useMemo(
    () => studioModels.find((item) => item.key === selectedModelId) ?? null,
    [studioModels, selectedModelId]
  );

  let maxRefs = selectedModel?.support?.references?.max ?? 4;
  if (generationMode === "motion" || generationMode === "motion-control") {
    // Motion control always requires exactly 1 image and 1 video
    maxRefs = 2;
  }

  return {
    model: selectedModelId ? { id: selectedModelId } : null,
    setModel: (nextModel) => setManualModelId(nextModel?.id ?? null),
    selectedModel,
    maxRefs,
  };
}
