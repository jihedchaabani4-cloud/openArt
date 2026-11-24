// [FSD Layer: features/workflows/api/mutations] — In-Place Image Edit: Camera Angles (`POST /api/images/angles`).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import { patchProjectCacheForImageEdit } from "./imageEditCache";

/**
 * Builds the strict allowlisted payload for `POST /api/images/angles`.
 * Never includes forbidden fields (`model`, `media_id`, or raw image URLs).
 */
export function buildImageAnglesPayload({
  workflowId,
  rotation = 0,
  tilt = 0,
  zoom = 0,
  prompt = "",
  parameters = { resolution: "1k" },
}) {
  const cleanWorkflowId = String(workflowId || "").trim();
  if (!cleanWorkflowId) {
    throw new Error("workflow_id is required.");
  }

  const normalizedRotation = Number(rotation) || 0;
  const normalizedTilt = Number(tilt) || 0;
  const normalizedZoom = Number(zoom) || 0;
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";

  if (
    normalizedRotation === 0 &&
    normalizedTilt === 0 &&
    normalizedZoom === 0 &&
    !trimmedPrompt
  ) {
    throw new Error(
      "At least one camera angle adjustment (rotation, tilt, zoom) or prompt is required."
    );
  }

  const safeParams = {};
  if (parameters && typeof parameters === "object") {
    if (parameters.resolution) safeParams.resolution = parameters.resolution;
    if (parameters.aspect_ratio) safeParams.aspect_ratio = parameters.aspect_ratio;
    if (parameters.output_format) safeParams.output_format = parameters.output_format;
  }

  return {
    workflow_id: cleanWorkflowId,
    rotation: normalizedRotation,
    tilt: normalizedTilt,
    zoom: normalizedZoom,
    ...(trimmedPrompt ? { prompt: trimmedPrompt } : {}),
    ...(Object.keys(safeParams).length > 0 ? { parameters: safeParams } : {}),
  };
}

/**
 * Patches the Project Cache immediately with the new `processing` media row
 * and flips `is_primary = true` to mirror the server's immediate primary swap.
 */
export function patchProjectCacheForAnglesProcessing(
  oldData,
  { workflowId, projectId, mediaId, rotation, tilt, zoom }
) {
  return patchProjectCacheForImageEdit(oldData, {
    workflowId,
    projectId,
    mediaId,
    stepId: "image_angles",
    editType: "angles",
    editSettings: { rotation, tilt, zoom },
  });
}

/**
 * In-Place Image Edit mutation for `POST /api/images/angles`.
 * Never retries on failure to prevent duplicate credit holds.
 */
export function useImageAnglesEdit({ onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      workflowId,
      rotation = 0,
      tilt = 0,
      zoom = 0,
      prompt = "",
      parameters = { resolution: "1k" },
    }) => {
      const payload = buildImageAnglesPayload({
        workflowId,
        rotation,
        tilt,
        zoom,
        prompt,
        parameters,
      });

      const res = await api.post("/images/angles", payload, { timeout: 20000 });
      if (res?.ok === false) {
        const err = new Error(res.message || "Failed to adjust image angle.");
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
          patchProjectCacheForAnglesProcessing(old, {
            workflowId,
            projectId,
            mediaId: res.mediaId,
            rotation: variables?.rotation ?? 0,
            tilt: variables?.tilt ?? 0,
            zoom: variables?.zoom ?? 0,
          })
        );

        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: projectKey });
        }, 500);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.walletBalance() });
    },
    onError: (err) => {
      logger.error("image_angles_edit_failed", {
        message: err?.message,
        code: err?.code || err?.errorCode,
        status: err?.status,
      });
      if (typeof onError === "function") onError(err);
    },
  });
}

export default useImageAnglesEdit;
