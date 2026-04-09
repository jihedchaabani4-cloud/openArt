// src/features/prompt-bar/model/useModelSync.js
// ✅ Single responsibility: keeps the selected model in sync with the generation mode.

import { useState, useEffect, useMemo } from "react";

/**
 * Manages model selection and auto-syncs it when generationMode changes.
 *
 * ✅ FIX: uses the SAME field ("category") for both the isMatch check
 *    and the studioModels.find() call — eliminating the type vs category bug.
 *
 * @param {Array}   studioModels
 * @param {boolean} studioModelsLoading
 * @param {string}  generationMode
 * @returns {{ model, setModel, selectedModel, maxRefs }}
 */
export function useModelSync(studioModels, studioModelsLoading, generationMode) {
  const [model, setModel] = useState(null);

  // Derive the full model object from the stored key
  const selectedModel = useMemo(
    () => studioModels.find((m) => m.key === model?.id) ?? null,
    [studioModels, model?.id]
  );

  const maxRefs = selectedModel?.support?.references?.max ?? 4;

  // Init: pick the first available model on load
  useEffect(() => {
    if (!model && studioModels.length > 0) {
      setModel({ id: studioModels[0].key });
    }
  }, [studioModels, model]);

  // ✅ FIX: both isMatch and find use "category" — consistent field
  useEffect(() => {
    if (studioModelsLoading || studioModels.length === 0) return;

    const isMatch = generationMode === "motion"
      ? selectedModel?.supportedModes?.includes("motion") || selectedModel?.category === "motion"
      : generationMode === "keyframe"
      ? selectedModel?.supportedModes?.includes("i2v_se") || selectedModel?.supportedModes?.includes("i2v")
      : generationMode === "multiref"
      ? selectedModel?.supportedModes?.includes("r2v")
      : (generationMode === "edit" ? selectedModel?.category === "image" : selectedModel?.category === generationMode);

    if (!isMatch) {
      const next =
        studioModels.find((m) => 
          generationMode === "motion"
            ? m.supportedModes?.includes("motion") || m.category === "motion"
            : generationMode === "keyframe"
            ? m.supportedModes?.includes("i2v_se") || m.supportedModes?.includes("i2v")
            : generationMode === "multiref"
            ? m.supportedModes?.includes("r2v")
            : (generationMode === "edit" ? m.category === "image" : m.category === generationMode)
        ) ?? studioModels[0];
        
      if (next) setModel({ id: next.key });
    }
  }, [generationMode, studioModels, studioModelsLoading, selectedModel]);

  return { model, setModel, selectedModel, maxRefs };
}
