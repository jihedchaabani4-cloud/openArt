import { useMemo } from "react";
import { calculateModelCredits } from "../core/creditCalculationService.js";

/**
 * @param {object} params
 * @param {object}  params.selectedModel   - The full model object from projectData.modelConfig.models
 * @param {string}  params.generationMode  - "image" | "keyframe" | "multiref" | "motion" | etc.
 * @param {string|number}  params.duration - e.g. "5s", "10s", 5, 8 (video only)
 * @param {string}  params.videoResolution - e.g. "720p" | "1080p" (video only)
 * @param {string}  params.quality         - e.g. "standard" | "hd" | "2k" | "4k" (image only)
 * @param {string}  params.resolution      - e.g. "1k" | "2k" | "4k"
 * @param {string}  params.operation       - "generated" | "edit" (image only)
 * @param {number}  params.count           - Number of outputs (default: 1)
 * @returns {{ credits: number|null, label: string }}
 */
export function useCreditEstimate({
    selectedModel,
    generationMode: _generationMode = "image",
    duration,
    videoResolution,
    resolution,
    quality,
    operation: _operation = "generated",
    count = 1,
} = {}) {
    const result = useMemo(() => {
        if (!selectedModel) return { credits: null, label: "" };

        const params = {
            duration,
            resolution: resolution || videoResolution,
            videoResolution,
            quality,
        };

        const credits = calculateModelCredits(selectedModel, params, count);
        return {
            credits,
            label: `${credits} cr`,
        };
    }, [selectedModel, duration, videoResolution, resolution, quality, count]);

    return result;
}
