"use client";

import { useState, useRef, useCallback } from "react";
import { useCreateElementSheetMutation } from "./useElement";
import { elementService } from "../services/elementService";
import { useWorkflowsStore } from "@/features/workflows";
import { useBatchUploadAssets } from "@/features/media/api/mediaApi";

/**
 * useCreateElementForm
 * Controller hook for CreateElementModal.
 * Encapsulates batch image uploads, input validation, and submission logic.
 */
export function useCreateElementForm({ projectId, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [sourceImages, setSourceImages] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement, isPending: isLoading } = useCreateElementSheetMutation({
    onError: (err) => {
      setError(err.message || "Failed to create element");
    },
  });

  const { mutateAsync: uploadBatchToServer } = useBatchUploadAssets();

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const handleRemoveImage = useCallback((index) => {
    setSourceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(
    async (files) => {
      if (sourceImages.length + files.length > 6) {
        setError("Maximum 6 reference images allowed");
        return;
      }
      setError(null);
      setIsUploading(true);
      try {
        const results = await uploadBatchToServer({
          files,
          projectId: effectiveProjectId,
        });
        const newUrls = results.map((r) => r.url).filter(Boolean);
        setSourceImages((prev) => [...prev, ...newUrls]);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to upload image(s).");
      } finally {
        setIsUploading(false);
      }
    },
    [sourceImages.length, uploadBatchToServer, effectiveProjectId]
  );

  const handleFileChange = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      await uploadFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        await uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError("Element name is required");
      return;
    }
    if (sourceImages.length === 0) {
      setError("At least 1 reference image is required");
      return;
    }
    if (sourceImages.length > 6) {
      setError("Maximum 6 reference images allowed");
      return;
    }

    setError(null);

    try {
      const payload = elementService.buildCreatePayload({
        name: name.trim(),
        sourceImages,
        projectId: effectiveProjectId,
      });

      const result = await runCreateElement({ payload });

      if (onCreated) onCreated(result);

      setName("");
      setSourceImages([]);
      setError(null);
      if (onClose) onClose();
    } catch (err) {
      console.error("[useCreateElementForm] Error:", err);
      setError(err.message || "Failed to create element");
    }
  }, [name, sourceImages, effectiveProjectId, runCreateElement, onCreated, onClose]);

  return {
    name,
    setName,
    sourceImages,
    error,
    setError,
    isUploading,
    isDragging,
    isLoading,
    fileInputRef,
    handleRemoveImage,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCreate,
  };
}

export default useCreateElementForm;
