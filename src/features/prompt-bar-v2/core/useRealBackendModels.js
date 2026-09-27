"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { adaptBackendModel } from "./backendModelAdapter";

/**
 * useRealBackendModels
 * 
 * Fetches the real Models Management catalog from the existing backend endpoints:
 * 1. Primary: GET /api/models (dedicated models facade)
 * 2. Fallback: GET /api/workflows/project-data/:projectId (project aggregated config)
 * 
 * Maps raw backend models through adaptBackendModel and provides rawModelsMap
 * for the architectural Debug Inspector.
 */
export function useRealBackendModels({ projectId = null } = {}) {
  return useQuery({
    queryKey: ["prompt-bar-v2", "real-models", projectId],
    queryFn: async () => {
      let rawList = null;
      let endpointUsed = "/models";

      // 1. Try GET /api/models
      try {
        const res = await api.get("/models");
        if (res && res.success && res.data?.models) {
          rawList = res.data.models;
          endpointUsed = "/api/models";
        } else if (res && Array.isArray(res.models)) {
          rawList = res.models;
          endpointUsed = "/api/models";
        } else if (Array.isArray(res)) {
          rawList = res;
          endpointUsed = "/api/models";
        }
      } catch (err) {
        console.warn("[useRealBackendModels] /models request failed, trying /workflows/project-data:", err.message);
      }

      // 2. Fallback to /workflows/project-data/:id if /models failed or returned empty
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

      const adaptedModels = [];
      const rawModelsMap = {};
      const modelsMap = {};

      for (const raw of rawList) {
        const adapted = adaptBackendModel(raw);
        adaptedModels.push(adapted);
        rawModelsMap[adapted.id] = raw;
        modelsMap[adapted.id] = adapted;
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
