"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

/**
 * ProcessingCard Component
 * Ultra-sleek "aurora blur" processing state.
 *
 * Spec:
 * - Pure neutral dark base (#17181a)
 * - Rounded corners (rounded-2xl / ~16px)
 * - Soft grey/white glowing blobs (luminosity ~165-185/255)
 * - Heavy Gaussian blur for ethereal orbital drift
 * - Optional top-left Play icon (ONLY for video generations)
 * - Top-right tabular progress badge (e.g. 29% -> 38%)
 * - Zero skeleton shimmer, zero spinners, zero text
 */
export function ProcessingCard({
  progress,
  aspectRatio,
  isVideo = false,
  showPlayIcon = false,
  className,
  style,
  children,
}) {
  const hasProgress = progress !== undefined && progress !== null;
  const shouldShowPlayIcon = isVideo || showPlayIcon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-qc-border-subtle bg-surface-primary select-none",
        !aspectRatio && !className?.includes("aspect-") && !style?.aspectRatio ? "aspect-video" : "",
        className
      )}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...style,
      }}
    >
      {/* ── Aurora Blobs Layer (extended bounds for smooth blur edges) ── */}
      <div className="absolute -inset-8 pointer-events-none overflow-hidden">
        {/* Blob A (Primary orbital drift) */}
        <div className="blob blob-a" />

        {/* Blob B (Secondary ambient counter-drift) */}
        <div className="blob blob-b" />
      </div>

      {/* ── Optional Top-Left Play Icon (Only when isVideo or showPlayIcon) ── */}
      {shouldShowPlayIcon && (
        <GoogleIcon iconName="play_arrow" fill={true} className="absolute left-3 top-3 text-sm text-white/50 pointer-events-none" />
      )}

      {/* ── Top-Right Progress Badge ── */}
      {hasProgress && (
        <span className="absolute right-3 top-3 text-2xs font-medium text-white/60 tabular-nums pointer-events-none">
          {typeof progress === "number" ? Math.round(progress) : progress}%
        </span>
      )}

      {/* ── Optional Children / Custom Overlay ── */}
      {children}
    </div>
  );
}

export default ProcessingCard;
