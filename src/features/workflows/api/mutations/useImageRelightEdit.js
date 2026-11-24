// [FSD Layer: features/workflows/api/mutations] — In-Place Image Edit: Relight (`POST /api/images/relight`).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import { patchProjectCacheForImageEdit } from "./imageEditCache";

const HEX6_REGEX = /^#[0-9A-F]{6}$/;
const HEX3_REGEX = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/;

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/**
 * Normalizes a hex color into a strict uppercase 6-digit `#RRGGBB` string
 * required by `POST /api/images/relight`.
 */
export function normalizeRelightHexColor(raw, fallback = "#FFFFFF") {
  const cleaned = String(raw || "").trim().toUpperCase();
  if (HEX6_REGEX.test(cleaned)) return cleaned;
  const shortMatch = cleaned.match(HEX3_REGEX);
  if (shortMatch) {
    return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`;
  }
  return fallback;
}

/**
 * Builds the strict allowlisted payload for `POST /api/images/relight`.
 * Never includes forbidden fields (`model`, `media_id`, or raw image URLs).
 */
export function buildImageRelightPayload({
  workflowId,
  light_type = "soft",
  brightness = 50,
  color = "#FFFFFF",
  size = 50,
  rotation = 0,
  tilt = 0,
  distance,
  prompt = "",
  parameters = { resolution: "1k" },
}) {
  const cleanWorkflowId = String(workflowId || "").trim();
  if (!cleanWorkflowId) {
    throw new Error("workflow_id is required.");
  }

  const normalizedLightType =
    String(light_type || "soft").trim().toLowerCase() === "hard" ? "hard" : "soft";
  const normalizedBrightness = Math.round(clampNumber(brightness, 0, 100, 50));
  const normalizedSize = Math.round(clampNumber(size, 0, 100, 50));
  const normalizedRotation = Math.round(clampNumber(rotation, -180, 360, 0));
  const normalizedTilt = Math.round(clampNumber(tilt, -90, 90, 0));
  const normalizedColor = normalizeRelightHexColor(color, "#FFFFFF");
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";

  const safeParams = {};
  if (parameters && typeof parameters === "object") {
    if (parameters.resolution) safeParams.resolution = parameters.resolution;
    if (parameters.aspect_ratio) safeParams.aspect_ratio = parameters.aspect_ratio;
    if (parameters.output_format) safeParams.output_format = parameters.output_format;
  }

  const payload = {
    workflow_id: cleanWorkflowId,
    light_type: normalizedLightType,
    brightness: normalizedBrightness,
    color: normalizedColor,
    size: normalizedSize,
    rotation: normalizedRotation,
    tilt: normalizedTilt,
    ...(trimmedPrompt ? { prompt: trimmedPrompt } : {}),
    ...(Object.keys(safeParams).length > 0 ? { parameters: safeParams } : {}),
  };

  if (distance !== undefined && distance !== null && distance !== "") {
    payload.distance = Math.round(clampNumber(distance, 0, 100, 50));
  }

  return payload;
}

/**
 * In-Place Image Edit mutation for `POST /api/images/relight`.
 * Never retries on failure to prevent duplicate credit holds.
 */
export function useImageRelightEdit({ onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      workflowId,
      light_type = "soft",
      brightness = 50,
      color = "#FFFFFF",
      size = 50,
      rotation = 0,
      tilt = 0,
      distance,
      prompt = "",
      parameters = { resolution: "1k" },
    }) => {
      const payload = buildImageRelightPayload({
        workflowId,
        light_type,
        brightness,
        color,
        size,
        rotation,
        tilt,
        distance,
        prompt,
        parameters,
      });

      const res = await api.post("/images/relight", payload, { timeout: 20000 });
      if (res?.ok === false) {
        const err = new Error(res.message || "Failed to relight image.");
        err.code = res.code;
        throw err;
      }
      return res;
    },
    onSuccess: (res, variables) => {
      const projectId = variables?.projectId || res?.project_id || null;
      const workflowId = variables?.workflowId || res?.workflowId || null;

      if (res?.status === "processing" && !res?.needsCredits && res?.mediaId && projectId) {
        const projectKey = queryKeys.projectData.byProject(projectId);
        queryClient.setQueryData(projectKey, (old) =>
          patchProjectCacheForImageEdit(old, {
            workflowId,
            projectId,
            mediaId: res.mediaId,
            stepId: "image_relight",
            editType: "relight",
            editSettings: {
              light_type: variables?.light_type || "soft",
              brightness: variables?.brightness ?? 50,
              color: normalizeRelightHexColor(variables?.color, "#FFFFFF"),
              size: variables?.size ?? 50,
              rotation: variables?.rotation ?? 0,
              tilt: variables?.tilt ?? 0,
              ...(variables?.distance !== undefined ? { distance: variables.distance } : {}),
            },
          })
        );

        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: projectKey });
        }, 500);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.walletBalance() });
    },
    onError: (err) => {
      logger.error("image_relight_edit_failed", {
        message: err?.message,
        code: err?.code || err?.errorCode,
        status: err?.status,
      });
      if (typeof onError === "function") onError(err);
    },
  });
}

export default useImageRelightEdit;
