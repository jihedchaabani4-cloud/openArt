import { useEffect, useMemo } from "react";
import { usePromptBarState, usePromptBarService } from "../../store/PromptBarStoreContext.js";
import { resolveModelIcon, resolveEligibleModels } from "../../core/modelManagement.js";

/**
 * usePromptBarModels
 * Consumes ONLY the sealed Public Service & read-only selectors.
 * Uses the exact same resolveEligibleModels rule as the store (no post-render auto-select repair effect).
 */
export function usePromptBarModels({
  models,
  type,
  featureConfig,
  activeMode: propActiveMode,
  activeSubMode: propActiveSubMode,
} = {}) {
  const service            = usePromptBarService();
  const storeActiveMode    = usePromptBarState((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarState((s) => s.activeSubMode);
  const modelsMap          = usePromptBarState((s) => s.modelsMap);
  const selectedId         = usePromptBarState((s) => s.selectedModelId);
  const storeTemplate      = usePromptBarState((s) => s.template);

  const activeMode    = propActiveMode ?? (storeActiveMode || "image");
  const activeSubMode = propActiveSubMode ?? (storeActiveSubMode || "frames");

  const effectiveTemplate = featureConfig || storeTemplate || type || null;
  const { layout = {}, supportedDomains = [] } = type || effectiveTemplate || {};
  const hasModes = layout.showModeSelector !== false;

  // Sync incoming models catalog into the store (store synchronously picks eligible model + reconciles + drains pendingActions)
  useEffect(() => {
    if (!models || models.length === 0) return;
    const currentKeys = Object.keys(modelsMap || {});
    const needsSync =
      currentKeys.length !== models.length ||
      models.some((m) => modelsMap?.[m.id] !== m);
    if (needsSync) {
      service.setModels(models);
    }
  }, [models, modelsMap, service]);

  const allModelsList = useMemo(() => Object.values(modelsMap || {}), [modelsMap]);

  // ONE consistent eligibility rule shared with setModels, hydrate, and switchMode
  const eligibleModels = useMemo(() => {
    if (!hasModes) {
      if (!supportedDomains.length) return allModelsList;
      return allModelsList.filter((m) => supportedDomains.includes(m.domain));
    }
    return resolveEligibleModels(allModelsList, {
      template: effectiveTemplate,
      activeMode,
      activeSubMode,
    });
  }, [effectiveTemplate, hasModes, supportedDomains, allModelsList, activeMode, activeSubMode]);

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

  const availableModes = useMemo(() => {
    return ["image", "video"].filter((mode) => {
      if (!effectiveTemplate?.filterEligibleModels) return true;
      return resolveEligibleModels(allModelsList, {
        template: effectiveTemplate,
        activeMode: mode,
        activeSubMode: null,
      }).length > 0;
    });
  }, [effectiveTemplate, allModelsList]);

  const availableSubModes = useMemo(() => {
    return ["frames", "reference"].filter((subMode) => {
      if (!effectiveTemplate?.filterEligibleModels) return true;
      return resolveEligibleModels(allModelsList, {
        template: effectiveTemplate,
        activeMode,
        activeSubMode: subMode,
      }).length > 0;
    });
  }, [effectiveTemplate, allModelsList, activeMode]);

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
    selectModel: service.selectModel,
  };
}
