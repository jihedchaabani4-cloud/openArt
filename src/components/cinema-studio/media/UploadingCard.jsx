"use client";
/* eslint-disable @next/next/no-img-element */

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import {
  clampUploadPercent,
  useUploadState,
} from "@/features/media/model/uploadProgressStore";

/**
 * UploadingCard
 * Two-stage honest upload card:
 * 1. `uploading`: media preview + frosted blur + fluid wave + 25%-from-bottom
 *    determinate progress line + spinning loader + real upload percentage.
 * 2. `processing`: once frontend bytes finish sending and we await the backend
 *    response, switches cleanly to an indeterminate processing bar + "Processing".
 */
export function UploadingCard({
  src = null,
  isVideo = false,
  progress = null,
  phase: propPhase = null,
  uploadId = null,
  alt = "Uploading media",
  className,
  style,
}) {
  const liveState = useUploadState(uploadId);
  const resolvedPercent = clampUploadPercent(
    liveState?.percent !== undefined ? liveState.percent : (progress ?? 0)
  );
  const resolvedPhase = liveState?.phase || propPhase || "uploading";
  const isProcessingUpload = resolvedPhase === "processing";

  return (
    <div
      role="status"
      aria-label={
        isProcessingUpload
          ? "Processing upload"
          : `Uploading media ${resolvedPercent}%`
      }
      data-slot="uploading-card"
      data-upload-phase={resolvedPhase}
      className={cn(
        "relative w-full h-full overflow-hidden bg-surface-card select-none",
        className
      )}
      style={style}
    >
      {/* 1. Media preview layer underneath */}
      {src ? (
        isVideo ? (
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            data-slot="uploading-media-preview"
            className="h-full w-full object-cover scale-105 pointer-events-none"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            decoding="async"
            draggable={false}
            data-slot="uploading-media-preview"
            className="h-full w-full object-cover scale-105 pointer-events-none"
          />
        )
      ) : (
        <div
          aria-hidden="true"
          data-slot="uploading-media-fallback"
          className="absolute inset-0 bg-surface-secondary"
        />
      )}

      {/* 2. Frosted blur + animated fluid wave overlay */}
      <div
        aria-hidden="true"
        data-slot="uploading-blur-layer"
        className="absolute inset-0 bg-black/35 backdrop-blur-md pointer-events-none"
      />
      <div
        aria-hidden="true"
        data-slot="uploading-wave-layer"
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="ds-upload-wave-primary" />
        <div className="ds-upload-wave-secondary" />
      </div>

      {/* 3. Progress line bar (25% above bottom) + motion loading icon + % / Processing */}
      <div
        data-slot="uploading-progress-row"
        className="absolute inset-x-0 bottom-[25%] z-10 flex items-center gap-2 px-3.5 pointer-events-none"
      >
        <div
          role="progressbar"
          aria-label={isProcessingUpload ? "Processing upload" : "Upload progress"}
          aria-valuemin={isProcessingUpload ? undefined : 0}
          aria-valuemax={isProcessingUpload ? undefined : 100}
          aria-valuenow={isProcessingUpload ? undefined : resolvedPercent}
          data-slot="uploading-progress-track"
          className="relative flex-1 min-w-8 h-1 rounded-full bg-white/25 overflow-hidden"
        >
          {isProcessingUpload ? (
            <div
              data-slot="uploading-progress-indeterminate"
              className="ds-upload-bar-indeterminate"
            />
          ) : (
            <>
              <div
                data-slot="uploading-progress-fill"
                className="relative h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                style={{ width: `${resolvedPercent}%` }}
              />
              {resolvedPercent < 100 && (
                <span aria-hidden="true" className="ds-upload-bar-sheen" />
              )}
            </>
          )}
        </div>

        <div
          data-slot="uploading-progress-meta"
          className="flex items-center gap-1 shrink-0"
        >
          <HugeIcon
            name="loading-03"
            size="xs"
            className="text-white animate-spin shrink-0"
          />
          <span
            data-slot="uploading-progress-value"
            className="ds-text-caption-s font-medium text-white tabular-nums leading-none whitespace-nowrap"
          >
            {isProcessingUpload ? "Processing" : `${resolvedPercent}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default UploadingCard;
