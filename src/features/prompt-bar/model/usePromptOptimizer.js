"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/shared/api/apiClient";

/**
 * usePromptOptimizer
 *
 * Calls POST /api/prompt/optimize with the current prompt text.
 * Returns the optimized prompt + metadata + loading state.
 *
 * Usage:
 *   const { optimize, optimizing, lastResult } = usePromptOptimizer();
 *   const result = await optimize("bnat jmila f plage");
 *   // result.optimized → "Beautiful women on a sunny beach, warm golden light..."
 */
export function usePromptOptimizer() {
    const [optimizing, setOptimizing] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [error, setError]           = useState(null);

    const optimize = useCallback(async (prompt, { mode = "image" } = {}) => {
        if (!prompt?.trim()) return null;

        setOptimizing(true);
        setError(null);

        try {
            const data = await apiClient.post("/prompt/optimize", { prompt, mode });
            if (!data?.ok) throw new Error(data?.message || "Optimization failed");

            const result = {
                optimized:        data.optimized,
                originalLanguage: data.originalLanguage,
                wasTranslated:    data.wasTranslated,
                wasEnhanced:      data.wasEnhanced,
                changesSummary:   data.changesSummary,
            };

            setLastResult(result);
            return result;
        } catch (err) {
            console.error("[usePromptOptimizer]", err);
            setError(err.message);
            return null;
        } finally {
            setOptimizing(false);
        }
    }, []);

    return { optimize, optimizing, lastResult, error };
}
