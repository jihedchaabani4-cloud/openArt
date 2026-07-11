import { useMemo } from "react";
import {
  selectMaxRefsForModel,
  selectModelByKey,
  selectPreferredModelKey,
} from "./core/promptBarSelectors";

/**
 * @param {Array} studioModels
 * @param {boolean} _studioModelsLoading
 * @param {string} generationMode
 * @param {string|null} preferredModelId
 * @returns {{ model: { id: string } | null, setModel: Function, selectedModel: object | null, maxRefs: number }}
 */
export function useModelSync(studioModels, _studioModelsLoading, generationMode, preferredModelId = null) {
  const selectedModelId = useMemo(() => {
    return selectPreferredModelKey(studioModels, generationMode, preferredModelId);
  }, [preferredModelId, studioModels, generationMode]);

  const selectedModel = useMemo(
    () => selectModelByKey(studioModels, selectedModelId),
    [studioModels, selectedModelId]
  );

  const maxRefs = useMemo(() => {
    return selectMaxRefsForModel(selectedModel, generationMode);
  }, [selectedModel, generationMode]);

  return {
    model: selectedModelId ? { id: selectedModelId } : null,
    selectedModel,
    maxRefs,
  };
}
