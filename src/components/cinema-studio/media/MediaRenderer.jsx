"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "./ProcessingCard";
import { UploadingCard } from "./UploadingCard";

/**
 * Normalizes aspect ratio strings (e.g. '16/9' -> '16 / 9').
 *
 * @param {string|number|null} ar
 * @returns {string|null}
 */
function normalizeAspectRatio(ar) {
  if (!ar) return null;
  const str = String(ar).trim();
  if (str.includes("/")) {
    return str
      .split("/")
      .map((part) => part.trim())
      .join(" / ");
  }
  return str;
}

/**
 * MediaRenderer - Pure presentational media primitive.
 * Consumes a normalized MediaItem (or explicit overrides) and renders <img>, <video>,
 * or accessible fallback placeholders for processing, failed, and empty states.
 */
export const MediaRenderer = React.memo(
  React.forwardRef(function MediaRenderer(
    {
      item,
      url: propUrl,
      thumbUrl: propThumbUrl,
    kind: propKind,
    status: propStatus,
    error: propError,
    aspectRatio: propAspectRatio,
    objectFit = "cover",
    alt,
    className,
    style,
    autoPlay = false,
    controls = false,
    loop = false,
    muted = true,
    playsInline = true,
    fallbackText,
    onLoad,
    onError,
    ...props
  },
  ref
) {
  const url = propUrl ?? item?.url ?? null;
  const thumbUrl = propThumbUrl ?? item?.thumbUrl ?? null;
  const kind = propKind ?? item?.kind ?? "image";
  const status = String(propStatus ?? item?.status ?? "ready").trim().toLowerCase();
  const underlyingStatus = String(item?.raw?.status ?? "").trim().toLowerCase();
  const isUploading = status === "uploading" || (status === "processing" && underlyingStatus === "uploading");
  const error = propError ?? item?.error ?? null;
  const displayName = alt ?? item?.name ?? "Media";
  const uploadId = item?.uploadId ?? item?.raw?.uploadId ?? item?.workflowId ?? null;
  const uploadProgress = item?.progress ?? item?.raw?.progress ?? null;

  // Compute CSS aspect ratio
  const rawAspectRatio =
    propAspectRatio ??
    (item?.width && item?.height ? `${item.width} / ${item.height}` : null);
  const normalizedAspect = normalizeAspectRatio(rawAspectRatio);

  const containerStyle = {
    ...(normalizedAspect ? { aspectRatio: normalizedAspect } : {}),
    ...style,
  };

  // 0. Uploading state
  if (isUploading) {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        style={containerStyle}
        {...props}
      >
        <UploadingCard
          src={url}
          isVideo={kind === "video"}
          progress={uploadProgress}
          uploadId={uploadId}
          alt={displayName}
        />
      </div>
    );
  }

  // 1. Processing state
  if (status === "processing" && !url) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Processing media"
        className={cn("relative overflow-hidden", className)}
        style={containerStyle}
        {...props}
      >
        <ProcessingCard
          progress={uploadProgress}
          isVideo={kind === "video"}
          prompt={item?.prompt ?? item?.raw?.prompt ?? null}
          className="w-full h-full rounded-none border-0"
        />
      </div>
    );
  }

  // 2. Failed state
  if (status === "failed") {
    return (
      <div
        ref={ref}
        role="alert"
        aria-label="Media generation failed"
        className={cn(
          "relative flex flex-col items-center justify-center bg-red-950/20 p-4 text-red-300 text-center select-none",
          className
        )}
        style={containerStyle}
        {...props}
      >
        <HugeIcon name="image-not-found-01" className="text-3xl text-red-400 mb-2" />
        <span className="text-xs font-medium line-clamp-2">
          {error || fallbackText || "Generation failed"}
        </span>
      </div>
    );
  }

  // 3. Empty state (no URL)
  if (!url) {
    return (
      <div
        ref={ref}
        role="img"
        aria-label="No media available"
        className={cn(
          "relative flex flex-col items-center justify-center bg-surface-secondary/40 p-4 text-white/50 select-none",
          className
        )}
        style={containerStyle}
        {...props}
      >
        <HugeIcon name="image-not-found-02" className="text-3xl text-white/50 mb-2" />
        <span className="text-xs font-medium">
          {fallbackText || "No media available"}
        </span>
      </div>
    );
  }

  // 4. Video media
  if (kind === "video") {
    return (
      <div
        ref={ref}
        className={cn("relative bg-black", className)}
        style={containerStyle}
      >
        <video
          src={url}
          poster={thumbUrl || undefined}
          autoPlay={autoPlay}
          controls={controls}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          onLoadedData={onLoad}
          onError={onError}
          className={cn("h-full w-full", {
            "object-cover": objectFit === "cover",
            "object-contain": objectFit === "contain",
            "object-fill": objectFit === "fill",
          })}
          {...props}
        />
      </div>
    );
  }

  // 5. Image media (default)
  return (
    <div
      ref={ref}
      className={cn("relative bg-canvas-bg", className)}
      style={containerStyle}
    >
      <img
        src={url}
        alt={displayName}
        loading="lazy"
        onLoad={onLoad}
        onError={onError}
        className={cn("h-full w-full transition-opacity duration-200", {
          "object-cover": objectFit === "cover",
          "object-contain": objectFit === "contain",
          "object-fill": objectFit === "fill",
        })}
        {...props}
      />
    </div>
  );
  })
);
MediaRenderer.displayName = "MediaRenderer";

export default MediaRenderer;
