"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { ReferenceButton, ViewReference } from "./ReferenceButton.jsx";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { validateFilesAgainstPolicy, DEFAULT_UPLOAD_POLICY, uploadMediaAsset } from "@/features/media";

/**
 * MediaInput: role-blind, feature-blind media slot primitive with real drag-and-drop upload.
 *
 * Implements real upload flow validated against DEFAULT_UPLOAD_POLICY with
 * explicit `idle`, `uploading`, `failed` (with retry), and `done` (ViewReference) states.
 * Failed items are never committed to onChange, preventing unpersisted blob URLs from
 * reaching generation requests.
 *
 * Props:
 * @param {string} label - Display label (e.g. "Start Frame", "End Frame", "Reference")
 * @param {object|string} value - Current media object ({ url, type, preview, name }) or string URL
 * @param {function} onChange - Callback when upload succeeds: (canonicalMedia) => void
 * @param {function} onRemove - Callback when media is removed: () => void
 * @param {function} [onUpload] - Optional custom upload function: (file) => Promise<MediaReference>
 * @param {string} [accept="image/*"] - MIME type(s) accepted
 * @param {boolean} [disabled=false] - Whether the input is disabled
 * @param {string} [className] - Optional container CSS class overrides
 */
export function MediaInput({
  label,
  role,
  variant,
  value,
  onChange,
  onRemove,
  onClick,
  onUpload,
  accept = "image/*",
  disabled = false,
  className,
}) {
  const fileInputRef = useRef(null);
  const tempPreviewRef = useRef(null);

  const [status, setStatus] = useState("idle"); // "idle" | "uploading" | "failed"
  const [error, setError] = useState(null);
  const [failedFile, setFailedFile] = useState(null);
  const [tempPreview, setTempPreview] = useState(null);

  const activeUpload = onUpload || uploadMediaAsset;

  // Revoke any pending temporary preview object URL on unmount
  useEffect(() => {
    return () => {
      if (tempPreviewRef.current && typeof URL !== "undefined" && URL.revokeObjectURL) {
        URL.revokeObjectURL(tempPreviewRef.current);
        tempPreviewRef.current = null;
      }
    };
  }, []);

  const performUpload = useCallback(
    async (file) => {
      if (!file) return;

      // 1. Pre-flight UX validation against DEFAULT_UPLOAD_POLICY
      const validation = validateFilesAgainstPolicy(file, DEFAULT_UPLOAD_POLICY);
      if (!validation.valid) {
        setStatus("failed");
        setError(validation.message || "File validation failed");
        setFailedFile(file);
        return;
      }

      // 2. Start upload with temporary visual preview
      setStatus("uploading");
      setError(null);
      setFailedFile(null);

      const blobUrl =
        typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : null;
      if (tempPreviewRef.current && typeof URL !== "undefined" && URL.revokeObjectURL) {
        URL.revokeObjectURL(tempPreviewRef.current);
      }
      tempPreviewRef.current = blobUrl;
      setTempPreview(blobUrl);

      try {
        const result = await activeUpload(file);

        // 3. Revoke temporary object URL immediately on completion
        if (tempPreviewRef.current && typeof URL !== "undefined" && URL.revokeObjectURL) {
          URL.revokeObjectURL(tempPreviewRef.current);
          tempPreviewRef.current = null;
        }
        setTempPreview(null);
        setStatus("idle");

        // 4. Commit canonical returned media item (never blob URL)
        const canonical = Array.isArray(result) ? result[0] : result;
        onChange?.(canonical);
      } catch (err) {
        if (tempPreviewRef.current && typeof URL !== "undefined" && URL.revokeObjectURL) {
          URL.revokeObjectURL(tempPreviewRef.current);
          tempPreviewRef.current = null;
        }
        setTempPreview(null);
        setStatus("failed");
        setError(err?.message || "Upload failed");
        setFailedFile(file);
        // Failed item NEVER reaches onChange / generation payload
      }
    },
    [activeUpload, onChange]
  );

  const handleClick = (e) => {
    if (disabled || status === "uploading") return;
    if (status === "failed") {
      handleRetry(e);
      return;
    }
    if (onClick) {
      onClick(e);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      performUpload(file);
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || status === "uploading") return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      performUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRetry = (e) => {
    e?.stopPropagation();
    if (failedFile) {
      performUpload(failedFile);
    }
  };

  const handleDismissFailed = (e) => {
    e?.stopPropagation();
    setStatus("idle");
    setError(null);
    setFailedFile(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn("relative shrink-0", className)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {status === "uploading" ? (
        <div
          data-testid="media-input-uploading"
          role="status"
          aria-label={`Uploading ${label || "media"}`}
          className="chip-container group size-12 relative rounded-sm overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center select-none"
        >
          {tempPreview && (
            <img
              src={tempPreview}
              alt="Uploading"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <Loader2 className="w-5 h-5 text-white/80 animate-spin relative z-10" />
        </div>
      ) : status === "failed" ? (
        <div
          data-testid="media-input-failed"
          role="alert"
          aria-label={error || "Upload failed"}
          className="chip-container group size-12 relative rounded-sm overflow-hidden bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center p-1 text-center select-none"
        >
          <span className="text-xs text-red-400 font-medium leading-none mb-1 scale-75">Failed</span>
          <Button
            type="button"
            variant="secondary"
            className="h-6 px-2 text-xs [&_svg]:size-2.5"
            data-testid="media-input-retry-btn"
            onClick={handleRetry}
            title="Retry upload"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Retry</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            data-testid="media-input-dismiss-btn"
            onClick={handleDismissFailed}
            className="absolute top-0.5 right-0.5 size-4 p-0 rounded-full hover:bg-white/10 text-white"
            title="Dismiss error"
            aria-label="Dismiss error"
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        </div>
      ) : value ? (
        <ViewReference
          media={typeof value === "string" ? { url: value, type: "image" } : value}
          label={label}
          onRemove={onRemove}
        />
      ) : (
        <ReferenceButton
          variant={variant || role}
          word={label}
          disabled={disabled}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}
    </div>
  );
}

export default MediaInput;
