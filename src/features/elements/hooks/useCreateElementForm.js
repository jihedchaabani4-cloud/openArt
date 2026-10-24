"use client";

import { useState, useRef, useCallback } from "react";
import { useCreateElementSheetMutation } from "./useCreateElementSheetMutation";
import { elementService } from "../services/elementService";
import { useWorkflowsStore } from "@/features/workflows";
import { validateFilesAgainstPolicy, ELEMENT_REFERENCE_UPLOAD_POLICY } from "@/features/media";

/**
 * useCreateElementForm
 * Controller hook for CreateElementModal.
 * Encapsulates direct image uploads via FormData / mediaId, input validation,
 * and decoupled creation & image attachment (eliminates /api/assets/upload double-upload).
 */
export function useCreateElementForm({ projectId, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [referenceImages, setReferenceImages] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement, isPending: isLoading } = useCreateElementSheetMutation({
    onError: (err) => {
      setError(err.message || "Failed to create element");
    },
  });

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const handleRemoveImage = useCallback((index) => {
    setReferenceImages((prev) => {
      const item = prev[index];
      if (item?.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addFiles = useCallback(
    (files) => {
      if (!files || files.length === 0) return;
      const remainingSlots = Math.max(0, 6 - referenceImages.length);

      // Pre-flight UX validation against ELEMENT_REFERENCE_UPLOAD_POLICY
      const validation = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY, {
        maxFiles: remainingSlots,
      });

      if (!validation.valid) {
        setError(validation.message || "Invalid reference image(s).");
        return;
      }

      setError(null);
      const newItems = Array.from(files).map((file) => ({
        file,
        previewUrl: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : "",
        name: file.name,
      }));

      setReferenceImages((prev) => [...prev, ...newItems]);
    },
    [referenceImages.length]
  );

  const handleFileChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      addFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles]
  );

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError("Element name is required");
      return;
    }
    if (referenceImages.length === 0) {
      setError("At least 1 reference image is required");
      return;
    }
    if (referenceImages.length > 6) {
      setError("Maximum 6 reference images allowed");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const payload = elementService.buildCreatePayload({
        name: name.trim(),
        projectId: effectiveProjectId,
      });

      const result = await runCreateElement({ payload });
      const elementId =
        result?.element?.id ||
        result?.id ||
        result?.workflow?.id ||
        result?.workflow?.name ||
        result?.element?.workflow_id ||
        result?.name;

      if (elementId && referenceImages.length > 0) {
        // Direct upload: Files go via FormData, Project Cache assets via { mediaId }
        const itemsToAttach = referenceImages.map((item) => {
          if (item?.file) return { file: item.file };
          if (item?.mediaId) return { mediaId: item.mediaId };
          if (typeof item === "string") return item;
          return item;
        });
        await elementService.attachImages(elementId, itemsToAttach, { projectId: effectiveProjectId });
      }

      if (onCreated) onCreated(result);

      // Clean up object URLs
      referenceImages.forEach((item) => {
        if (item?.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      setName("");
      setReferenceImages([]);
      setError(null);
      if (onClose) onClose();
    } catch (err) {
      console.error("[useCreateElementForm] Error:", err);
      setError(err.message || "Failed to create element");
    } finally {
      setIsUploading(false);
    }
  }, [name, referenceImages, effectiveProjectId, runCreateElement, onCreated, onClose]);

  return {
    name,
    setName,
    referenceImages,
    sourceImages: referenceImages, // compatibility alias
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
