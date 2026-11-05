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
        "relative overflow-hidden rounded-lg bg-[#17181a] select-none",
        !aspectRatio && !className?.includes("aspect-") && !style?.aspectRatio ? "aspect-video" : "",
        className
      )}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...style,
      }}
    >
      <style>{`
        @keyframes auroraDriftA {
          0% {
            transform: translate3d(28%, -15%, 0) scale(1);
            opacity: 0.85;
          }
          20% {
            transform: translate3d(-12%, 35%, 0) scale(1.15);
            opacity: 0.7;
          }
          40% {
            transform: translate3d(52%, 22%, 0) scale(0.9);
            opacity: 0.95;
          }
          60% {
            transform: translate3d(8%, -22%, 0) scale(1.1);
            opacity: 0.75;
          }
          80% {
            transform: translate3d(62%, -8%, 0) scale(0.95);
            opacity: 0.9;
          }
          100% {
            transform: translate3d(28%, -15%, 0) scale(1);
            opacity: 0.85;
          }
        }

        @keyframes auroraDriftB {
          0%, 100% {
            transform: translate3d(55%, 45%, 0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate3d(-8%, 5%, 0) scale(1.22);
            opacity: 0.65;
          }
        }

        .aurora-blob-a {
          animation: auroraDriftA 10s ease-in-out infinite;
        }

        .aurora-blob-b {
          animation: auroraDriftB 13s ease-in-out infinite;
        }
      `}</style>

      {/* ── Aurora Blobs Layer (extended bounds for smooth blur edges) ── */}
      <div className="absolute -inset-8 pointer-events-none overflow-hidden">
        {/* Blob A (Primary orbital drift) */}
        <div
          className="aurora-blob-a absolute top-0 left-0 rounded-full"
          style={{
            width: "68%",
            height: "78%",
            background: "radial-gradient(circle at center, rgba(245, 247, 252, 0.85) 0%, rgba(195, 202, 215, 0.45) 42%, rgba(160, 165, 175, 0) 72%)",
            filter: "blur(42px)",
            willChange: "transform, opacity",
          }}
        />

        {/* Blob B (Secondary ambient counter-drift) */}
        <div
          className="aurora-blob-b absolute top-0 left-0 rounded-full"
          style={{
            width: "52%",
            height: "62%",
            background: "radial-gradient(circle at center, rgba(230, 235, 245, 0.7) 0%, rgba(185, 190, 205, 0.35) 40%, rgba(150, 155, 165, 0) 70%)",
            filter: "blur(46px)",
            willChange: "transform, opacity",
          }}
        />
      </div>

      {/* ── Optional Top-Left Play Icon (Only when isVideo or showPlayIcon) ── */}
      {shouldShowPlayIcon && (
        <GoogleIcon iconName="play_arrow" fill={true} className="absolute left-3 top-3 text-sm text-white/50 pointer-events-none" />
      )}

      {/* ── Top-Right Progress Badge ── */}
      {hasProgress && (
        <span className="absolute right-3 top-3 text-[11px] font-medium text-white/60 tabular-nums pointer-events-none">
          {typeof progress === "number" ? Math.round(progress) : progress}%
        </span>
      )}

      {/* ── Optional Children / Custom Overlay ── */}
      {children}
    </div>
  );
}

export default ProcessingCard;
