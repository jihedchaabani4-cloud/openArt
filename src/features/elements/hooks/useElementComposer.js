// [FSD Layer: features/elements/hooks] — Composer-only hook (Phase-E split).
// Imports every small hook and assembles the unified element interface.
// No useMutation or useState here — all delegated to split hook files.
import { useCallback, useMemo } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowDelete } from "@/features/workflows/model/useWorkflowDelete";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";
import { useUpdateElementMetadata } from "./useUpdateElementMetadata";
import { useAddImageToElement } from "./useAddImageToElement";
import { useDeleteMediaItem } from "./useDeleteMediaItem";
import { useAnalyzeElementVision } from "./useAnalyzeElementVision";

/**
 * useElement (composer)
 * Owns: unified element data + actions interface.
 * Public: useElement({ projectId, elementId }) → full element hook shape.
 *
 * Individual mutations live in sibling files (1 hook / file).
 * This file ONLY composes them and assembles the return object.
 */
export function useElement({ projectId, elementId } = {}) {
  const cleanId = useMemo(() => {
    return stripWorkflowPrefix(elementId);
  }, [elementId]);

  const { data: projectData, isLoading } = useProjectData(projectId);

  // Mutations — imported from the split files per Phase-E plan
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
  const items = useMemo(() => workflow?.items || [], [workflow?.items]);

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

  // ─── Pre-bound Tool Actions ───

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
      return deleteMediaMutation.mutateAsync({ elementId: cleanId, mediaId, projectId });
    },
    [cleanId, projectId, deleteMediaMutation]
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
