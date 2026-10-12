"use client";

/**
 * Prompt Bar Platform — Real Backend Models Hook
 *
 * Fetches the model catalog from the backend and maps it through adaptBackendCatalog.
 * Provides normalized ModelContracts to the Platform.
 *
 * US2: The Prompt Bar derives its parameter list entirely from the backend model manifest.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { adaptBackendCatalog } from "../core/modelManagement.js";

/**
 * Fetches and normalizes models from the backend.
 *
 * @param {{ projectId?: string|null }} options
 * @returns {{ models, modelsMap, rawModelsMap, isLoading, isError, error, refetch }}
 */
export function useRealBackendModels({ projectId = null } = {}) {
  return useQuery({
    queryKey: ["prompt-bar-platform", "real-models", projectId],
    queryFn: async () => {
      let rawList = null;
      let endpointUsed = "/api/models";

      // 1. Try GET /api/models
      try {
        const res = await api.get("/models");
        if (res?.success && res.data?.models) {
          rawList = res.data.models;
        } else if (Array.isArray(res?.models)) {
          rawList = res.models;
        } else if (Array.isArray(res)) {
          rawList = res;
        }
      } catch (err) {
        console.warn("[useRealBackendModels] /models failed, trying project-data:", err.message);
      }

      // 2. Fallback to /workflows/project-data/:id
      if (!rawList || rawList.length === 0) {
        endpointUsed = `/workflows/project-data/${projectId || "null"}`;
        const res = await api.get(endpointUsed);
        const data =
          res?.data?.data?.json ||
          res?.data?.json ||
          res?.result?.data?.json ||
          res?.json ||
          res?.data;

        if (data?.modelConfig?.models && Array.isArray(data.modelConfig.models)) {
          rawList = data.modelConfig.models;
        }
      }

      if (!rawList || !Array.isArray(rawList)) {
        throw new Error("Backend did not return a valid models array.");
      }

      const adaptedModels = adaptBackendCatalog(rawList);
      const modelsMap = {};
      const rawModelsMap = {};

      for (let i = 0; i < rawList.length; i++) {
        const adapted = adaptedModels[i];
        modelsMap[adapted.id] = adapted;
        rawModelsMap[adapted.id] = rawList[i];
      }

      return {
        models: adaptedModels,
        modelsMap,
        rawModelsMap,
        total: adaptedModels.length,
        dataSource: endpointUsed,
      };
    },
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
