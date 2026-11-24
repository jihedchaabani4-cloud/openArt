// [FSD Layer: features/workflows/api/mutations] — In-Place Image Edit: Remove Background (`POST /api/images/remove-background`).
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import { patchProjectCacheForImageEdit } from "./imageEditCache";

export const REMOVE_BACKGROUND_CATEGORY = "remove_background";
export const DEFAULT_REMOVE_BACKGROUND_MODEL = "bria_remove_background_3_0";
export const REMOVE_BACKGROUND_PROMPT_MAX_LENGTH = 2000;

const FORBIDDEN_PARAM_KEYS = new Set([
  "input_image",
  "image_url",
  "source",
  "source_url",
  "media_id",
  "mediaId",
  "source_media_id",
  "prompt",
  "preserve_alpha",
]);

const HTTP_URL_REGEX = /https?:\/\//i;

function containsHttpUrl(value) {
  if (typeof value === "string") return HTTP_URL_REGEX.test(value);
  if (Array.isArray(value)) return value.some(containsHttpUrl);
  if (value && typeof value === "object") {
    return Object.values(value).some(containsHttpUrl);
  }
  return false;
}

/**
 * Filters a raw `modelConfig.models` list down to active `remove_background` models.
 */
export function filterRemoveBackgroundModels(models) {
  if (!Array.isArray(models)) return [];
  return models.filter(
    (m) => m && typeof m === "object" && m.category === REMOVE_BACKGROUND_CATEGORY && Boolean(m.key)
  );
}

/**
 * Resolves the default remove-background model key (`bria_remove_background_3_0` if present,
 * otherwise the first dynamically returned `remove_background` model).
 */
export function resolveDefaultRemoveBackgroundModelKey(models) {
  const list = filterRemoveBackgroundModels(models);
  if (list.length === 0) return null;
  const preferred = list.find((m) => m.key === DEFAULT_REMOVE_BACKGROUND_MODEL);
  return preferred ? preferred.key : list[0].key;
}

/**
 * Reads the credit cost from a backend model descriptor (`pricing.defaultCost` or `pricing.table.default`).
 */
export function getRemoveBackgroundModelCost(model) {
  const raw = model?.pricing?.defaultCost ?? model?.pricing?.table?.default;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Builds the strict allowlisted payload for `POST /api/images/remove-background`.
 * Never includes forbidden fields (`media_id`, `input_image`, `image_url`, or any raw http(s) URL)
 * and omits `prompt` whenever the selected model does not declare `parameters.prompt`.
 */
export function buildImageRemoveBackgroundPayload({
  workflowId,
  model,
  modelSchema = null,
  prompt = "",
  preserve_alpha,
  parameters = {},
}) {
  const cleanWorkflowId = String(workflowId || "").trim();
  if (!cleanWorkflowId) {
    throw new Error("workflow_id is required.");
  }

  const cleanModel = String(model || modelSchema?.key || "").trim();
  const declaredParams =
    modelSchema?.parameters && typeof modelSchema.parameters === "object"
      ? modelSchema.parameters
      : null;

  const payload = {
    workflow_id: cleanWorkflowId,
  };

  if (cleanModel) {
    payload.model = cleanModel;
  }

  const supportsPrompt = declaredParams ? Boolean(declaredParams.prompt) : true;
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  if (supportsPrompt && trimmedPrompt) {
    if (trimmedPrompt.length > REMOVE_BACKGROUND_PROMPT_MAX_LENGTH) {
      throw new Error(`prompt must be at most ${REMOVE_BACKGROUND_PROMPT_MAX_LENGTH} characters.`);
    }
    payload.prompt = trimmedPrompt;
  }

  const supportsPreserveAlpha = declaredParams ? Boolean(declaredParams.preserve_alpha) : true;
  if (supportsPreserveAlpha && typeof preserve_alpha === "boolean") {
    payload.preserve_alpha = preserve_alpha;
  }

  const safeExtraParams = {};
  if (parameters && typeof parameters === "object") {
    for (const [key, val] of Object.entries(parameters)) {
      if (FORBIDDEN_PARAM_KEYS.has(key)) continue;
      if (declaredParams && !Object.prototype.hasOwnProperty.call(declaredParams, key)) continue;
      if (val === undefined || val === null || val === "") continue;
      if (containsHttpUrl(val)) continue;
      safeExtraParams[key] = val;
    }
  }

  if (Object.keys(safeExtraParams).length > 0) {
    payload.parameters = safeExtraParams;
  }

  return payload;
}

/**
 * Resolves `remove_background` models primarily from already-loaded `projectData.modelConfig.models`
 * (zero extra requests), falling back to `GET /api/models?category=remove_background` only when
 * the project payload does not include any `remove_background` models.
 */
export function useRemoveBackgroundModels({ projectModels = [], enabled = true } = {}) {
  const fromProject = React.useMemo(
    () => filterRemoveBackgroundModels(projectModels),
    [projectModels]
  );

  const fallbackQuery = useQuery({
    queryKey: queryKeys.models.byCategory(REMOVE_BACKGROUND_CATEGORY),
    queryFn: async () => {
      const res = await api.get(`/models?category=${REMOVE_BACKGROUND_CATEGORY}`);
      const list = res?.data?.models || res?.models || (Array.isArray(res) ? res : []);
      return filterRemoveBackgroundModels(list);
    },
    enabled: Boolean(enabled) && fromProject.length === 0,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const models = fromProject.length > 0 ? fromProject : fallbackQuery.data || [];

  return {
    models,
    isLoading: fromProject.length === 0 && fallbackQuery.isLoading,
    isError: fromProject.length === 0 && fallbackQuery.isError,
  };
}

/**
 * In-Place Image Edit mutation for `POST /api/images/remove-background`.
 * Never retries on failure to prevent duplicate credit holds.
 */
export function useImageRemoveBackgroundEdit({ onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({
      workflowId,
      model,
      modelSchema = null,
      prompt = "",
      preserve_alpha,
      parameters = {},
    }) => {
      const payload = buildImageRemoveBackgroundPayload({
        workflowId,
        model,
        modelSchema,
        prompt,
        preserve_alpha,
        parameters,
      });

      const res = await api.post("/images/remove-background", payload, { timeout: 20000 });
      if (res?.ok === false) {
        const err = new Error(res.message || "Failed to remove background.");
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
        const editSettings = {
          ...(variables?.model ? { model: variables.model } : {}),
          ...(typeof variables?.preserve_alpha === "boolean"
            ? { preserve_alpha: variables.preserve_alpha }
            : {}),
        };

        queryClient.setQueryData(projectKey, (old) =>
          patchProjectCacheForImageEdit(old, {
            workflowId,
            projectId,
            mediaId: res.mediaId,
            stepId: "image_remove_background",
            editType: "remove_background",
            editSettings,
          })
        );

        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: projectKey });
        }, 500);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.walletBalance() });
    },
    onError: (err) => {
      logger.error("image_remove_background_edit_failed", {
        message: err?.message,
        code: err?.code || err?.errorCode,
        status: err?.status,
      });
      if (typeof onError === "function") onError(err);
    },
  });
}

export default useImageRemoveBackgroundEdit;
