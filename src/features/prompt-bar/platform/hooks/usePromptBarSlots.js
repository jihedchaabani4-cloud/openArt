import { useMemo, useCallback } from "react";
import { usePromptBarState, usePromptBarService } from "../../store/PromptBarStoreContext.js";
import { getActiveSlots } from "../../core/media.js";

/**
 * usePromptBarSlots
 * Encapsulates active slots resolution, drawer parameter partitioning,
 * and atomic keyframe swap handling via the Public Service.
 */
export function usePromptBarSlots({
  featureConfig,
  type,
  activeMode: propActiveMode,
  activeSubMode: propActiveSubMode,
  currentModel,
  parameters = {},
} = {}) {
  const service            = usePromptBarService();
  const storeActiveMode    = usePromptBarState((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarState((s) => s.activeSubMode);
  const paramValues        = usePromptBarState((s) => s.parameterValues);

  const activeMode    = propActiveMode ?? (storeActiveMode || "image");
  const activeSubMode = propActiveSubMode ?? (storeActiveSubMode || "frames");

  const { layout = {}, referenceSlots = [] } = type || {};
  const hasModes = layout.showModeSelector !== false;

  const activeSlots = useMemo(() => {
    return getActiveSlots({
      featureConfig,
      hasModes,
      referenceSlots,
      mode: activeMode,
      subMode: activeSubMode,
      model: currentModel,
    });
  }, [featureConfig, hasModes, referenceSlots, activeMode, activeSubMode, currentModel]);

  const hasStart = activeSlots.some((s) => s.role === "start");
  const hasEnd   = activeSlots.some((s) => s.role === "end");
  const showSwap = activeMode === "video" && activeSubMode === "frames" && hasStart && hasEnd;

  // Separate generation params from media params for drawer display
  const drawerParams = useMemo(() => {
    return Object.entries(parameters || {}).filter(
      ([, def]) => def.group !== "media" && !def.isPrompt
    );
  }, [parameters]);

  const startKey = featureConfig?.resolveParameterMapping
    ? featureConfig.resolveParameterMapping(currentModel, "start")
    : null;
  const endKey = featureConfig?.resolveParameterMapping
    ? featureConfig.resolveParameterMapping(currentModel, "end")
    : null;
  const startVal = startKey ? paramValues[startKey] : undefined;
  const endVal   = endKey ? paramValues[endKey] : undefined;
  const swapEnabled = Boolean(startVal && endVal);

  const handleSwapFrames = useCallback(() => {
    if (!startKey || !endKey) return;
    service.swapFrames();
  }, [startKey, endKey, service]);

  return {
    activeSlots,
    hasStart,
    hasEnd,
    showSwap,
    drawerParams,
    startKey,
    endKey,
    startVal,
    endVal,
    swapEnabled,
    handleSwapFrames,
  };
}
