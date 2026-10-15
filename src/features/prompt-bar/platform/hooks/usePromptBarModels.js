import { useEffect, useMemo } from "react";
import { usePromptBarStore } from "../../store/usePromptBarStore.js";
import { resolveModelIcon } from "../../core/modelManagement.js";

/**
 * usePromptBarModels
 * Encapsulates model synchronization, eligible model filtering by template/capability,
 * current model resolution, and default selection.
 *
 * @param {Object} options
 * @param {Array} [options.models] - Incoming models array from props
 * @param {Object} [options.type] - CompositionType layout configuration
 * @param {Object} [options.featureConfig] - Feature configuration object
 * @param {string} [options.activeMode] - Optional override for activeMode
 * @param {string} [options.activeSubMode] - Optional override for activeSubMode
 */
export function usePromptBarModels({
  models,
  type,
  featureConfig,
  activeMode: propActiveMode,
  activeSubMode: propActiveSubMode,
} = {}) {
  const storeActiveMode    = usePromptBarStore((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarStore((s) => s.activeSubMode);
  const modelsMap          = usePromptBarStore((s) => s.modelsMap);
  const selectedId         = usePromptBarStore((s) => s.selectedModelId);
  const setModels          = usePromptBarStore((s) => s.setModels);
  const selectModel        = usePromptBarStore((s) => s.selectModel);

  const activeMode    = propActiveMode ?? (storeActiveMode || "image");
  const activeSubMode = propActiveSubMode ?? (storeActiveSubMode || "frames");

  const { layout = {}, supportedDomains = [] } = type || {};
  const hasModes = layout.showModeSelector !== false;

  // Sync incoming models into the store
  useEffect(() => {
    if (models && models.length > 0) {
      setModels(models);
    }
  }, [models, setModels]);

  const allModelsList = useMemo(() => Object.values(modelsMap || {}), [modelsMap]);

  // Capability Filter: featureConfig decides which models are eligible for this mode+subMode.
  // Models list is master: adding references NEVER reduces or filters available models.
  const eligibleModels = useMemo(() => {
    if (!featureConfig) {
      if (!hasModes) {
        if (!supportedDomains.length) return allModelsList;
        return allModelsList.filter((m) => supportedDomains.includes(m.domain));
      }
      return allModelsList;
    }
    if (!hasModes) {
      if (!supportedDomains.length) return allModelsList;
      return allModelsList.filter((m) => supportedDomains.includes(m.domain));
    }
    return featureConfig.filterEligibleModels(allModelsList, activeMode, activeSubMode, {});
  }, [featureConfig, hasModes, supportedDomains, allModelsList, activeMode, activeSubMode]);

  const isCurrentEligible = useMemo(
    () => eligibleModels.some((m) => m.id === selectedId),
    [eligibleModels, selectedId]
  );
  const currentModel = isCurrentEligible && modelsMap ? modelsMap[selectedId] : null;
  const parameters = useMemo(() => currentModel?.parameters || {}, [currentModel]);
  const currentModelIcon = useMemo(() => {
    if (!currentModel) return null;
    return currentModel.icon || resolveModelIcon(currentModel);
  }, [currentModel]);

  // Auto-select first eligible model when current model does not satisfy mode/subMode parameter requirements
  useEffect(() => {
    if (eligibleModels.length > 0) {
      const isEligible = eligibleModels.some((m) => m.id === selectedId);
      if (!isEligible) {
        selectModel(eligibleModels[0].id);
      }
    } else {
      if (selectedId !== null) {
        selectModel(null);
      }
    }
  }, [eligibleModels, selectedId, selectModel]);

  const availableModes = useMemo(() => {
    return ["image", "video"].filter((mode) => {
      if (!featureConfig?.filterEligibleModels) return true;
      return featureConfig.filterEligibleModels(allModelsList, mode, null, {}).length > 0;
    });
  }, [featureConfig, allModelsList]);

  const availableSubModes = useMemo(() => {
    return ["frames", "reference"].filter((subMode) => {
      if (!featureConfig?.filterEligibleModels) return true;
      return featureConfig.filterEligibleModels(allModelsList, activeMode, subMode, {}).length > 0;
    });
  }, [featureConfig, allModelsList, activeMode]);

  return {
    allModelsList,
    eligibleModels,
    currentModel,
    isCurrentEligible,
    selectedId,
    parameters,
    currentModelIcon,
    availableModes,
    availableSubModes,
    selectModel,
  };
}
