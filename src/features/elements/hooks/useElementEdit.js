"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useElement } from "./useElement";
import { useProjectData, useSetPrimaryMedia } from "@/features/workflows/api/workflowsApi";

/**
 * useElementEdit
 * Custom controller hook for the Element Edit view.
 * Encapsulates all state, form synchronization, file uploads, popovers,
 * and cover-setting logic, keeping the Page purely presentational.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.workflowId
 */
export function useElementEdit({ projectId, workflowId }) {
  const router = useRouter();

  // Low-level element data and mutations hook
  const {
    workflow,
    element,
    items,
    guidelines,
    elementType,
    typeConfig,
    displayTitle,
    isLoading,
    isAnalyzingVision,
    saveTitle,
    saveDescription,
    saveGuidelines,
    saveElementType,
    addImage,
    deleteImage,
    analyzeVision,
    promptDelete,
    confirmDelete,
    isDeleting,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  } = useElement({ projectId, elementId: workflowId });

  const { data: projectData } = useProjectData(projectId);
  const setPrimaryMediaMutation = useSetPrimaryMedia();

  // Local draft states
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftGuidelines, setDraftGuidelines] = useState("");
  const [draftElementType, setDraftElementType] = useState("object");
  const [deletingMediaId, setDeletingMediaId] = useState(null);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);

  // Sync draft states when underlying query data changes
  useEffect(() => {
    if (displayTitle) {
      setDraftTitle(displayTitle);
    }
  }, [displayTitle]);

  useEffect(() => {
    setDraftDesc(element?.description || "");
  }, [element?.description]);

  useEffect(() => {
    setDraftGuidelines(guidelines || "");
  }, [guidelines]);

  useEffect(() => {
    if (elementType) {
      setDraftElementType(elementType);
    }
  }, [elementType]);

  // Auto-redirect if element workflow is not found after loading
  useEffect(() => {
    if (!isLoading && !workflow && projectData) {
      router.replace(`/cinema-studio/${projectId}/elements`);
    }
  }, [isLoading, workflow, projectData, router, projectId]);

  // Primary cover image ID
  const primaryMediaId = useMemo(() => {
    return workflow?.primary_media_id || items[0]?.id || items[0]?.name || null;
  }, [workflow, items]);

  // Upload multiple files handler
  const handleUploadFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      for (const file of files) {
        try {
          await addImage({ file });
        } catch (err) {
          console.error("Failed to upload element image:", err);
        }
      }
    },
    [addImage]
  );

  // Add media from library assets handler
  const handleAddFromAssets = useCallback(
    async (selectedAssets) => {
      if (!selectedAssets || selectedAssets.length === 0) return;
      for (const asset of selectedAssets) {
        const mediaId = asset.id || asset.asset_id || asset.name;
        const imageUrl = asset.url || asset.file_url || asset.asset?.file_url;
        try {
          await addImage({ mediaId, imageUrl });
        } catch (err) {
          console.error("Failed to add media from assets:", err);
        }
      }
      setIsAssetsOpen(false);
    },
    [addImage]
  );

  // Set primary cover photo handler
  const handleSetCover = useCallback(
    async (mediaId) => {
      const targetWfId = workflow?.id || workflow?.name;
      if (!targetWfId || !mediaId) return;
      try {
        await setPrimaryMediaMutation.mutateAsync({
          workflowId: targetWfId,
          mediaId,
        });
      } catch (err) {
        console.error("Failed to set primary cover:", err);
      }
    },
    [workflow, setPrimaryMediaMutation]
  );

  // Delete reference image handler
  const handleDeleteImage = useCallback(
    async (itemOrId) => {
      const mediaId =
        typeof itemOrId === "object"
          ? itemOrId?.id || itemOrId?.asset_id || itemOrId?.name
          : itemOrId;
      if (!mediaId) return;

      setDeletingMediaId(mediaId);
      try {
        await deleteImage(mediaId);
      } catch (err) {
        console.error("Failed to delete element image:", err);
      } finally {
        setDeletingMediaId(null);
      }
    },
    [deleteImage]
  );

  // Trigger Vision AI analysis handler
  const handleAnalyzeVision = useCallback(async () => {
    try {
      await analyzeVision();
    } catch (err) {
      console.error("Failed to analyze element vision:", err);
    }
  }, [analyzeVision]);

  // Change element type handler
  const handleSaveElementType = useCallback(
    async (nextType) => {
      setDraftElementType(nextType);
      return saveElementType(nextType);
    },
    [saveElementType]
  );

  // Delete entire element handler
  const handleDeleteWorkflow = useCallback(() => {
    const targetId = workflow?.id || workflow?.name;
    if (!targetId) return;
    promptDelete({
      id: targetId,
      projectId,
      workflowType: "ELEMENT",
    });
  }, [workflow, projectId, promptDelete]);

  // Confirm delete and navigate back to list
  const handleConfirmDelete = useCallback(async () => {
    await confirmDelete(projectId);
    router.push(`/cinema-studio/${projectId}/elements`);
  }, [confirmDelete, projectId, router]);

  return {
    // Data & state
    workflow,
    element,
    items,
    elementType: draftElementType || elementType || "object",
    typeConfig,
    primaryMediaId,
    projectData,

    // Draft form bindings
    draftTitle,
    setDraftTitle,
    saveTitle,
    draftDesc,
    setDraftDesc,
    saveDescription,
    draftGuidelines,
    setDraftGuidelines,
    saveGuidelines,
    saveElementType: handleSaveElementType,

    // Gallery & assets bindings
    deletingMediaId,
    isAssetsOpen,
    setIsAssetsOpen,
    handleUploadFiles,
    handleAddFromAssets,
    handleSetCover,
    handleDeleteImage,
    isSettingCover: setPrimaryMediaMutation.isPending,

    // AI vision
    handleAnalyzeVision,
    isAnalyzingVision,

    // Deletion
    handleDeleteWorkflow,
    handleConfirmDelete,
    isDeleting,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    // Status
    isLoading,
  };
}

export default useElementEdit;
