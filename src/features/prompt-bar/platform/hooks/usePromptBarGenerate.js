import { useMemo, useCallback } from "react";
import { usePromptBarState, usePromptBarService } from "../../store/PromptBarStoreContext.js";
import { calculateModelCredits } from "../../core/creditCalculationService.js";
import { getRatioIcon } from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings.jsx";

/**
 * usePromptBarGenerate
 * Encapsulates generation credit calculation, aspect ratio / variation resolution,
 * generate disabled state evaluation, and the generate execution lifecycle via the Public Service.
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
  const service           = usePromptBarService();
  const prompt            = usePromptBarState((s) => s.prompt);
  const storeTemplate     = usePromptBarState((s) => s.template);
  const paramValues       = usePromptBarState((s) => s.parameterValues);
  const storeIsGenerating = usePromptBarState((s) => s.isGenerating);

  const effectiveTemplate = template || storeTemplate;
  const isGenerating = Boolean(propIsGenerating || storeIsGenerating);

  const currentRatio = paramValues.aspect_ratio || paramValues.ratio || "1:1";
  const currentRatioIcon = getRatioIcon(currentRatio);
  const countParamKey = currentModel?.parameters
    ? ["count", "variations", "num_outputs", "n"].find((k) => Boolean(currentModel.parameters[k]))
    : null;
  const rawCount = countParamKey
    ? (paramValues[countParamKey] ?? currentModel.parameters[countParamKey]?.default)
    : !currentModel?.parameters
      ? (paramValues.count ?? paramValues.variations ?? paramValues.num_outputs ?? paramValues.n)
      : 1;
  const currentCount = Math.max(1, Number(rawCount) || 1);

  const estimatedCredits = useMemo(() => {
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [currentModel, paramValues, currentCount]);

  // Mandatory prompt length validation driven directly by template contract (PB-D-19)
  const cleanPrompt = (typeof prompt === "string" ? prompt : "").trim();
  const minPromptLength = effectiveTemplate?.minPromptLength ?? 0;
  const isPromptTooShort = minPromptLength > 0 && cleanPrompt.length < minPromptLength;

  // FR-SLOT-05 / ADR-0011: Generate in video mode allows Text-to-Video when startVal is empty as long as a prompt is provided.
  const isFramesMode = activeMode === "video" && activeSubMode === "frames";
  const modelNotReady = hasModels && (!selectedId || !isCurrentEligible);
  const isVideoMissingInput = isFramesMode && !startVal && cleanPrompt.length === 0;
  const isGenerateDisabled = isGenerating || modelNotReady || isVideoMissingInput || isPromptTooShort;

  const handleGenerate = useCallback(async () => {
    if (isGenerateDisabled || isGenerating) return;
    const token = service.beginSubmit();
    try {
      const result = service.serialize();
      await onGenerate?.(result);
    } finally {
      if (token !== null && token !== undefined) {
        service.endSubmit(token);
      } else {
        service.setIsGenerating(false);
      }
    }
  }, [isGenerateDisabled, isGenerating, service, onGenerate]);

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
