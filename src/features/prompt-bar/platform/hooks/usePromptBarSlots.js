import { useMemo, useCallback } from "react";
import { usePromptBarStore } from "../../store/usePromptBarStore.js";
import { getActiveSlots } from "../../core/media.js";

/**
 * usePromptBarSlots
 * Encapsulates active slots resolution, drawer parameter partitioning,
 * and keyframe swap handling.
 *
 * @param {Object} options
 * @param {Object} [options.featureConfig] - Feature configuration object
 * @param {Object} [options.type] - CompositionType layout configuration
 * @param {string} [options.activeMode] - Current active mode
 * @param {string} [options.activeSubMode] - Current active sub-mode
 * @param {Object} [options.currentModel] - Currently selected model object
 * @param {Object} [options.parameters] - Model parameters definition dictionary
 */
export function usePromptBarSlots({
  featureConfig,
  type,
  activeMode: propActiveMode,
  activeSubMode: propActiveSubMode,
  currentModel,
  parameters = {},
} = {}) {
  const storeActiveMode    = usePromptBarStore((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarStore((s) => s.activeSubMode);
  const paramValues        = usePromptBarStore((s) => s.parameterValues);
  const setParameter       = usePromptBarStore((s) => s.setParameter);

  const activeMode    = propActiveMode ?? (storeActiveMode || "image");
  const activeSubMode = propActiveSubMode ?? (storeActiveSubMode || "frames");

  const { layout = {}, referenceSlots = [] } = type || {};
  const hasModes = layout.showModeSelector !== false;

  // Active slot definitions — driven by featureConfig.COMPOSITION_REQUIREMENTS and currentModel.
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

  // Keyframe swap handler — reads/writes backend keys (not role names).
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
    setParameter(startKey, endVal);
    setParameter(endKey, startVal);
  }, [startKey, endKey, startVal, endVal, setParameter]);

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
