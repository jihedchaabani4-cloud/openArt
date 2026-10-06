"use client";

/**
 * LTX Generation Hook
 *
 * Handles the full async flow for LTX video generation:
 * 1. POST /api/ltx/generate → receives job_id
 * 2. Polls GET /api/ltx/status/:jobId every 5s until completed/failed
 * 3. Returns video_url on success
 *
 * Usage:
 *   const { generateLtxVideo, isGenerating } = useLtxGenerate();
 *   await generateLtxVideo(payload); // payload from PromptBar serialize()
 */

import { useState, useCallback, useRef } from "react";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120; // 10 minutes max

/**
 * Determines the LTX endpoint type based on whether input_image is present.
 * Used for polling — /api/ltx/status?endpoint=image-to-video
 */
function getLtxEndpoint(parameters = {}) {
  return parameters.input_image ? "image-to-video" : "text-to-video";
}

/**
 * @returns {{ generateLtxVideo: Function, isGenerating: boolean, error: string|null }}
 */
export function useLtxGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const generateLtxVideo = useCallback(async (payload) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Submit job
      const submitRes = await fetch("/api/ltx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const submitData = await submitRes.json();

      if (!submitData.ok || !submitData.job_id) {
        throw new Error(submitData.message || "LTX submission failed");
      }

      const { job_id } = submitData;
      const endpoint = getLtxEndpoint(payload.parameters);

      // Step 2: Poll for completion
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusRes = await fetch(`/api/ltx/status/${job_id}?endpoint=${endpoint}`);
        const statusData = await statusRes.json();

        if (!statusData.ok) {
          throw new Error(statusData.message || "LTX status check failed");
        }

        if (statusData.status === "completed") {
          return { video_url: statusData.video_url, job_id };
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.error?.message || "LTX generation failed");
        }

        // Still pending/processing — keep polling
      }

      throw new Error("LTX generation timed out after 10 minutes.");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateLtxVideo, isGenerating, error };
}
