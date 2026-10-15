import { useMemo, useCallback } from "react";
import { usePromptBarStore } from "../../store/usePromptBarStore.js";
import { calculateModelCredits } from "../../core/creditCalculationService.js";
import { getRatioIcon } from "../../ui/common/selectors/FlowPromptBoxSettings.jsx";

/**
 * usePromptBarGenerate
 * Encapsulates generation credit calculation, aspect ratio / variation resolution,
 * generate disabled state evaluation, and the generate execution lifecycle.
 *
 * @param {Object} options
 * @param {Object} [options.currentModel] - Currently selected model object
 * @param {string} [options.selectedId] - Currently selected model ID
 * @param {boolean} [options.isCurrentEligible] - Whether current model satisfies mode/subMode
 * @param {string} [options.activeMode] - Active generation mode ("image"|"video")
 * @param {string} [options.activeSubMode] - Active generation sub-mode ("frames"|"reference")
 * @param {*} [options.startVal] - Value in the start frame slot (if any)
 * @param {Function} [options.onGenerate] - Callback invoked with serialized payload
 * @param {boolean} [options.isGenerating] - External loading state flag
 */
export function usePromptBarGenerate({
  currentModel,
  selectedId,
  isCurrentEligible = false,
  activeMode = "image",
  activeSubMode = "frames",
  startVal,
  onGenerate,
  isGenerating: propIsGenerating = false,
  hasModels = true,
  template,
} = {}) {
  const prompt             = usePromptBarStore((s) => s.prompt);
  const storeTemplate      = usePromptBarStore((s) => s.template);
  const paramValues        = usePromptBarStore((s) => s.parameterValues);
  const storeIsGenerating  = usePromptBarStore((s) => s.isGenerating);
  const serializeAndEmit   = usePromptBarStore((s) => s.serialize);
  const beginSubmit        = usePromptBarStore((s) => s.beginSubmit);
  const endSubmit          = usePromptBarStore((s) => s.endSubmit);
  const setIsGenerating    = usePromptBarStore((s) => s.setIsGenerating);

  const effectiveTemplate = template || storeTemplate;
  const isGenerating = Boolean(propIsGenerating || storeIsGenerating);

  const currentRatio = paramValues.aspect_ratio || paramValues.ratio || "1:1";
  const currentRatioIcon = getRatioIcon(currentRatio);
  const currentCount = Number(paramValues.count || paramValues.variations) || 1;

  const estimatedCredits = useMemo(() => {
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [currentModel, paramValues, currentCount]);

  // Mandatory prompt length validation driven directly by template contract (PB-D-19)
  const cleanPrompt = (typeof prompt === "string" ? prompt : "").trim();
  const minPromptLength = effectiveTemplate?.minPromptLength ?? 0;
  const isPromptTooShort = minPromptLength > 0 && cleanPrompt.length < minPromptLength;

  // FR-SLOT-05: Generate is disabled in Frames mode if the Start Frame slot is empty, or if no eligible model is active.
  const isFramesMode = activeMode === "video" && activeSubMode === "frames";
  const modelNotReady = hasModels && (!selectedId || !isCurrentEligible);
  const isGenerateDisabled = isGenerating || modelNotReady || (isFramesMode && !startVal) || isPromptTooShort;


  const handleGenerate = useCallback(async () => {
    if (isGenerateDisabled || isGenerating) return;
    const token = typeof beginSubmit === "function" ? beginSubmit() : null;
    try {
      const result = serializeAndEmit();
      await onGenerate?.(result);
    } finally {
      if (typeof endSubmit === "function") {
        endSubmit(token);
      } else {
        setIsGenerating(false);
      }
    }
  }, [isGenerateDisabled, isGenerating, beginSubmit, endSubmit, serializeAndEmit, onGenerate, setIsGenerating]);

  return {
    currentRatio,
    currentRatioIcon,
    currentCount,
    estimatedCredits,
    isFramesMode,
    isGenerateDisabled,
    isGenerating,
    handleGenerate,
  };
}
