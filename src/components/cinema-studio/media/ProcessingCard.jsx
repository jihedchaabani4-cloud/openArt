"use client";

import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";

/**
 * ProcessingCard Component
 * Volumetric frosted wave + orbiting dark core processing state.
 *
 * Spec:
 * - Pure neutral dark canvas (`bg-canvas-bg`) with subtle border (`border-border-subtle`)
 * - Extended overflow-safe Gaussian blur stage (`.ds-proc-stage`) with non-harmonic
 *   luminous cloud waves + orbiting obsidian shadow orb (`.ds-proc-orb-core`)
 * - Top-left muted media-type icon (`image-02` for image, `video-01` for video)
 * - Top-right tabular percentage counter when `progress` is supplied
 * - Optional bottom-left truncated prompt preview & bottom-right tonal reuse-prompt action
 * - Zero skeleton shimmer, zero spinners
 */
export function ProcessingCard({
  progress,
  aspectRatio,
  isVideo = false,
  showPlayIcon = false,
  prompt = null,
  onReusePrompt = null,
  canReusePrompt = true,
  className,
  style,
  children,
}) {
  const hasProgress = progress !== undefined && progress !== null;
  const formattedProgress = typeof progress === "number" ? Math.round(progress) : progress;
  const isVideoMedia = Boolean(isVideo || showPlayIcon);
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const showReuseButton = Boolean(onReusePrompt && canReusePrompt);
  const hasBottomHud = Boolean(trimmedPrompt || showReuseButton);

  const containerStyle =
    aspectRatio || style
      ? {
          ...(aspectRatio ? { aspectRatio } : {}),
          ...style,
        }
      : undefined;

  return (
    <div
      role="status"
      aria-label={hasProgress ? `Generating media ${formattedProgress}%` : "Generating media"}
      data-slot="processing-card"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border-subtle bg-omni-bg select-none",
        !aspectRatio && !className?.includes("aspect-") && !style?.aspectRatio ? "aspect-video" : "",
        className
      )}
      style={containerStyle}
    >
      {/* ── Volumetric Wave + Soft Charcoal Core Stage ── */}
      <div
        aria-hidden="true"
        data-slot="processing-wave-stage"
        className="ds-proc-stage"
      >
        <div className="ds-proc-wave-a" />
        <div className="ds-proc-wave-b" />
        <div className="ds-proc-glow-c" />
        <div className="ds-proc-orb-core" />
      </div>
      <div aria-hidden="true" className="ds-proc-dither" />

      {/* ── Top HUD: Left Media Type Icon + Right Spinning Loader ── */}
      <div
        data-slot="processing-top-hud"
        className="absolute inset-x-3 top-3 z-10 flex items-center justify-between pointer-events-none"
      >
        <HugeIcon
          name={isVideoMedia ? "video-01" : "image-02"}
          size="sm"
          className="text-text-secondary"
        />
        <HugeIcon
          name="loading-03"
          size="xs"
          data-slot="processing-spinner"
          className="text-white/70 animate-spin"
        />
      </div>

      {/* ── Optional Bottom HUD: Truncated Prompt + Tonal Reuse Prompt Action ── */}
      {hasBottomHud && (
        <div
          data-slot="processing-bottom-hud"
          className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-2 pointer-events-none"
        >
          {trimmedPrompt ? (
            <span
              data-slot="processing-prompt"
              title={trimmedPrompt}
              className="text-xs font-medium text-white/75 truncate leading-snug min-w-0"
            >
              {trimmedPrompt}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}

          {showReuseButton && (
            <IconButton
              type="button"
              variant="tonal"
              size="xs"
              aria-label="Reuse prompt"
              title="Reuse prompt"
              className="pointer-events-auto shrink-0 size-7 rounded-row bg-surface-tonal hover:bg-surface-tonal-hover text-text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onReusePrompt(e);
              }}
            >
              <HugeIcon name="arrow-turn-backward" size="xs" />
            </IconButton>
          )}
        </div>
      )}

      {/* ── Optional Children / Custom Overlay ── */}
      {children}
    </div>
  );
}

export default ProcessingCard;
