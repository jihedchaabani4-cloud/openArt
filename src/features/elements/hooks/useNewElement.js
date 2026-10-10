"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCreateElementSheetMutation } from "./useCreateElementSheetMutation";
import { useElementSheetWorkflows } from "./useElementSheetWorkflows";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore } from "@/features/workflows";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata } from "@/shared/lib/displayUtils";
import { getWorkflowDomainType, DOMAIN_TYPES } from "@/features/workflows/model/domainNormalizer";
import { elementService } from "../services/elementService";

const generateDefaultElementName = () => "element" + Math.floor(100 + Math.random() * 900);

/**
 * useNewElement
 * Custom controller hook for the New Element creation page.
 * Manages creation flow, photo imports, drag-and-drop, and project media selection.
 */
export function useNewElement() {
  const { projectId } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [elementType, setElementType] = useState("object");
  const [error, setError] = useState(null);
  const [loadingWorkflowId, setLoadingWorkflowId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement } = useCreateElementSheetMutation({
    onError: (err) => setError(err.message || "Failed to create element"),
  });

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const { workflows: existingSheets } = useElementSheetWorkflows(effectiveProjectId);
  const { data: projectData, isLoading: isProjectLoading } = useProjectData(effectiveProjectId);

  const goBack = useCallback(() => {
    if (existingSheets && existingSheets.length > 0) {
      router.push(`/cinema-studio/${effectiveProjectId}/elements`);
    } else {
      router.push(`/cinema-studio/${effectiveProjectId}/assets`);
    }
  }, [existingSheets, effectiveProjectId, router]);

  // Project photos: GENERATION + UPLOAD workflows only
  const photos = useMemo(() => {
    const rawWorkflows = projectData?.projectContents?.workflows || [];
    const rawMedia = projectData?.projectContents?.media || [];

    return rawWorkflows
      .filter((wf) => {
        const domainType = getWorkflowDomainType(wf);
        return domainType === DOMAIN_TYPES.GENERATION || domainType === DOMAIN_TYPES.UPLOAD;
      })
      .reduce((acc, wf, i) => {
        const items = rawMedia
          .filter((m) => m.workflowId === wf.name || m.workflowId === wf.id)
          .map((m) => ({ ...m, id: m.id || m.name }));
        const withItems = { ...wf, items };
        const primary = getPrimaryMedia(withItems);
        if (!primary) return acc;

        const meta = getItemMetadata(primary, withItems);
        const primaryUrl = meta?.url || primary.url || primary.file_url || primary.asset?.file_url;
        if (!primaryUrl) return acc;

        const label = wf.metadata?.displayName || wf.display_name || wf.name || "Untitled";
        const domainType = getWorkflowDomainType(wf);

        acc.push({
          src: primaryUrl,
          key: wf.id || wf.name || String(i),
          workflow: withItems,
          primaryMediaUrl: primaryUrl,
          label,
          domainType,
        });
        return acc;
      }, []);
  }, [projectData]);

  // Core creation & redirection logic
  const createAndRedirect = useCallback(
    async (urls) => {
      if (!urls || !urls.length) return;
      if (!effectiveProjectId) {
        setError("Project ID is missing. Please select a valid project.");
        return;
      }
      setError(null);
      try {
        const elementName = name.trim() || generateDefaultElementName();
        const payload = elementService.buildCreatePayload({
          name: elementName,
          sourceImages: urls.slice(0, 6),
          projectId: effectiveProjectId,
          elementType,
        });

        const res = await runCreateElement({ payload });
        const elementId =
          res?.workflow?.id ||
          res?.workflow?.name ||
          res?.element?.workflow_id ||
          res?.element?.id ||
          res?.id ||
          res?.name;

        if (elementId && effectiveProjectId) {
          router.push(`/cinema-studio/${effectiveProjectId}/elements/${elementId}`);
        } else {
          router.push(`/cinema-studio/${effectiveProjectId}/elements`);
        }
      } catch (err) {
        setError(err?.message || "Failed to create element.");
      }
    },
    [effectiveProjectId, name, elementType, runCreateElement, router]
  );

  // Upload files using elementService
  const uploadFiles = useCallback(
    async (files) => {
      if (!files || !files.length) return;
      setError(null);
      setIsUploading(true);
      try {
        const valid = await elementService.readFilesAsDataUrls(files);
        if (!valid.length) {
          setError("Failed to read image file(s).");
          return;
        }
        setPreviewImages((prev) => [...prev, ...valid]);
        await createAndRedirect(valid);
      } catch (err) {
        setError(err?.message || "Failed to create element.");
      } finally {
        setIsUploading(false);
      }
    },
    [createAndRedirect]
  );

  const createFromWorkflow = useCallback(
    async (wf, thumbUrl) => {
      if (!thumbUrl || loadingWorkflowId) return;
      setLoadingWorkflowId(wf.id || wf.name);
      setError(null);
      try {
        await createAndRedirect([thumbUrl]);
      } catch (err) {
        setError(err?.message || "Failed to create element.");
      } finally {
        setLoadingWorkflowId(null);
      }
    },
    [loadingWorkflowId, createAndRedirect]
  );

  const handleSelectAssets = useCallback(
    async (selectedItems) => {
      if (!selectedItems || !selectedItems.length) return;
      const urls = selectedItems.map((i) => i.url || i.file_url || i.src).filter(Boolean);
      if (!urls.length) return;
      setIsUploading(true);
      try {
        await createAndRedirect(urls);
      } catch (err) {
        setError(err?.message || "Failed to create element.");
      } finally {
        setIsUploading(false);
      }
    },
    [createAndRedirect]
  );

  const handleFileChange = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length) await uploadFiles(files);
      e.target.value = "";
    },
    [uploadFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) await uploadFiles(files);
    },
    [uploadFiles]
  );

  const isAnyLoading = Boolean(loadingWorkflowId) || isUploading;

  return {
    name,
    setName,
    elementType,
    setElementType,
    error,
    setError,
    loadingWorkflowId,
    isDragging,
    isUploading,
    isAnyLoading,
    isAssetsOpen,
    setIsAssetsOpen,
    previewImages,
    fileInputRef,
    photos,
    isProjectLoading,
    projectData,
    effectiveProjectId,
    existingSheets,
    goBack,
    uploadFiles,
    createFromWorkflow,
    handleSelectAssets,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

export default useNewElement;
