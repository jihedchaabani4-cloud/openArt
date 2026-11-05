"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * MediaViewCard - High-end, clean media display and selection tile
 * Modeled after Cinema Studio's MediaGridItem (rounded-2xl, video hover scrub, sleek shadow)
 * Pure media presentation: NO menus, NO action buttons, NO text labels.
 */
export const MediaViewCard = React.forwardRef(function MediaViewCard({
  item,
  itemUrl: propUrl,
  isVideo: propIsVideo,
  isSelected = false,
  isHighlighted = false,
  isDisabled = false,
  onSelect,
  onDoubleClick,
  width,
  height,
  aspectRatio,
  className,
}, ref) {
  const videoRef = useRef(null);

  // Motion values for video playback scrub bar
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);

  const effectiveUrl = propUrl || item?.url || item?.video?.url || item?.image?.url || "";
  const effectiveIsVideo = typeof propIsVideo === "boolean"
    ? propIsVideo
    : item?.is_video || item?.type === "video" || !!item?.video || /\.(mp4|webm|mov)$/i.test(effectiveUrl);

  const isCharacter = Boolean(
    item?.is_character ||
    item?.type === "character" ||
    ["CHARACTER", "CHARACTER_SHEET"].includes(String(item?.workflow_type || item?.workflowType || "").toUpperCase())
  );

  const isElement = Boolean(
    item?.is_element ||
    item?.type === "element" ||
    ["ELEMENT", "ELEMENT_SHEET"].includes(String(item?.workflow_type || item?.workflowType || "").toUpperCase())
  );

  // Video scrub progress tracking: driven by video play/pause/ended and timeupdate events
  useEffect(() => {
    if (!effectiveIsVideo) return;
    const video = videoRef.current;
    if (!video) return;

    let frameId = null;

    const updateProgress = () => {
      if (video.duration) {
        progress.set((video.currentTime / video.duration) * 100);
      }
    };

    const cancelLoop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const tick = () => {
      updateProgress();
      if (!video.paused && !video.ended) {
        frameId = requestAnimationFrame(tick);
      } else {
        frameId = null;
      }
    };

    const handlePlay = () => {
      cancelLoop();
      frameId = requestAnimationFrame(tick);
    };

    const handlePauseOrEnd = () => {
      cancelLoop();
      updateProgress();
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePauseOrEnd);
    video.addEventListener("ended", handlePauseOrEnd);
    video.addEventListener("timeupdate", updateProgress);

    return () => {
      cancelLoop();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePauseOrEnd);
      video.removeEventListener("ended", handlePauseOrEnd);
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, [effectiveIsVideo, progress]);

  const handleMouseEnter = () => {
    if (effectiveIsVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (effectiveIsVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      progress.set(0);
    }
  };

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="tile"
      onClick={() => {
        if (!isDisabled && onSelect) {
          onSelect(item);
        }
      }}
      onDoubleClick={() => {
        if (!isDisabled && onDoubleClick) {
          onDoubleClick(item);
        }
      }}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: width || (aspectRatio ? "100%" : undefined),
        height: height || undefined,
        aspectRatio: aspectRatio || undefined,
      }}
      className={cn(
        "group relative rounded-card overflow-hidden bg-[#0a0a0a] select-none border-none p-0 block text-left outline-none h-auto transition-all",
        "shadow-lg hover:shadow-2xl",
        isHighlighted
          ? "ring-2 ring-white shadow-2xl z-10"
          : isSelected
          ? "ring-2 ring-white"
          : "hover:ring-2 hover:ring-white/20",
        isDisabled
          ? "opacity-25 cursor-not-allowed"
          : "cursor-pointer",
        className
      )}
    >
      {/* Media Layer */}
      {effectiveIsVideo ? (
        <video
          ref={videoRef}
          src={effectiveUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={effectiveUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
      )}

      {/* Video Indicator Corner Badge */}
      {effectiveIsVideo && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none drop-shadow-md">
          <GoogleIcon iconName="play_arrow" fill weight={300} className="text-[13px] text-white" />
        </div>
      )}

      {/* Character Indicator Corner Badge */}
      {isCharacter && !effectiveIsVideo && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none drop-shadow-md text-white">
          <span
            className="material-symbols-outlined select-none text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 34" }}
          >
            accessibility_new
          </span>
        </div>
      )}

      {/* Element Indicator Corner Badge */}
      {isElement && !isCharacter && !effectiveIsVideo && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none drop-shadow-md text-white">
          <span
            className="material-symbols-outlined select-none text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
          >
            widgets
          </span>
        </div>
      )}

      {/* Video Scrub Bar (visible on hover) */}
      {effectiveIsVideo && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <motion.div
            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{ width: progressWidth }}
          />
        </div>
      )}

      {/* Selection Overlay & Checkmark */}
      {isSelected && (
        <div className="absolute inset-0 bg-white/10 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center shadow-xl">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.485 3.485a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06L5.75 10.19l6.72-6.705a.75.75 0 0 1 1.015 0z" />
            </svg>
          </div>
        </div>
      )}
    </Button>
  );
});
