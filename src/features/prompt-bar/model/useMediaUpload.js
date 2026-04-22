// src/features/prompt-bar/model/useMediaUpload.js
// ✅ Single responsibility: file upload + drag-and-drop.

import { useState, useCallback } from "react";
import { useUploadAsset } from "@/features/media/api/mediaApi";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE_SIZE_MB    = 10;

/**
 * ✅ FIX: Added file type and size validation before hitting the API.
 *
 * @param {object} params
 * @param {string}   params.projectId
 * @param {string}   params.activeSessionId
 * @param {Function} params.addReference     - from useGenerationsStore
 * @param {Array}    params.referenceImages
 * @param {number}   params.maxRefs
 * @returns upload handlers + isDragging state
 */
export function useMediaUpload({ projectId, activeSessionId, addReference, referenceImages, maxRefs, allowedType = "all" }) {
  const [uploading,  setUploading]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const { mutateAsync: uploadAssetToServer } = useUploadAsset();

  // ─── Validation helper ────────────────────────────────────────────────────
  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0); // If error, just allow to proceed
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const validateFile = useCallback(async (file) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    if (!allowed.includes(file.type)) {
      return { ok: false, reason: `File type "${file.type}" is not supported.` };
    }

    if (allowedType === "image" && isVideo) {
      return { ok: false, reason: "Only images are allowed in this mode." };
    }
    if (allowedType === "video" && isImage) {
      return { ok: false, reason: "Only videos are allowed in this mode." };
    }

    const sizeMB = file.size / (1024 * 1024);

    // Validation for Images: Max 10MB
    if (isImage && sizeMB > 10) {
        return { ok: false, reason: `Image exceeds 10MB limit (yours: ${sizeMB.toFixed(2)}MB).` };
    }

    // Validation for Videos: Max 50MB (buffer limit usually higher, but let's keep it safe)
    if (isVideo && sizeMB > 50) {
        return { ok: false, reason: `Video exceeds 50MB limit (yours: ${sizeMB.toFixed(2)}MB).` };
    }

    // Video Duration: Max 30 seconds
    if (isVideo) {
      const duration = await getVideoDuration(file);
      if (duration > 30) {
        return { ok: false, reason: `Video duration cannot exceed 30 seconds (yours is ${Math.round(duration)}s).` };
      }
    }

    return { ok: true };
  }, []);

  // ─── Upload from file picker ──────────────────────────────────────────────
  const handleUploadFromPC = useCallback(
    async (file, role = "normal") => {
      setUploadError(null);

      // ✅ FIX: validate file type + size (and duration) before anything else
      const fileValidation = await validateFile(file);
      if (!fileValidation.ok) {
        setUploadError(fileValidation.reason);
        return;
      }

      // Capacity check for normal/image_ref roles
      if (role === "normal" || role === "image_ref") {
        const count = referenceImages.filter(
          (r) => r.role === "normal" || r.role === "image_ref"
        ).length;
        if (count >= maxRefs) {
          setUploadError(`Max ${maxRefs} references reached.`);
          return;
        }
      }

      try {
        setUploading(true);

        // Call the centralized upload mutation from mediaApi.js
        const data = await uploadAssetToServer({ 
          file, 
          projectId: projectId ?? "", 
          sessionId: activeSessionId ?? "" 
        });

        addReference(
          {
            url:      data.url,
            asset_id: data.asset_id,
            type:     data.type,
            is_video: data.type === "video",
            width:       data.width,
            height:      data.height,
            ratio:       data.ratio,
            resolution:  data.resolution,
            size:        data.size,
          },
          role,
          maxRefs
        );
      } catch (err) {
        console.error("❌ Upload failed:", err);
        setUploadError(err.message ?? "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, activeSessionId, addReference, referenceImages, maxRefs, validateFile]
  );

  // ─── Drag-and-drop ────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e, role = "normal") => {
      e.preventDefault();
      setIsDragging(false);

      // Check if the user dropped actual files from their OS
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).slice(0, maxRefs).forEach(file => {
          handleUploadFromPC(file, role);
        });
        return;
      }

      // Otherwise, handle internal drag-and-drop from the library
      const url     = e.dataTransfer.getData("imageUrl");
      const assetId = e.dataTransfer.getData("assetId");
      const isVideo =
        url?.toLowerCase().endsWith(".mp4") ||
        url?.toLowerCase().endsWith(".webm") ||
        e.dataTransfer.getData("isVideo") === "true";

      if (!url) return;

      if (allowedType === "image" && isVideo) {
        setUploadError("Only images are allowed as references in this mode.");
        return;
      }
      if (allowedType === "video" && !isVideo) {
        setUploadError("Only videos are allowed as references in this mode.");
        return;
      }

      addReference(
        { url, asset_id: assetId ?? null, is_video: isVideo },
        role,
        maxRefs
      );
    },
    [addReference, maxRefs, handleUploadFromPC]
  );

  return {
    uploading,
    isDragging,
    uploadError,
    clearUploadError: () => setUploadError(null),
    handleUploadFromPC,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
