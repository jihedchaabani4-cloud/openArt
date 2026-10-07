import { useCallback, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore, useWorkflowDelete } from "@/features/workflows";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";

// ─── Element Workflows List Hook ──────────────────────────────────────────────

/**
 * useElementSheetWorkflows
 * Retrieves and filters all element workflows for a given project.
 */
export function useElementSheetWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];
  const elements = data?.projectContents?.elements ?? [];
  const filters = useWorkflowsStore((s) => s._elementFilters);

  const elementMap = useMemo(() => {
    const map = new Map();
    elements.forEach((e) => {
      if (e.workflow_id) map.set(e.workflow_id, e);
      if (e.id) map.set(e.id, e);
    });
    return map;
  }, [elements]);

  const allElements = useMemo(() => {
    return workflows
      .filter((w) => {
        const type = String(w.workflow_type || "").toUpperCase();
        return type === "ELEMENT_SHEET" || type === "ELEMENT";
      })
      .map((w) => {
        const elem = elementMap.get(w.id) || elementMap.get(w.name) || w.element || {};
        const items = media.filter((m) => m.workflowId === w.name || m.workflowId === w.id);
        const status = items[0]?.status || w.status || (items[0]?.url ? "success" : "processing");

        const rawGuidelines = elem.guidelines ?? w.guidelines ?? w.metadata?.guidelines ?? "";
        const cleanGuidelines = Array.isArray(rawGuidelines)
          ? rawGuidelines.join("\n")
          : String(rawGuidelines || "");

        return {
          ...w,
          element: elem,
          element_type: elem.element_type || "object",
          description: elem.description || "",
          guidelines: cleanGuidelines,
          items,
          status,
          isMultiMedia: items.length > 1,
        };
      });
  }, [workflows, media, elementMap]);

  const filteredElements = useMemo(() => {
    return allElements
      .filter((w) => {
        if (filters?.liked && !w.metadata?.favorited) return false;

        const config = w.items?.[0]?.generationConfig || {};
        const wPrompt = (config.prompt || "").toLowerCase();

        if (filters?.prompt?.trim()) {
          const q = filters.prompt.toLowerCase();
          if (
            !(w.name || "").toLowerCase().includes(q) &&
            !(w.metadata?.displayName || "").toLowerCase().includes(q) &&
            !wPrompt.includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.metadata?.createTime || 0).getTime();
        const tB = new Date(b.metadata?.createTime || 0).getTime();
        return filters?.sort === "oldest" ? tA - tB : tB - tA;
      });
  }, [allElements, filters]);

  return { workflows: filteredElements, isLoading, isError };
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * useCreateElementSheetMutation
 * Creates a new element sheet workflow with optimistic insertion.
 */
export function useCreateElementSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      const type = (payload.type || payload.element_type || payload.elementType || "").toLowerCase();

      const pId = payload.projectId || payload.project_id || useWorkflowsStore.getState().selectedProjectId;
      const finalPayload = {
        ...payload,
        projectId: pId,
        project_id: pId,
      };

      const endpoint = type === "character" ? "/characters/create" : "/v2/elements";
      const res = await api.post(endpoint, finalPayload);
      if (res.error) throw new Error(res.message || "Element creation failed");
      return res;
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};

      const projectId = payload.projectId || payload.project_id || useWorkflowsStore.getState().selectedProjectId;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-element-${Date.now()}`;
        const isCharacterType =
          payload.type === "character" ||
          payload.element_type === "character" ||
          payload.elementType === "character";

        const optimisticWorkflow = {
          id: optimisticId,
          name: optimisticId,
          projectId,
          workflow_type: isCharacterType ? "CHARACTER" : "ELEMENT_SHEET",
          metadata: {
            displayName:
              payload.name ||
              payload.prompt ||
              (isCharacterType ? "Untitled Character" : "Untitled Element"),
            createTime: new Date().toISOString(),
            favorited: false,
          },
        };

        const optimisticMedia = {
          id: `${optimisticId}-item`,
          name: `${optimisticId}-item`,
          url: null,
          status: "pending",
          projectId,
          workflowId: optimisticId,
          workflowStepId: "CAE",
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: "PRIVATE",
          },
          generationConfig: {
            prompt: payload.prompt,
            model: payload.model_name || payload.model,
          },
          image: {
            dimensions: { width: 1024, height: 1024 },
            generatedImage: null,
          },
        };

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])],
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Element sheet creation failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === "function") onError(err);
    },
    onSuccess: (res, inputData) => {
      const payload = inputData?.payload || inputData || {};
      const projectId =
        payload.projectId || payload.project_id || res?.workflow?.project_id || res?.element?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

/**
 * useUpdateElementMetadata
 * Partial updates for name, description, guidelines, and element_type.
 * Supports 0ms optimistic cache mutation.
 */
export function useUpdateElementMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, projectId, name, description, guidelines, elementType, element_type }) => {
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (description !== undefined) payload.description = description;
      if (guidelines !== undefined) {
        payload.guidelines = typeof guidelines === "string" ? guidelines : String(guidelines || "");
      }
      if (elementType !== undefined || element_type !== undefined) {
        payload.element_type = elementType || element_type;
      }

      const res = await api.patch(`/v2/elements/${workflowId}`, payload);
      return res;
    },
    onMutate: async ({ workflowId, projectId, name, description, guidelines, elementType, element_type }) => {
      if (!projectId) return {};
      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const nextType = elementType || element_type;
        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;

          const updatedWorkflows = (old.projectContents?.workflows || []).map((wf) => {
            if (wf.id !== workflowId && wf.name !== workflowId) return wf;
            return {
              ...wf,
              ...(name !== undefined ? { display_name: name } : {}),
              metadata: {
                ...(wf.metadata || {}),
                ...(name !== undefined ? { displayName: name } : {}),
                ...(nextType !== undefined ? { elementType: nextType } : {}),
              },
              element: {
                ...(wf.element || {}),
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(guidelines !== undefined ? { guidelines } : {}),
                ...(nextType !== undefined ? { element_type: nextType } : {}),
              },
            };
          });

          const updatedElements = (old.projectContents?.elements || []).map((el) => {
            if (el.workflow_id !== workflowId && el.id !== workflowId) return el;
            return {
              ...el,
              ...(name !== undefined ? { name } : {}),
              ...(description !== undefined ? { description } : {}),
              ...(guidelines !== undefined ? { guidelines } : {}),
              ...(nextType !== undefined ? { element_type: nextType } : {}),
            };
          });

          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: updatedWorkflows,
              elements: updatedElements,
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Element metadata update failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}

/**
 * useAddImageToElement
 * Attaches a reference image to an element.
 */
export function useAddImageToElement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ elementId, imageUrl, file, mediaId, projectId }) => {
      let body;
      let headers = {};
      if (file) {
        body = new FormData();
        body.append("file", file);
        if (projectId) body.append("projectId", projectId);
      } else {
        body = { imageUrl, mediaId, projectId };
      }
      const res = await api.post(`/v2/elements/${elementId}/images`, body, { headers });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}

/**
 * useDeleteMediaItem
 * Deletes a media item from an element/workflow.
 */
export function useDeleteMediaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId }) => {
      const res = await api.delete(`/workflows/media/${mediaId}`);
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}

/**
 * useAnalyzeElementVision
 * Performs AI multimodal vision analysis on element reference images.
 */
export function useAnalyzeElementVision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, workflowId, imageUrls, elementName, elementType }) => {
      const res = await api.post("/v2/elements/analyze", {
        projectId,
        workflowId,
        imageUrls,
        elementName,
        elementType,
      });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}

// ─── Unified Hook: useElement ────────────────────────────────────────────────

/**
 * useElement
 * Complete, self-contained hook that binds all element data, queries, mutations,
 * and high-level actions for a specific element workflow into a single interface.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.elementId - The element workflow ID
 */
export function useElement({ projectId, elementId } = {}) {
  const cleanId = useMemo(() => {
    return String(elementId || "").replace(/^workflows\//, "");
  }, [elementId]);

  const { data: projectData, isLoading } = useProjectData(projectId);

  // Mutations
  const updateMetadataMutation = useUpdateElementMetadata();
  const addImageMutation = useAddImageToElement();
  const deleteMediaMutation = useDeleteMediaItem();
  const analyzeVisionMutation = useAnalyzeElementVision();
  const { promptDelete, confirmDelete, isDeleting, isDeleteDialogOpen, setIsDeleteDialogOpen } = useWorkflowDelete();

  // Resolve workflow, element entity & media items from cache
  const workflow = useMemo(() => {
    if (!cleanId) return null;
    const rawWorkflows = projectData?.projectContents?.workflows ?? [];
    const rawMedia = projectData?.projectContents?.media ?? [];
    const rawElements = projectData?.projectContents?.elements ?? [];

    const found = rawWorkflows.find(
      (w) => (w.id || w.name) === cleanId || w.id === cleanId || w.name === cleanId
    );
    if (!found) return null;

    const targetWfId = found.id || found.name;
    const targetWfName = found.name || found.id;

    const elem =
      rawElements.find(
        (e) => e.workflow_id === targetWfId || e.workflow_id === targetWfName || e.id === targetWfId
      ) ||
      found.element ||
      {};

    const items = rawMedia
      .filter(
        (m) =>
          m.workflowId === targetWfId ||
          m.workflowId === targetWfName ||
          m.workflow_id === targetWfId ||
          m.workflow_id === targetWfName
      )
      .map((m) => ({
        ...m,
        asset_id: m.name || m.id,
        workflowStepId: m.workflowStepId || m.asset_type || "generation",
      }));

    return {
      ...found,
      id: targetWfId,
      element: elem,
      items,
    };
  }, [projectData, cleanId]);

  const element = workflow?.element || null;
  const items = workflow?.items || [];

  // Metadata & attributes
  const elementType = useMemo(() => {
    return (
      workflow?.element?.element_type ||
      workflow?.element_type ||
      workflow?.metadata?.elementType ||
      "object"
    );
  }, [workflow]);

  const typeConfig = useMemo(() => {
    return ELEMENT_TYPES.find((t) => t.id === elementType) || ELEMENT_TYPES[0];
  }, [elementType]);

  const guidelines = useMemo(() => {
    const raw =
      workflow?.element?.guidelines ?? workflow?.guidelines ?? workflow?.metadata?.guidelines ?? "";
    if (typeof raw === "string") {
      if (raw === "[]" || raw === '[""]') return "";
      return raw.trim();
    }
    if (Array.isArray(raw)) {
      return raw.map((g) => String(g).trim()).filter((g) => Boolean(g) && g !== "[]").join("\n");
    }
    return String(raw || "").trim();
  }, [workflow]);

  const displayTitle = useMemo(() => {
    return (
      workflow?.metadata?.displayName ||
      workflow?.display_name ||
      element?.name ||
      workflow?.name ||
      "Untitled Element"
    );
  }, [workflow, element]);

  const primaryMedia = useMemo(() => {
    return items[0] || null;
  }, [items]);

  // ── Pre-bound Tool Actions ──

  const saveMetadata = useCallback(
    async ({ name: nextName, description: nextDesc, guidelines: nextGuidelines, elementType: nextType } = {}) => {
      if (!cleanId) return;
      const payload = { workflowId: cleanId, projectId };
      if (nextName !== undefined) payload.name = nextName;
      if (nextDesc !== undefined) payload.description = nextDesc;
      if (nextGuidelines !== undefined) payload.guidelines = nextGuidelines;
      if (nextType !== undefined) payload.elementType = nextType;
      return updateMetadataMutation.mutateAsync(payload);
    },
    [cleanId, projectId, updateMetadataMutation]
  );

  const saveTitle = useCallback(
    async (text) => {
      const clean = String(text || "").replace(/^@+/, "").trim();
      return saveMetadata({ name: clean });
    },
    [saveMetadata]
  );

  const saveDescription = useCallback(
    async (text) => {
      return saveMetadata({ description: text });
    },
    [saveMetadata]
  );

  const saveGuidelines = useCallback(
    async (text) => {
      return saveMetadata({ guidelines: text });
    },
    [saveMetadata]
  );

  const saveElementType = useCallback(
    async (newType) => {
      return saveMetadata({ elementType: newType });
    },
    [saveMetadata]
  );

  const addImage = useCallback(
    async ({ file, imageUrl, mediaId }) => {
      if (!cleanId) return;
      return addImageMutation.mutateAsync({
        elementId: cleanId,
        file,
        imageUrl,
        mediaId,
        projectId,
      });
    },
    [cleanId, projectId, addImageMutation]
  );

  const deleteImage = useCallback(
    async (mediaId) => {
      if (!mediaId) return;
      return deleteMediaMutation.mutateAsync({ mediaId, projectId });
    },
    [projectId, deleteMediaMutation]
  );

  const analyzeVision = useCallback(
    async ({ imageUrls, elementName, elementType: visionType } = {}) => {
      if (!cleanId) return;
      const targetUrls =
        imageUrls ||
        items.map((item) => item.url || item.file_url || item.asset?.file_url).filter(Boolean);

      return analyzeVisionMutation.mutateAsync({
        projectId,
        workflowId: cleanId,
        imageUrls: targetUrls,
        elementName: elementName || displayTitle,
        elementType: visionType || elementType,
      });
    },
    [cleanId, projectId, items, displayTitle, elementType, analyzeVisionMutation]
  );

  const deleteElement = useCallback(() => {
    if (!cleanId) return;
    promptDelete({
      id: cleanId,
      projectId,
      workflowType: "ELEMENT",
    });
  }, [cleanId, projectId, promptDelete]);

  return {
    // Resolved Data
    workflow,
    element,
    items,
    guidelines,
    elementType,
    typeConfig,
    displayTitle,
    primaryMedia,

    // Status Flags
    isLoading,
    isUpdatingMetadata: updateMetadataMutation.isPending,
    isAddingImage: addImageMutation.isPending,
    isDeletingImage: deleteMediaMutation.isPending,
    isAnalyzingVision: analyzeVisionMutation.isPending,
    isDeleting,

    // Pre-bound Tool Actions
    saveMetadata,
    saveTitle,
    saveDescription,
    saveGuidelines,
    saveElementType,
    addImage,
    deleteImage,
    analyzeVision,
    deleteElement,
    promptDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    // Underlying Mutations (for direct usage)
    mutations: {
      updateMetadata: updateMetadataMutation,
      addImage: addImageMutation,
      deleteMedia: deleteMediaMutation,
      analyzeVision: analyzeVisionMutation,
    },
  };
}

export default useElement;
