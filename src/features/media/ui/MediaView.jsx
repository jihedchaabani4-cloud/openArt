"use client";

import React from "react";
import { useResolvedMedia } from "@/features/workflows/model/useResolvedMedia";
import { MediaRenderer } from "./MediaRenderer";
import { MediaCard } from "./MediaCard";
import { MediaTile } from "./MediaTile";
import { MediaHero } from "./MediaHero";
import { MediaChip } from "./MediaChip";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

/**
 * MediaView - Canonical declarative container component.
 *
 * Rules:
 * - Accepts either `mediaId` OR `workflowId` (if both are provided, `mediaId` takes precedence).
 * - Reads from the project query cache via `useResolvedMedia` (zero N+1 requests).
 * - The UI never branches on `workflow_type`.
 * - Orchestrates lifecycle states: 'loading', 'empty', 'notFound', 'processing', 'failed', 'ready'.
 */
export const MediaView = React.memo(
  React.forwardRef(function MediaView(
    {
      mediaId,
      workflowId,
      projectId,
      variant = "renderer",
      loadingFallback,
      emptyFallback,
      notFoundFallback,
      failedFallback,
      processingFallback,
      children,
      className,
      ...restProps
    },
    ref
  ) {
  const { item, state } = useResolvedMedia({ mediaId, workflowId, projectId });

  // Custom render-prop escape hatch
  if (typeof children === "function") {
    return children({ item, state });
  }

  // 1. Loading state (project query in-flight)
  if (state === "loading") {
    if (loadingFallback) return loadingFallback;
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading media"
        className={cn(
          "flex flex-col items-center justify-center min-h-[160px] w-full rounded-2xl bg-neutral-900/40 border border-neutral-800/40 p-4 text-neutral-500 animate-pulse",
          className
        )}
      >
        <GoogleIcon name="progress_activity" className="text-3xl animate-spin text-neutral-600 mb-2" />
        <span className="text-xs font-medium">Loading...</span>
      </div>
    );
  }

  // 2. Empty state (workflow has 0 items)
  if (state === "empty") {
    if (emptyFallback) return emptyFallback;
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Empty workflow"
        className={cn(
          "flex flex-col items-center justify-center min-h-[160px] w-full rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 p-4 text-neutral-500 text-center select-none",
          className
        )}
      >
        <GoogleIcon name="folder_open" className="text-3xl text-neutral-600 mb-2" />
        <span className="text-xs font-medium">No media items</span>
      </div>
    );
  }

  // 3. Not Found state (item or workflow missing from cache)
  if (state === "notFound") {
    if (notFoundFallback) return notFoundFallback;
    return (
      <div
        ref={ref}
        role="alert"
        aria-label="Media not found"
        className={cn(
          "flex flex-col items-center justify-center min-h-[160px] w-full rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 p-4 text-neutral-500 text-center select-none",
          className
        )}
      >
        <GoogleIcon name="help_outline" className="text-3xl text-neutral-600 mb-2" />
        <span className="text-xs font-medium">Media not found</span>
      </div>
    );
  }

  // 4. Failed state
  if (state === "failed") {
    if (failedFallback) return failedFallback;
    return (
      <div
        ref={ref}
        role="alert"
        aria-label="Media failed"
        className={cn(
          "flex flex-col items-center justify-center min-h-[160px] w-full rounded-2xl bg-red-950/20 border border-red-900/40 p-4 text-red-300 text-center select-none",
          className
        )}
      >
        <GoogleIcon name="broken_image" className="text-3xl text-red-400 mb-2" />
        <span className="text-xs font-medium">
          {item?.error || "Media generation failed"}
        </span>
      </div>
    );
  }

  // 5. Processing state without URL
  if (state === "processing" && !item?.url) {
    if (processingFallback) return processingFallback;
  }

  // 6. Presentational Variants
  switch (variant) {
    case "card":
      return <MediaCard ref={ref} item={item} className={className} {...restProps} />;
    case "tile":
      return <MediaTile ref={ref} item={item} className={className} {...restProps} />;
    case "hero":
      return <MediaHero ref={ref} item={item} className={className} {...restProps} />;
    case "chip":
      return <MediaChip ref={ref} item={item} className={className} {...restProps} />;
    case "renderer":
    default:
      return <MediaRenderer ref={ref} item={item} className={className} {...restProps} />;
  }
})
);
MediaView.displayName = "MediaView";

export default MediaView;
