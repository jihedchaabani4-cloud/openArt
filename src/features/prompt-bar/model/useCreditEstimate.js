/**
 * useCreditEstimate
 * Computes the estimated credit cost for the current generation settings
 * directly from the model's pricing table (no API call needed).
 *
 * Supports both video and image models.
 */

import { useMemo } from "react";

/**
 * @param {object} params
 * @param {object}  params.selectedModel   - The full model object from projectData.modelConfig.models
 * @param {string}  params.generationMode  - "image" | "keyframe" | "multiref" | "motion" | etc.
 * @param {string}  params.duration        - e.g. "5s", "10s" (video only)
 * @param {string}  params.videoResolution - e.g. "720p" | "1080p" (video only)
 * @param {string}  params.quality         - e.g. "standard" | "hd" | "2k" | "4k" (image only)
 * @param {string}  params.operation       - "generated" | "edit" (image only)
 * @param {number}  params.count           - Number of outputs (default: 1)
 * @returns {{ credits: number|null, label: string }}
 */
export function useCreditEstimate({
    selectedModel,
    generationMode = "image",
    duration = "5s",
    videoResolution = "720p",
    quality = "standard",
    operation = "generated",
    count = 1,
} = {}) {
    const result = useMemo(() => {
        if (!selectedModel) return { credits: null, label: "" };

        const qty = Math.max(1, Number(count) || 1);
        const modelCategory = (selectedModel.category || selectedModel.type || "").toLowerCase();
        const isVideoModel = modelCategory === "video";

        const pricing = selectedModel.pricing;
        // ── Fallback if no table ──────────────────────────────────────────
        if (!pricing?.table) {
            if (isVideoModel) {
                const base = pricing?.baseCredits ?? 20;
                const perSec = pricing?.perSecondCredits ?? 4;
                const seconds = parseFloat(String(duration).replace("s", "")) || 5;
                const resKey = String(videoResolution || "720p").trim().toLowerCase();
                const multis = pricing?.resolutionMultipliers || { "720p": 1, "1080p": 1.5, "1440p": 2, "4k": 3 };
                const mult = multis[resKey] || 1;
                
                const credits = Math.ceil((base + (seconds * perSec)) * mult * qty);
                return { credits, label: `~${credits} cr` };
            } else {
                const op = operation === "edit" ? "edit" : "generated";
                const base = op === "edit" ? (pricing?.editBaseCredits ?? 10) : (pricing?.generatedBaseCredits ?? 10);
                
                let qualKey = String(quality || "standard").trim().toLowerCase();
                if (qualKey === "1k") qualKey = "standard";
                
                const multis = pricing?.qualityMultipliers || { standard: 1, hd: 1, "2k": 1.5, "4k": 2.5 };
                const mult = multis[qualKey] || multis["standard"] || 1;
                
                const credits = Math.ceil(base * mult * qty);
                return { credits, label: `~${credits} cr` };
            }
        }

        const table = pricing.table;

        // ── Video pricing (with table) ────────────────────────────────────
        if (isVideoModel) {
            const seconds = parseFloat(String(duration).replace("s", "")) || 5;
            const resKey  = String(videoResolution || "720p").trim().toLowerCase();

            if (table[resKey] && table[resKey][seconds] !== undefined) {
                const credits = Math.ceil(table[resKey][seconds] * qty);
                return { credits, label: `${credits} cr` };
            }

            const resTable = table[resKey] || table["720p"] || table["1080p"];
            if (resTable) {
                const durations = Object.keys(resTable).map(Number).sort((a, b) => a - b);
                const closest   = durations.reduce((prev, curr) =>
                    Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev
                );
                if (resTable[closest] !== undefined) {
                    const credits = Math.ceil(resTable[closest] * qty);
                    return { credits, label: `~${credits} cr` };
                }
            }
        }

        // ── Image pricing (with table) ────────────────────────────────────
        const op = operation === "edit" ? "edit" : "generated";
        let qualKey = String(quality || "standard").trim().toLowerCase();
        
        // Common mappings
        if (qualKey === "1k") qualKey = "standard";
        if (qualKey === "hd") qualKey = "hd";

        if (table[op]) {
            // Direct match or fallback to 'standard'
            const price = table[op][qualKey] ?? table[op]["standard"] ?? table[op]["hd"];
            if (price !== undefined) {
                const credits = Math.ceil(price * qty);
                return { credits, label: `${credits} cr` };
            }
        }

        console.warn(`[useCreditEstimate] No price found for ${op}.${qualKey} in table`, table);
        return { credits: null, label: "" };
    }, [selectedModel, generationMode, duration, videoResolution, quality, operation, count]);

    return result;
}
