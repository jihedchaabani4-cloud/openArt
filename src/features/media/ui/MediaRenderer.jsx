"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

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
  const status = propStatus ?? item?.status ?? "ready";
  const error = propError ?? item?.error ?? null;
  const displayName = alt ?? item?.name ?? "Media";

  // Compute CSS aspect ratio
  const rawAspectRatio =
    propAspectRatio ??
    (item?.width && item?.height ? `${item.width} / ${item.height}` : null);
  const normalizedAspect = normalizeAspectRatio(rawAspectRatio);

  const containerStyle = {
    ...(normalizedAspect ? { aspectRatio: normalizedAspect } : {}),
    ...style,
  };

  // 1. Processing state
  if (status === "processing" && !url) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Processing media"
        className={cn(
          "relative flex flex-col items-center justify-center bg-neutral-900/60 p-4 text-neutral-400 select-none animate-pulse",
          className
        )}
        style={containerStyle}
        {...props}
      >
        <GoogleIcon name="hourglass_empty" className="text-3xl text-neutral-500 animate-spin mb-2" />
        <span className="text-xs font-medium tracking-wide">Processing...</span>
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
        <GoogleIcon name="broken_image" className="text-3xl text-red-400 mb-2" />
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
          "relative flex flex-col items-center justify-center bg-neutral-900/40 p-4 text-neutral-500 select-none",
          className
        )}
        style={containerStyle}
        {...props}
      >
        <GoogleIcon name="image_not_supported" className="text-3xl text-neutral-600 mb-2" />
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
      className={cn("relative bg-neutral-950", className)}
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
