import { useState, useCallback } from "react";
import { useBatchUploadAssets } from "@/features/media/api/mediaApi";

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

  const { mutateAsync: uploadBatchToServer } = useBatchUploadAssets();

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
  }, [allowedType]);

  // ─── Main Upload Handler (Always uses batch mutation) ─────────────────────
  const handleUpload = useCallback(
    async (filesOrFile, role = "normal") => {
      const files = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile];
      setUploadError(null);

      // 1. Filter valid files
      const validFiles = [];
      for (const file of files) {
        const v = await validateFile(file);
        if (v.ok) validFiles.push(file);
        else setUploadError(v.reason); // Show first error
      }

      if (validFiles.length === 0) return;

      // 2. Truncate by capacity
      let toUpload = validFiles;
      if (role === "normal" || role === "image_ref") {
         const currentCount = referenceImages.filter(r => r.role === "normal" || r.role === "image_ref").length;
         const available = Math.max(0, maxRefs - currentCount);
         toUpload = validFiles.slice(0, available);
      }
      
      if (toUpload.length === 0) {
        setUploadError(`Max ${maxRefs} references reached.`);
        return;
      }

      try {
        setUploading(true);
        const results = await uploadBatchToServer({
           files: toUpload,
           projectId: projectId ?? "",
           sessionId: activeSessionId ?? ""
        });

        // Add all to references (if applicable)
        results.forEach(data => {
           if (!data) return;
           addReference({
              url: data.url,
              asset_id: data.asset_id,
              type: data.type,
              is_video: data.type === "video",
              width: data.width,
              height: data.height,
              ratio: data.ratio
           }, role, maxRefs);
        });

      } catch (err) {
        console.error("❌ Upload failed:", err);
        setUploadError(err.message ?? "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, activeSessionId, addReference, referenceImages, maxRefs, validateFile, uploadBatchToServer]
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
        handleUpload(Array.from(e.dataTransfer.files), role);
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
    [addReference, maxRefs, handleUpload, allowedType]
  );

  return {
    uploading,
    isDragging,
    uploadError,
    clearUploadError: () => setUploadError(null),
    handleUpload,
    handleUploadFromPC: handleUpload, // Alias for backward compatibility
    handleBatchUpload:  handleUpload, // Alias for backward compatibility
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
